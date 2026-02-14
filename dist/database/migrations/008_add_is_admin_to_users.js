"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.addColumn('users', 'is_admin', {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });
}
async function down(queryInterface) {
    await queryInterface.removeColumn('users', 'is_admin');
}
//# sourceMappingURL=008_add_is_admin_to_users.js.map