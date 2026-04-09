CREATE TABLE `insurance_base_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`coverageType` varchar(64) NOT NULL,
	`ratePct` decimal(12,8) NOT NULL DEFAULT '0',
	`fixedKr` decimal(10,2) NOT NULL DEFAULT '0',
	`baselinePct` decimal(6,4) NOT NULL DEFAULT '1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insurance_base_prices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insurance_companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`useEaFormula` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insurance_companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insurance_salary_scale` (
	`id` int AUTO_INCREMENT NOT NULL,
	`salaryUpTo` int NOT NULL,
	`coveragePct` decimal(5,4) NOT NULL,
	CONSTRAINT `insurance_salary_scale_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `insurance_base_prices` ADD CONSTRAINT `insurance_base_prices_companyId_insurance_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `insurance_companies`(`id`) ON DELETE cascade ON UPDATE no action;