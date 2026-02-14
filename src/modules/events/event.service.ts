import { Op } from 'sequelize';
import { Event, EventAttendance, Group, GroupMember, User } from '../../database/models';
import { AppError } from '../../shared/middleware/errorHandler';
import logger from '../../shared/utils/logger';
import { sequelize } from '../../config/database';


// ── Calculate next occurrence from a date + recurrence ──
function calculateNextOccurrence(
  dateStr: string,
  recurrence: 'none' | 'yearly' | 'monthly' | 'weekly'
): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDate = new Date(dateStr + 'T00:00:00Z');

  if (recurrence === 'none') {
    return dateStr;
  }

  let candidate = new Date(eventDate);

  if (recurrence === 'yearly') {
    candidate.setUTCFullYear(today.getUTCFullYear());
    if (candidate < today) {
      candidate.setUTCFullYear(today.getUTCFullYear() + 1);
    }
  }

  if (recurrence === 'monthly') {
    while (candidate < today) {
      candidate.setUTCMonth(candidate.getUTCMonth() + 1);
    }
  }

  if (recurrence === 'weekly') {
    while (candidate < today) {
      candidate.setUTCDate(candidate.getUTCDate() + 7);
    }
  }

  const yyyy = candidate.getUTCFullYear();
  const mm = String(candidate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(candidate.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ── Days until a date ──
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00Z');
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Relative label ──
function relativeLabel(dateStr: string): string {
  const d = daysUntil(dateStr);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d < 0) return `${Math.abs(d)} days ago`;
  if (d < 7) return `In ${d} days`;
  if (d < 30) return `In ${Math.floor(d / 7)} weeks`;
  return `In ${Math.floor(d / 30)} months`;
}

// ── Enrich event object ──
function enrichEvent(event: any): any {
  const raw = event.toJSON ? event.toJSON() : event;
  return {
    ...raw,
    days_until: daysUntil(raw.next_occurrence),
    relative_date: relativeLabel(raw.next_occurrence),
  };
}

interface CreateEventInput {
  title: string;
  person_name: string;
  event_type: string;
  custom_type_name?: string;
  event_date: string;
  event_time?: string;
  recurrence?: string;
  notes?: string;
  remind_on_day?: boolean;
  remind_days_before?: number[];
}

interface UpdateEventInput {
  title?: string;
  person_name?: string;
  event_type?: string;
  custom_type_name?: string;
  event_date?: string;
  event_time?: string | null;
  recurrence?: string;
  notes?: string | null;
  remind_on_day?: boolean;
  remind_days_before?: number[];
  is_active?: boolean;
}

interface EventQueryOptions {
  page?: number;
  limit?: number;
  type?: string;
  recurrence?: string;
  search?: string;
}

class EventService {
  // ══════════════════════════════════
  // CREATE EVENT
  // ══════════════════════════════════
  async createEvent(groupId: string, userId: string, input: CreateEventInput) {
    // Must be admin or owner
    await this.requireAdminAccess(groupId, userId);

    const recurrence = (input.recurrence as any) || 'yearly';
    const nextOccurrence = calculateNextOccurrence(input.event_date, recurrence);

    const event = await Event.create({
      group_id: groupId,
      title: input.title.trim(),
      person_name: input.person_name.trim(),
      event_type: input.event_type as any,
      custom_type_name: input.custom_type_name?.trim() || null,
      event_date: input.event_date,
      event_time: input.event_time || null,
      recurrence,
      notes: input.notes?.trim() || null,
      remind_on_day: input.remind_on_day !== false,
      remind_days_before: input.remind_days_before || [1],
      next_occurrence: nextOccurrence,
      is_active: true,
      created_by: userId,
    });

    logger.info(`Event created: ${event.id} in group ${groupId} by ${userId}`);

    return enrichEvent(event);
  }

  // ══════════════════════════════════
  // GET SINGLE EVENT
  // ══════════════════════════════════
  async getEvent(eventId: string, userId: string) {
    const event = await Event.findByPk(eventId, {
      include: [
        {
          model: Group,
          as: 'group',
          attributes: ['id', 'name', 'type'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Must be group member to view
    await this.requireMembership(event.group_id, userId);

    // Get attendance counts
    const attendanceCounts = await EventAttendance.findAll({
      where: { event_id: eventId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const counts: Record<string, number> = {
      going: 0,
      not_going: 0,
      maybe: 0,
      pending: 0,
    };

    for (const row of attendanceCounts as any[]) {
      counts[row.status] = parseInt(row.count, 10);
    }

    // Get current user's RSVP
    const myAttendance = await EventAttendance.findOne({
      where: { event_id: eventId, user_id: userId },
    });

    return {
      ...enrichEvent(event),
      attendance_summary: counts,
      my_rsvp: myAttendance
        ? {
            status: myAttendance.status,
            note: myAttendance.note,
            responded_at: myAttendance.responded_at,
          }
        : null,
    };
  }

  // ══════════════════════════════════
  // LIST GROUP EVENTS
  // ══════════════════════════════════
  async getGroupEvents(groupId: string, userId: string, options: EventQueryOptions) {
    await this.requireMembership(groupId, userId);

    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = {
      group_id: groupId,
      is_active: true,
    };

    if (options.type) {
      where.event_type = options.type;
    }

    if (options.recurrence) {
      where.recurrence = options.recurrence;
    }

    if (options.search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${options.search}%` } },
        { person_name: { [Op.iLike]: `%${options.search}%` } },
      ];
    }

    const { rows, count } = await Event.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name'],
        },
      ],
      order: [['next_occurrence', 'ASC']],
      limit,
      offset,
    });

    return {
      events: rows.map(enrichEvent),
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit),
        has_next: page < Math.ceil(count / limit),
        has_prev: page > 1,
      },
    };
  }

  // ══════════════════════════════════
  // TODAY'S EVENTS
  // ══════════════════════════════════
  async getTodayEvents(groupId: string, userId: string) {
    await this.requireMembership(groupId, userId);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const events = await Event.findAll({
      where: {
        group_id: groupId,
        is_active: true,
        next_occurrence: todayStr,
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name'],
        },
      ],
      order: [['event_time', 'ASC NULLS LAST']],
    });

    return events.map((e) => ({
      ...enrichEvent(e),
      is_today: true,
    }));
  }

  // ══════════════════════════════════
  // UPCOMING EVENTS
  // ══════════════════════════════════
  async getUpcomingEvents(groupId: string, userId: string, days: number = 30, limit: number = 20) {
    await this.requireMembership(groupId, userId);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);
    const futureStr = futureDate.toISOString().split('T')[0];

    const events = await Event.findAll({
      where: {
        group_id: groupId,
        is_active: true,
        next_occurrence: {
          [Op.between]: [todayStr, futureStr],
        },
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name'],
        },
      ],
      order: [['next_occurrence', 'ASC']],
      limit,
    });

    return events.map(enrichEvent);
  }

  // ══════════════════════════════════
  // DASHBOARD — all events across all user's groups
  // ══════════════════════════════════
  async getUserDashboard(userId: string, days: number = 30) {
    // Get all groups user belongs to
    const memberships = await GroupMember.findAll({
      where: { user_id: userId, status: 'active' },
      attributes: ['group_id'],
    });

    const groupIds = memberships.map((m) => m.group_id);

    if (groupIds.length === 0) {
      return { today_events: [], upcoming_events: [], total_events: 0 };
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);
    const futureStr = futureDate.toISOString().split('T')[0];

    // Today's events
    const todayEvents = await Event.findAll({
      where: {
        group_id: { [Op.in]: groupIds },
        is_active: true,
        next_occurrence: todayStr,
      },
      include: [
        { model: Group, as: 'group', attributes: ['id', 'name', 'type'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
      order: [['event_time', 'ASC NULLS LAST']],
    });

    // Upcoming events (next N days including today)
    const upcomingEvents = await Event.findAll({
      where: {
        group_id: { [Op.in]: groupIds },
        is_active: true,
        next_occurrence: {
          [Op.between]: [todayStr, futureStr],
        },
      },
      include: [
        { model: Group, as: 'group', attributes: ['id', 'name', 'type'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
      order: [['next_occurrence', 'ASC']],
      limit: Math.min(days * 3, 100),
    });

    // Total active events across all groups
    const totalEvents = await Event.count({
      where: {
        group_id: { [Op.in]: groupIds },
        is_active: true,
      },
    });

    return {
      today_events: todayEvents.map((e) => ({
        ...enrichEvent(e),
        is_today: true,
      })),
      upcoming_events: upcomingEvents.map(enrichEvent),
      total_events: totalEvents,
    };
  }

  // ══════════════════════════════════
  // UPDATE EVENT
  // ══════════════════════════════════
  async updateEvent(eventId: string, userId: string, input: UpdateEventInput) {
    const event = await Event.findByPk(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Must be admin/owner of the group
    await this.requireAdminAccess(event.group_id, userId);

    const updateData: Record<string, any> = {};

    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.person_name !== undefined) updateData.person_name = input.person_name.trim();
    if (input.event_type !== undefined) updateData.event_type = input.event_type;
    if (input.custom_type_name !== undefined) updateData.custom_type_name = input.custom_type_name?.trim() || null;
    if (input.event_date !== undefined) updateData.event_date = input.event_date;
    if (input.event_time !== undefined) updateData.event_time = input.event_time;
    if (input.recurrence !== undefined) updateData.recurrence = input.recurrence;
    if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null;
    if (input.remind_on_day !== undefined) updateData.remind_on_day = input.remind_on_day;
    if (input.remind_days_before !== undefined) updateData.remind_days_before = input.remind_days_before;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    // Recalculate next_occurrence if date or recurrence changed
    if (input.event_date !== undefined || input.recurrence !== undefined) {
      const eventDate = input.event_date || event.event_date;
      const recurrence = (input.recurrence || event.recurrence) as any;
      updateData.next_occurrence = calculateNextOccurrence(eventDate, recurrence);
    }

    await event.update(updateData);

    logger.info(`Event updated: ${eventId} by ${userId}`);

    return enrichEvent(event);
  }

  // ══════════════════════════════════
  // DELETE EVENT (soft delete)
  // ══════════════════════════════════
  async deleteEvent(eventId: string, userId: string) {
    const event = await Event.findByPk(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    await this.requireAdminAccess(event.group_id, userId);

    await event.update({ is_active: false });

    logger.info(`Event deleted (soft): ${eventId} by ${userId}`);
  }

  // ══════════════════════════════════
  // RSVP — respond to event
  // ══════════════════════════════════
  async respondRSVP(
    eventId: string,
    userId: string,
    input: { status: string; note?: string }
  ) {
    const event = await Event.findByPk(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }
    if (!event.is_active) {
      throw new AppError('Event is no longer active', 400);
    }
    if (daysUntil(event.next_occurrence) < -1) {
        throw new AppError('Cannot RSVP to past events', 400);
    }


    // Must be member of the group
    await this.requireMembership(event.group_id, userId);

    // Upsert attendance
    const existing = await EventAttendance.findOne({
      where: { event_id: eventId, user_id: userId },
    });

    if (existing) {
      await existing.update({
        status: input.status as any,
        note: input.note?.trim() || null,
        responded_at: new Date(),
      });

      logger.info(`RSVP updated: user ${userId} → ${input.status} for event ${eventId}`);

      return existing.toJSON();
    }

    const attendance = await EventAttendance.create({
      event_id: eventId,
      user_id: userId,
      status: input.status as any,
      note: input.note?.trim() || null,
      responded_at: new Date(),
    });

    logger.info(`RSVP created: user ${userId} → ${input.status} for event ${eventId}`);

    return attendance.toJSON();
  }

  // ══════════════════════════════════
  // GET EVENT ATTENDEES
  // ══════════════════════════════════
  async getEventAttendees(eventId: string, userId: string) {
    const event = await Event.findByPk(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    await this.requireMembership(event.group_id, userId);

    const attendees = await EventAttendance.findAll({
      where: { event_id: eventId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [
        ['status', 'ASC'],
        ['responded_at', 'DESC'],
      ],
    });

    // Build summary
    const summary: Record<string, number> = {
      going: 0,
      not_going: 0,
      maybe: 0,
      pending: 0,
    };

    const list = attendees.map((a) => {
      const raw = a.toJSON() as any;
      summary[raw.status] = (summary[raw.status] || 0) + 1;
      return {
        id: raw.id,
        user_id: raw.user_id,
        status: raw.status,
        note: raw.note,
        responded_at: raw.responded_at,
        user: raw.user,
      };
    });

    return {
      summary,
      attendees: list,
      total: list.length,
    };
  }

  // ══════════════════════════════════
  // ACCESS CONTROL HELPERS
  // (same pattern as group.service)
  // ══════════════════════════════════

  private async requireMembership(groupId: string, userId: string): Promise<void> {
    const member = await GroupMember.findOne({
      where: { group_id: groupId, user_id: userId, status: 'active' },
    });

    if (!member) {
      throw new AppError('You are not a member of this group', 403);
    }
  }

  private async requireAdminAccess(groupId: string, userId: string): Promise<void> {
    const member = await GroupMember.findOne({
      where: { group_id: groupId, user_id: userId, status: 'active' },
    });

    if (!member) {
      throw new AppError('You are not a member of this group', 403);
    }

    if (!['owner', 'admin'].includes(member.role)) {
      throw new AppError('Admin or owner access required', 403);
    }
  }
}

export const eventService = new EventService();