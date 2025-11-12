export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("post", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: Sequelize.STRING(512)
    },
    body: {
      type: Sequelize.TEXT("long")
    },
    created_at: Sequelize.INTEGER,
    updated_at: Sequelize.INTEGER,
    created_by: Sequelize.INTEGER
  });

  await queryInterface.addConstraint("post", {
    fields: ["created_by"],
    type: "foreign key",
    name: "FK_post_user_created_by",
    references: { table: "user", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
  });
}

export async function down(queryInterface) {
  await queryInterface.removeConstraint("post", "FK_post_user_created_by");
  await queryInterface.dropTable("post");
}
