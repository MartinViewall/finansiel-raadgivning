CREATE TABLE `annual_returns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`year` int NOT NULL,
	`returnPct` decimal(8,4) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `annual_returns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investment_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`color` varchar(16) NOT NULL DEFAULT '#4f46e5',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investment_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `annual_returns` ADD CONSTRAINT `annual_returns_productId_investment_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `investment_products`(`id`) ON DELETE cascade ON UPDATE no action;