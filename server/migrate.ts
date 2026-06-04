import mysql from "mysql2/promise";

export async function runMigrations(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.log("[Migration] No DATABASE_URL set, skipping migrations");
    return;
  }

  let connection: mysql.Connection | null = null;
  
  try {
    console.log("[Migration] Running database migrations...");
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // Create users table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`openId\` varchar(64) NOT NULL,
        \`name\` text,
        \`email\` varchar(320),
        \`loginMethod\` varchar(64),
        \`role\` enum('user','admin') NOT NULL DEFAULT 'user',
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        \`lastSignedIn\` timestamp NOT NULL DEFAULT (now()),
        CONSTRAINT \`users_id\` PRIMARY KEY(\`id\`),
        CONSTRAINT \`users_openId_unique\` UNIQUE(\`openId\`)
      )
    `);
    
    // Add passwordHash column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE \`users\` ADD COLUMN \`passwordHash\` varchar(255)
      `);
      console.log("[Migration] Added passwordHash column");
    } catch (err: any) {
      // Column already exists - that's fine
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.warn("[Migration] Could not add passwordHash column:", err.message);
      }
    }
    
    console.log("[Migration] Database migrations completed successfully");
  } catch (error) {
    console.error("[Migration] Migration failed:", error);
    // Don't throw - allow server to start even if migration fails
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
