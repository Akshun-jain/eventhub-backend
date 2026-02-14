"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventController = void 0;
const event_service_1 = require("./event.service");
const response_1 = require("../../shared/utils/response");
class EventController {
    // POST /api/events/group/:groupId
    async createEvent(req, res, next) {
        try {
            const event = await event_service_1.eventService.createEvent(req.params.groupId, req.userId, req.body);
            (0, response_1.sendSuccess)(res, { event }, 'Event created', 201);
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/events/:eventId
    async getEvent(req, res, next) {
        try {
            const event = await event_service_1.eventService.getEvent(req.params.eventId, req.userId);
            (0, response_1.sendSuccess)(res, { event }, 'Event retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/events/group/:groupId
    async getGroupEvents(req, res, next) {
        try {
            const result = await event_service_1.eventService.getGroupEvents(req.params.groupId, req.userId, {
                page: req.query.page ? parseInt(req.query.page, 10) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
                type: req.query.type,
                recurrence: req.query.recurrence,
                search: req.query.search,
            });
            (0, response_1.sendSuccess)(res, result, 'Events retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/events/group/:groupId/today
    async getTodayEvents(req, res, next) {
        try {
            const events = await event_service_1.eventService.getTodayEvents(req.params.groupId, req.userId);
            (0, response_1.sendSuccess)(res, { events }, 'Today events retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/events/group/:groupId/upcoming
    async getUpcomingEvents(req, res, next) {
        try {
            const days = req.query.days ? parseInt(req.query.days, 10) : 30;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
            const events = await event_service_1.eventService.getUpcomingEvents(req.params.groupId, req.userId, days, limit);
            (0, response_1.sendSuccess)(res, { events }, 'Upcoming events retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/events/dashboard
    async getDashboard(req, res, next) {
        try {
            const days = req.query.days ? parseInt(req.query.days, 10) : 30;
            const result = await event_service_1.eventService.getUserDashboard(req.userId, days);
            (0, response_1.sendSuccess)(res, result, 'Dashboard retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // PUT /api/events/:eventId
    async updateEvent(req, res, next) {
        try {
            const event = await event_service_1.eventService.updateEvent(req.params.eventId, req.userId, req.body);
            (0, response_1.sendSuccess)(res, { event }, 'Event updated');
        }
        catch (error) {
            next(error);
        }
    }
    // DELETE /api/events/:eventId
    async deleteEvent(req, res, next) {
        try {
            await event_service_1.eventService.deleteEvent(req.params.eventId, req.userId);
            (0, response_1.sendSuccess)(res, null, 'Event deleted');
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/events/:eventId/rsvp
    async respondRSVP(req, res, next) {
        try {
            const attendance = await event_service_1.eventService.respondRSVP(req.params.eventId, req.userId, req.body);
            (0, response_1.sendSuccess)(res, { attendance }, 'RSVP recorded');
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/events/:eventId/attendees
    async getAttendees(req, res, next) {
        try {
            const result = await event_service_1.eventService.getEventAttendees(req.params.eventId, req.userId);
            (0, response_1.sendSuccess)(res, result, 'Attendees retrieved');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.eventController = new EventController();
//# sourceMappingURL=event.controller.js.map