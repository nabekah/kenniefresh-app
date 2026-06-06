CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `contactName` varchar(255) NOT NULL DEFAULT '',
  `email` varchar(320) NOT NULL DEFAULT '',
  `phone` varchar(50) NOT NULL DEFAULT '',
  `address` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `products` (
  `id` int AUTO_INCREMENT NOT NULL,
  `sku` varchar(50) NOT NULL,
  `barcode` varchar(100) NOT NULL DEFAULT '',
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Other',
  `description` text NOT NULL,
  `costPrice` decimal(12,2) NOT NULL DEFAULT 0,
  `sellingPrice` decimal(12,2) NOT NULL DEFAULT 0,
  `stock` int NOT NULL DEFAULT 0,
  `lowStockThreshold` int NOT NULL DEFAULT 10,
  `supplierId` int,
  `imageUrl` varchar(500),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `products_id` PRIMARY KEY(`id`),
  CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);

CREATE TABLE IF NOT EXISTS `sales` (
  `id` int AUTO_INCREMENT NOT NULL,
  `receiptNumber` varchar(50) NOT NULL,
  `items` json NOT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0,
  `discount` decimal(12,2) NOT NULL DEFAULT 0,
  `tax` decimal(12,2) NOT NULL DEFAULT 0,
  `total` decimal(12,2) NOT NULL DEFAULT 0,
  `profit` decimal(12,2) NOT NULL DEFAULT 0,
  `paymentMethod` enum('Cash','Card','Mobile') NOT NULL DEFAULT 'Cash',
  `customerName` varchar(255),
  `saleDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text NOT NULL,
  `createdBy` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `sales_id` PRIMARY KEY(`id`),
  CONSTRAINT `sales_receiptNumber_unique` UNIQUE(`receiptNumber`)
);

CREATE TABLE IF NOT EXISTS `expenses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `expenseNumber` varchar(50) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Other',
  `description` varchar(500) NOT NULL DEFAULT '',
  `amount` decimal(12,2) NOT NULL DEFAULT 0,
  `paymentMethod` enum('Cash','Card','Bank Transfer','Mobile') NOT NULL DEFAULT 'Cash',
  `vendor` varchar(255),
  `receiptRef` varchar(100),
  `expenseDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text NOT NULL,
  `createdBy` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `expenses_id` PRIMARY KEY(`id`),
  CONSTRAINT `expenses_expenseNumber_unique` UNIQUE(`expenseNumber`)
);

CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderNumber` varchar(50) NOT NULL,
  `supplierId` int,
  `supplierName` varchar(255) NOT NULL DEFAULT '',
  `items` json NOT NULL,
  `totalAmount` decimal(12,2) NOT NULL DEFAULT 0,
  `status` enum('Pending','Received','Cancelled') NOT NULL DEFAULT 'Pending',
  `orderDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expectedDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `receivedDate` timestamp,
  `notes` text NOT NULL,
  `createdBy` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `purchase_orders_id` PRIMARY KEY(`id`),
  CONSTRAINT `purchase_orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
