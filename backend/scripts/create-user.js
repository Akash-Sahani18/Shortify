const bcrypt = require("bcryptjs");
const oracledb = require("oracledb");
require("dotenv").config();

const [email, password] = process.argv.slice(2);

if (!email || !password || password.length < 8) {
  console.error("Usage: npm run create-user -- email@example.com password123");
  process.exit(1);
}

(async () => {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING
    });

    const passwordHash = await bcrypt.hash(password, 12);

    await connection.execute(
      `INSERT INTO users (email, password_hash)
       VALUES (:email, :passwordHash)`,
      { email: email.toLowerCase(), passwordHash },
      { autoCommit: true }
    );

    console.log(`User created: ${email}`);
  } catch (error) {
    console.error("CREATE USER ERROR:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.close();
  }
})();
