ALTER TABLE `investment_products` MODIFY COLUMN `name` varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE `investment_products` ADD `company` varchar(128);--> statement-breakpoint
ALTER TABLE `investment_products` ADD `productLine` varchar(128);--> statement-breakpoint
ALTER TABLE `investment_products` ADD `riskLevel` varchar(64);--> statement-breakpoint
ALTER TABLE `investment_products` ADD `yearsToPension` int;--> statement-breakpoint
ALTER TABLE `investment_products` ADD `aop` decimal(6,4);--> statement-breakpoint
ALTER TABLE `investment_products` ADD `nhmId` varchar(32);