"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
const response_1 = require("../utils/response");
function requireAdmin(req, res, next) {
    if (!req.user || !req.user.is_admin) {
        (0, response_1.sendError)(res, 'Admin access required', 403);
        return;
    }
    next();
}
//# sourceMappingURL=requireAdmin.js.map