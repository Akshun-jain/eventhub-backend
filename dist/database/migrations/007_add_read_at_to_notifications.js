"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.addColumn('notifications', 'read_at', {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    });
    await queryInterface.addIndex('notifications', ['user_id', 'read_at'], {
        name: 'idx_notifications_user_unread',
    });
}
async function down(queryInterface) {
    await queryInterface.removeIndex('notifications', 'idx_notifications_user_unread');
    await queryInterface.removeColumn('notifications', 'read_at');
}
//# sourceMappingURL=007_add_read_at_to_notifications.js.map