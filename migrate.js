const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "blog_platform",
  password: "root",
  port: 5432,
});

async function runMigrations() {
  try {
    console.log("Migration boshlanyapti...");

    const migrationsPath = path.join(__dirname, "migrations");
    const files = fs.readdirSync(migrationsPath);

    for (const file of files) {
      const filePath = path.join(migrationsPath, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`Running: ${file}`);
      await pool.query(sql);
    }

    console.log("Migration tugadi ✅");
    process.exit();
  } catch (error) {
    console.error("Migration error:", error.message);
    process.exit(1);
  }
}

runMigrations();