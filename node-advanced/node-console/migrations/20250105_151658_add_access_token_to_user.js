export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("user", "access_token", {
    type: Sequelize.STRING(512),
    allowNull: true,
    after: "auth_key"
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("user", "access_token");
}
