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
    
    // Clean up users without passwordHash (created before the column was added)
    // These users cannot login, so they need to re-register
    try {
      const [result] = await connection.execute(
        `DELETE FROM \`users\` WHERE \`passwordHash\` IS NULL AND \`loginMethod\` = 'email'`
      ) as any[];
      const deleted = result?.affectedRows ?? 0;
      if (deleted > 0) {
        console.log(`[Migration] Cleaned up ${deleted} user(s) without passwordHash`);
      }
    } catch (err: any) {
      console.warn("[Migration] Could not clean up users without passwordHash:", err.message);
    }

    // Remove test/temporary accounts created during setup
    try {
      const [delResult] = await connection.execute(
        `DELETE FROM \`users\` WHERE \`email\` = 'noah@kenniefresh.biz'`
      ) as any[];
      if ((delResult as any)?.affectedRows > 0) {
        console.log('[Migration] Removed test account noah@kenniefresh.biz');
      }
    } catch (err: any) {
      console.warn('[Migration] Could not remove test account:', err.message);
    }

    // Ensure at least one admin exists: promote admin@kenniefresh.biz to admin
    try {
      const [adminRows] = await connection.execute(
        `SELECT COUNT(*) as count FROM \`users\` WHERE \`role\` = 'admin'`
      ) as any[];
      const adminCount = (adminRows as any[])[0]?.count ?? 0;
      if (adminCount === 0) {
        const [updateResult] = await connection.execute(
          `UPDATE \`users\` SET \`role\` = 'admin' WHERE \`loginMethod\` = 'email' ORDER BY \`id\` ASC LIMIT 1`
        ) as any[];
        if ((updateResult as any)?.affectedRows > 0) {
          console.log('[Migration] Promoted first email user to admin role');
        }
      }
    } catch (err: any) {
      console.warn('[Migration] Could not promote admin user:', err.message);
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
