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

    // 9. Create business tables if they don't exist
    console.log("[Migration] Creating business tables if needed...");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`suppliers\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`contactName\` varchar(255) NOT NULL DEFAULT '',
        \`email\` varchar(320) NOT NULL DEFAULT '',
        \`phone\` varchar(50) NOT NULL DEFAULT '',
        \`address\` text NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`suppliers_id\` PRIMARY KEY(\`id\`)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`products\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`sku\` varchar(50) NOT NULL,
        \`barcode\` varchar(100) NOT NULL DEFAULT '',
        \`name\` varchar(255) NOT NULL,
        \`category\` varchar(100) NOT NULL DEFAULT 'Other',
        \`description\` text NOT NULL,
        \`costPrice\` decimal(12,2) NOT NULL DEFAULT 0,
        \`sellingPrice\` decimal(12,2) NOT NULL DEFAULT 0,
        \`stock\` int NOT NULL DEFAULT 0,
        \`lowStockThreshold\` int NOT NULL DEFAULT 10,
        \`supplierId\` int,
        \`imageUrl\` varchar(500),
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`products_id\` PRIMARY KEY(\`id\`),
        CONSTRAINT \`products_sku_unique\` UNIQUE(\`sku\`)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`sales\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`receiptNumber\` varchar(50) NOT NULL,
        \`items\` json NOT NULL,
        \`subtotal\` decimal(12,2) NOT NULL DEFAULT 0,
        \`discount\` decimal(12,2) NOT NULL DEFAULT 0,
        \`tax\` decimal(12,2) NOT NULL DEFAULT 0,
        \`total\` decimal(12,2) NOT NULL DEFAULT 0,
        \`profit\` decimal(12,2) NOT NULL DEFAULT 0,
        \`paymentMethod\` enum('Cash','Card','Mobile') NOT NULL DEFAULT 'Cash',
        \`customerName\` varchar(255),
        \`saleDate\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`notes\` text NOT NULL,
        \`createdBy\` int,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`sales_id\` PRIMARY KEY(\`id\`),
        CONSTRAINT \`sales_receiptNumber_unique\` UNIQUE(\`receiptNumber\`)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`expenses\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`expenseNumber\` varchar(50) NOT NULL,
        \`category\` varchar(100) NOT NULL DEFAULT 'Other',
        \`description\` varchar(500) NOT NULL DEFAULT '',
        \`amount\` decimal(12,2) NOT NULL DEFAULT 0,
        \`paymentMethod\` enum('Cash','Card','Bank Transfer','Mobile') NOT NULL DEFAULT 'Cash',
        \`vendor\` varchar(255),
        \`receiptRef\` varchar(100),
        \`expenseDate\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`notes\` text NOT NULL,
        \`createdBy\` int,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`expenses_id\` PRIMARY KEY(\`id\`),
        CONSTRAINT \`expenses_expenseNumber_unique\` UNIQUE(\`expenseNumber\`)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`purchase_orders\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`orderNumber\` varchar(50) NOT NULL,
        \`supplierId\` int,
        \`supplierName\` varchar(255) NOT NULL DEFAULT '',
        \`items\` json NOT NULL,
        \`totalAmount\` decimal(12,2) NOT NULL DEFAULT 0,
        \`status\` enum('Pending','Received','Cancelled') NOT NULL DEFAULT 'Pending',
        \`orderDate\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`expectedDate\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`receivedDate\` timestamp,
        \`notes\` text NOT NULL,
        \`createdBy\` int,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`purchase_orders_id\` PRIMARY KEY(\`id\`),
        CONSTRAINT \`purchase_orders_orderNumber_unique\` UNIQUE(\`orderNumber\`)
      )
    `);

    console.log("[Migration] Business tables ready");
    console.log("[Migration] All migrations completed successfully");
  } catch (error) {
    console.error("[Migration] Migration failed:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
