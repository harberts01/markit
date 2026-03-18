// Simple script to create the markit database
const { Client } = require("pg");
require("dotenv").config();

async function createDatabase() {
  // Connect to default postgres database
  const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "qo60RYm72ow3",
    database: "postgres",
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL");

    // Check if database exists
    const res = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = 'markit'
    `);

    if (res.rows.length === 0) {
      // Create database
      await client.query("CREATE DATABASE markit");
      console.log('✓ Database "markit" created successfully');
    } else {
      console.log('✓ Database "markit" already exists');
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
