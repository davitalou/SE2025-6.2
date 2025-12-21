"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("user", "verification_token", {
    type: Sequelize.STRING(255),
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("user", "verification_token");
}
