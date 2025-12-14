export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("user", "verification_token", {
    type: Sequelize.STRING,
    allowNull: true
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("user", "verification_token");
}
