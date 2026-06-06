CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expenseNumber` varchar(50) NOT NULL,
	`category` varchar(100) NOT NULL DEFAULT 'Other',
	`description` varchar(500) NOT NULL DEFAULT '',
	`amount` decimal(12,2) NOT NULL DEFAULT '0',
	`paymentMethod` enum('Cash','Card','Bank Transfer','Mobile') NOT NULL DEFAULT 'Cash',
	`vendor` varchar(255),
	`receiptRef` varchar(100),
	`expenseDate` timestamp NOT NULL DEFAULT (now()),
	`notes` text NOT NULL DEFAULT (''),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`),
	CONSTRAINT `expenses_expenseNumber_unique` UNIQUE(`expenseNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(50) NOT NULL,
	`barcode` varchar(100) NOT NULL DEFAULT '',
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL DEFAULT 'Other',
	`description` text NOT NULL DEFAULT (''),
	`costPrice` decimal(12,2) NOT NULL DEFAULT '0',
	`sellingPrice` decimal(12,2) NOT NULL DEFAULT '0',
	`stock` int NOT NULL DEFAULT 0,
	`lowStockThreshold` int NOT NULL DEFAULT 10,
	`supplierId` int,
	`imageUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`supplierId` int,
	`supplierName` varchar(255) NOT NULL DEFAULT '',
	`items` json NOT NULL,
	`totalAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`status` enum('Pending','Received','Cancelled') NOT NULL DEFAULT 'Pending',
	`orderDate` timestamp NOT NULL DEFAULT (now()),
	`expectedDate` timestamp NOT NULL DEFAULT (now()),
	`receivedDate` timestamp,
	`notes` text NOT NULL DEFAULT (''),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchase_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchase_orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`receiptNumber` varchar(50) NOT NULL,
	`items` json NOT NULL,
	`subtotal` decimal(12,2) NOT NULL DEFAULT '0',
	`discount` decimal(12,2) NOT NULL DEFAULT '0',
	`tax` decimal(12,2) NOT NULL DEFAULT '0',
	`total` decimal(12,2) NOT NULL DEFAULT '0',
	`profit` decimal(12,2) NOT NULL DEFAULT '0',
	`paymentMethod` enum('Cash','Card','Mobile') NOT NULL DEFAULT 'Cash',
	`customerName` varchar(255),
	`saleDate` timestamp NOT NULL DEFAULT (now()),
	`notes` text NOT NULL DEFAULT (''),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_receiptNumber_unique` UNIQUE(`receiptNumber`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`contactName` varchar(255) NOT NULL DEFAULT '',
	`email` varchar(320) NOT NULL DEFAULT '',
	`phone` varchar(50) NOT NULL DEFAULT '',
	`address` text NOT NULL DEFAULT (''),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','sales') NOT NULL DEFAULT 'sales';--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;