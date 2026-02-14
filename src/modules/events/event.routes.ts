import { Router } from 'express';
import { eventController } from './event.controller';
import { authMiddleware } from '../auth/auth.middleware';
import {
  validateGroupId,
  validateEventId,
  validateCreateEvent,
  validateUpdateEvent,
  validateRSVP,
  validateEventQuery,
} from './event.validators';

const router = Router();

// All event routes require authentication
router.use(authMiddleware);

// ══════════════════════════════════
// DASHBOARD (all user's groups)
// ══════════════════════════════════
router.get('/dashboard', (req, res, next) =>
  eventController.getDashboard(req, res, next)
);

// ══════════════════════════════════
// GROUP-SCOPED EVENT ROUTES
// ══════════════════════════════════

// List events for a group
router.get(
  '/group/:groupId',
  validateGroupId,
  validateEventQuery,
  (req, res, next) => eventController.getGroupEvents(req, res, next)
);

// Today's events for a group
router.get(
  '/group/:groupId/today',
  validateGroupId,
  (req, res, next) => eventController.getTodayEvents(req, res, next)
);

// Upcoming events for a group
router.get(
  '/group/:groupId/upcoming',
  validateGroupId,
  (req, res, next) => eventController.getUpcomingEvents(req, res, next)
);

// Create event in a group
router.post(
  '/group/:groupId',
  validateGroupId,
  validateCreateEvent,
  (req, res, next) => eventController.createEvent(req, res, next)
);

// ══════════════════════════════════
// SINGLE EVENT ROUTES
// ══════════════════════════════════

// Get single event
router.get(
  '/:eventId',
  validateEventId,
  (req, res, next) => eventController.getEvent(req, res, next)
);

// Update event
router.put(
  '/:eventId',
  validateEventId,
  validateUpdateEvent,
  (req, res, next) => eventController.updateEvent(req, res, next)
);

// Delete event
router.delete(
  '/:eventId',
  validateEventId,
  (req, res, next) => eventController.deleteEvent(req, res, next)
);

// ══════════════════════════════════
// RSVP / ATTENDANCE
// ══════════════════════════════════

// Respond to event (RSVP)
router.post(
  '/:eventId/rsvp',
  validateEventId,
  validateRSVP,
  (req, res, next) => eventController.respondRSVP(req, res, next)
);

// Get event attendees
router.get(
  '/:eventId/attendees',
  validateEventId,
  (req, res, next) => eventController.getAttendees(req, res, next)
);

export default router;