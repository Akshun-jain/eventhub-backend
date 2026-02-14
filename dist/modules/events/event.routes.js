"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("./event.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const event_validators_1 = require("./event.validators");
const router = (0, express_1.Router)();
// All event routes require authentication
router.use(auth_middleware_1.authMiddleware);
// ══════════════════════════════════
// DASHBOARD (all user's groups)
// ══════════════════════════════════
router.get('/dashboard', (req, res, next) => event_controller_1.eventController.getDashboard(req, res, next));
// ══════════════════════════════════
// GROUP-SCOPED EVENT ROUTES
// ══════════════════════════════════
// List events for a group
router.get('/group/:groupId', event_validators_1.validateGroupId, event_validators_1.validateEventQuery, (req, res, next) => event_controller_1.eventController.getGroupEvents(req, res, next));
// Today's events for a group
router.get('/group/:groupId/today', event_validators_1.validateGroupId, (req, res, next) => event_controller_1.eventController.getTodayEvents(req, res, next));
// Upcoming events for a group
router.get('/group/:groupId/upcoming', event_validators_1.validateGroupId, (req, res, next) => event_controller_1.eventController.getUpcomingEvents(req, res, next));
// Create event in a group
router.post('/group/:groupId', event_validators_1.validateGroupId, event_validators_1.validateCreateEvent, (req, res, next) => event_controller_1.eventController.createEvent(req, res, next));
// ══════════════════════════════════
// SINGLE EVENT ROUTES
// ══════════════════════════════════
// Get single event
router.get('/:eventId', event_validators_1.validateEventId, (req, res, next) => event_controller_1.eventController.getEvent(req, res, next));
// Update event
router.put('/:eventId', event_validators_1.validateEventId, event_validators_1.validateUpdateEvent, (req, res, next) => event_controller_1.eventController.updateEvent(req, res, next));
// Delete event
router.delete('/:eventId', event_validators_1.validateEventId, (req, res, next) => event_controller_1.eventController.deleteEvent(req, res, next));
// ══════════════════════════════════
// RSVP / ATTENDANCE
// ══════════════════════════════════
// Respond to event (RSVP)
router.post('/:eventId/rsvp', event_validators_1.validateEventId, event_validators_1.validateRSVP, (req, res, next) => event_controller_1.eventController.respondRSVP(req, res, next));
// Get event attendees
router.get('/:eventId/attendees', event_validators_1.validateEventId, (req, res, next) => event_controller_1.eventController.getAttendees(req, res, next));
exports.default = router;
//# sourceMappingURL=event.routes.js.map