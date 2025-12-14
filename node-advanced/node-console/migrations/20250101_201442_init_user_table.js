export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("user", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    auth_key: {
      type: Sequelize.STRING(32),
      allowNull: false
    },
    password_hash: {
      type: Sequelize.STRING,
      allowNull: false
    },
    password_reset_token: {
      type: Sequelize.STRING,
      unique: true
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: Sequelize.SMALLINT,
      allowNull: false,
      defaultValue: 10
    },
    created_at: Sequelize.INTEGER,
    updated_at: Sequelize.INTEGER
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("user");
}
