import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { eventService } from './event.service';
import { sendSuccess } from '../../shared/utils/response';

class EventController {
  // POST /api/events/group/:groupId
  async createEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventService.createEvent(
        req.params.groupId,
        req.userId!,
        req.body
      );
      sendSuccess(res, { event }, 'Event created', 201);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/events/:eventId
  async getEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventService.getEvent(req.params.eventId, req.userId!);
      sendSuccess(res, { event }, 'Event retrieved');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/events/group/:groupId
  async getGroupEvents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await eventService.getGroupEvents(
        req.params.groupId,
        req.userId!,
        {
          page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
          limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
          type: req.query.type as string | undefined,
          recurrence: req.query.recurrence as string | undefined,
          search: req.query.search as string | undefined,
        }
      );
      sendSuccess(res, result, 'Events retrieved');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/events/group/:groupId/today
  async getTodayEvents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await eventService.getTodayEvents(req.params.groupId, req.userId!);
      sendSuccess(res, { events }, 'Today events retrieved');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/events/group/:groupId/upcoming
  async getUpcomingEvents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const events = await eventService.getUpcomingEvents(
        req.params.groupId,
        req.userId!,
        days,
        limit
      );
      sendSuccess(res, { events }, 'Upcoming events retrieved');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/events/dashboard
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const result = await eventService.getUserDashboard(req.userId!, days);
      sendSuccess(res, result, 'Dashboard retrieved');
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/events/:eventId
  async updateEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventService.updateEvent(
        req.params.eventId,
        req.userId!,
        req.body
      );
      sendSuccess(res, { event }, 'Event updated');
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/events/:eventId
  async deleteEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await eventService.deleteEvent(req.params.eventId, req.userId!);
      sendSuccess(res, null, 'Event deleted');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/events/:eventId/rsvp
  async respondRSVP(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const attendance = await eventService.respondRSVP(
        req.params.eventId,
        req.userId!,
        req.body
      );
      sendSuccess(res, { attendance }, 'RSVP recorded');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/events/:eventId/attendees
  async getAttendees(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await eventService.getEventAttendees(
        req.params.eventId,
        req.userId!
      );
      sendSuccess(res, result, 'Attendees retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const eventController = new EventController();