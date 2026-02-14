"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const router = (0, express_1.Router)();
// All user routes are protected
router.use(auth_middleware_1.authMiddleware);
router.get('/profile', (req, res, next) => user_controller_1.userController.getProfile(req, res, next));
router.put('/profile', (req, res, next) => user_controller_1.userController.updateProfile(req, res, next));
router.delete('/account', (req, res, next) => user_controller_1.userController.deleteAccount(req, res, next));
exports.default = router;
//# sourceMappingURL=user.routes.js.map