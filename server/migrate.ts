import mysql from "mysql2/promise";
import { hashPassword } from "./railwayAuth";

export async function runMigrations(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.log("[Migration] No DATABASE_URL set, skipping migrations");
    return;
  }

  let connection: mysql.Connection | null = null;

  try {
    console.log("[Migration] Running database migrations...");
    connection = await mysql.createConnection(process.env.DATABASE_URL);

    // 1. Create users table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`openId\` varchar(64) NOT NULL,
        \`name\` text,
        \`email\` varchar(320),
        \`loginMethod\` varchar(64),
        \`role\` enum('user','admin','sales') NOT NULL DEFAULT 'sales',
        \`isActive\` boolean NOT NULL DEFAULT TRUE,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        \`lastSignedIn\` timestamp NOT NULL DEFAULT (now()),
        CONSTRAINT \`users_id\` PRIMARY KEY(\`id\`),
        CONSTRAINT \`users_openId_unique\` UNIQUE(\`openId\`)
      )
    `);

    // 2. Add passwordHash column if missing
    try {
      await connection.execute(`ALTER TABLE \`users\` ADD COLUMN \`passwordHash\` varchar(255)`);
      console.log("[Migration] Added passwordHash column");
    } catch (err: any) {
      if (err.code !== "ER_DUP_FIELDNAME") {
        console.warn("[Migration] Could not add passwordHash column:", err.message);
      }
    }

    // 3. Add isActive column if missing
    try {
      await connection.execute(`ALTER TABLE \`users\` ADD COLUMN \`isActive\` boolean NOT NULL DEFAULT TRUE`);
      console.log("[Migration] Added isActive column");
    } catch (err: any) {
      if (err.code !== "ER_DUP_FIELDNAME") {
        console.warn("[Migration] Could not add isActive column:", err.message);
      }
    }

    // 4. Update role enum to include 'sales' if not already present
    try {
      const [roleCols] = await connection.execute(`SHOW COLUMNS FROM \`users\` LIKE 'role'`) as [Array<{Type: string}>, unknown];
      if (roleCols.length > 0 && !roleCols[0].Type.includes("sales")) {
        await connection.execute(
          `ALTER TABLE \`users\` MODIFY COLUMN \`role\` enum('user','admin','sales') NOT NULL DEFAULT 'sales'`
        );
        console.log("[Migration] Updated role enum to include 'sales'");
      }
    } catch (err: any) {
      console.warn("[Migration] Could not update role enum:", err.message);
    }

    // 5. Clean up users without passwordHash (incomplete registrations)
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

    // 6. Remove test accounts
    try {
      const [delResult] = await connection.execute(
        `DELETE FROM \`users\` WHERE \`email\` = 'noah@kenniefresh.biz'`
      ) as any[];
      if ((delResult as any)?.affectedRows > 0) {
        console.log("[Migration] Removed test account noah@kenniefresh.biz");
      }
    } catch (err: any) {
      console.warn("[Migration] Could not remove test account:", err.message);
    }

    // 7. Ensure default admin account exists
    const ADMIN_EMAIL = "admin@kenniefresh.biz";
    const ADMIN_PASSWORD = "KFresh2024!";
    const ADMIN_NAME = "Admin";
    const ADMIN_OPEN_ID = "local_admin_kenniefresh";

    try {
      const [adminRows] = await connection.execute(
        `SELECT id, role, passwordHash FROM \`users\` WHERE \`email\` = ?`,
        [ADMIN_EMAIL]
      ) as [Array<{id: number; role: string; passwordHash: string | null}>, unknown];

      if (adminRows.length === 0) {
        const passwordHash = await hashPassword(ADMIN_PASSWORD);
        await connection.execute(
          `INSERT INTO \`users\` (\`openId\`, \`name\`, \`email\`, \`loginMethod\`, \`role\`, \`isActive\`, \`passwordHash\`, \`lastSignedIn\`)
           VALUES (?, ?, ?, 'email', 'admin', TRUE, ?, NOW())`,
          [ADMIN_OPEN_ID, ADMIN_NAME, ADMIN_EMAIL, passwordHash]
        );
        console.log("[Migration] Created default admin account: admin@kenniefresh.biz");
      } else {
        // Ensure admin role and active status
        if (adminRows[0].role !== "admin") {
          await connection.execute(
            `UPDATE \`users\` SET \`role\` = 'admin', \`isActive\` = TRUE WHERE \`email\` = ?`,
            [ADMIN_EMAIL]
          );
          console.log("[Migration] Promoted admin@kenniefresh.biz to admin role");
        }
        // Ensure password is set
        if (!adminRows[0].passwordHash) {
          const passwordHash = await hashPassword(ADMIN_PASSWORD);
          await connection.execute(
            `UPDATE \`users\` SET \`passwordHash\` = ? WHERE \`email\` = ?`,
            [passwordHash, ADMIN_EMAIL]
          );
          console.log("[Migration] Set password for admin@kenniefresh.biz");
        }
      }
    } catch (err: any) {
      console.warn("[Migration] Could not ensure admin account:", err.message);
    }

    // 8. If still no admin, promote first email user
    try {
      const [admins] = await connection.execute(
        `SELECT COUNT(*) as count FROM \`users\` WHERE \`role\` = 'admin'`
      ) as any[];
      const adminCount = (admins as any[])[0]?.count ?? 0;
      if (adminCount === 0) {
        const [updateResult] = await connection.execute(
          `UPDATE \`users\` SET \`role\` = 'admin' WHERE \`loginMethod\` = 'email' ORDER BY \`id\` ASC LIMIT 1`
        ) as any[];
        if ((updateResult as any)?.affectedRows > 0) {
          console.log("[Migration] Promoted first email user to admin role");
        }
      }
    } catch (err: any) {
      console.warn("[Migration] Could not promote admin user:", err.message);
    }

    console.log("[Migration] All migrations completed successfully");
  } catch (error) {
    console.error("[Migration] Migration failed:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
