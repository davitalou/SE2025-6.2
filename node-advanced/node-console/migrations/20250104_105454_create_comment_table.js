export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("comment", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    title: Sequelize.STRING(512),
    body: Sequelize.TEXT,
    post_id: Sequelize.INTEGER,
    created_at: Sequelize.INTEGER,
    updated_at: Sequelize.INTEGER,
    created_by: Sequelize.INTEGER
  });

  await queryInterface.addConstraint("comment", {
    fields: ["created_by"],
    type: "foreign key",
    name: "FK_comment_user_created_by",
    references: { table: "user", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
  });

  await queryInterface.addConstraint("comment", {
    fields: ["post_id"],
    type: "foreign key",
    name: "FK_comment_post_post_id",
    references: { table: "post", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  });
}

export async function down(queryInterface) {
  await queryInterface.removeConstraint("comment", "FK_comment_user_created_by");
  await queryInterface.removeConstraint("comment", "FK_comment_post_post_id");
  await queryInterface.dropTable("comment");
}
