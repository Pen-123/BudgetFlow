CREATE TABLE `alternativeSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalItemId` int NOT NULL,
	`originalItemName` varchar(255) NOT NULL,
	`originalPrice` decimal(10,2) NOT NULL,
	`alternativeItemName` varchar(255) NOT NULL,
	`alternativePrice` decimal(10,2) NOT NULL,
	`savingsAmount` decimal(10,2),
	`savingsPercentage` decimal(5,2),
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alternativeSuggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgetLimits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`limitAmount` decimal(10,2) NOT NULL,
	`period` enum('weekly','monthly','yearly') DEFAULT 'monthly',
	`notificationSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgetLimits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receiptItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`receiptId` int NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`quantity` decimal(10,2) DEFAULT 1,
	`unitPrice` decimal(10,2),
	`totalPrice` decimal(10,2) NOT NULL,
	`category` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `receiptItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`merchantName` varchar(255),
	`receiptDate` timestamp,
	`totalAmount` decimal(10,2),
	`imageUrl` text,
	`imageKey` varchar(255),
	`extractedData` json,
	`status` enum('pending','processed','failed') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savingsGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`goalName` varchar(255) NOT NULL,
	`description` text,
	`targetAmount` decimal(12,2) NOT NULL,
	`currentAmount` decimal(12,2) DEFAULT 0,
	`targetDate` timestamp,
	`status` enum('active','completed','abandoned') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savingsGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spendingInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`period` varchar(20) NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`totalSpent` decimal(12,2),
	`spendingScore` int,
	`categoryBreakdown` json,
	`summary` text,
	`recommendations` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spendingInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`receiptId` int,
	`description` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`category` varchar(100) NOT NULL,
	`merchantName` varchar(255),
	`transactionDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`notificationsEnabled` boolean DEFAULT true,
	`budgetAlertThreshold` decimal(5,2) DEFAULT 90,
	`theme` varchar(20) DEFAULT 'light',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPreferences_userId_unique` UNIQUE(`userId`)
);
