import bcrypt from "bcrypt";

export async function up(queryInterface, Sequelize) {
  const passwordHash = await bcrypt.hash("123456", 10);
  const timestamp = Math.floor(Date.now() / 1000);

  // Kiểm tra user có tồn tại chưa
  const [user] = await queryInterface.sequelize.query(
    `SELECT id FROM user WHERE username = 'admin' LIMIT 1;`
  );

  if (user.length === 0) {
    await queryInterface.bulkInsert("user", [
      {
        username: "admin",
        auth_key: "authkey_sample_123",
        access_token: null,
        password_hash: passwordHash,
        password_reset_token: null,
        email: "admin@example.com",
        status: 10,
        created_at: timestamp,
        updated_at: timestamp,
        verification_token: null,
      },
    ]);
    console.log("Admin user created successfully");
  } else {
    console.log("Admin user already exists, skipping seeder");
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("user", { username: "admin" });
}
