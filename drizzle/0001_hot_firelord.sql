CREATE TABLE `invitationLetters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL,
	`dateOfBirth` varchar(50) NOT NULL,
	`placeOfBirth` varchar(255) NOT NULL,
	`passportNumber` varchar(50) NOT NULL,
	`pdfUrl` text NOT NULL,
	`pdfKey` varchar(512) NOT NULL,
	`imageUrl` text,
	`imageKey` varchar(512),
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invitationLetters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `invitationLetters` ADD CONSTRAINT `invitationLetters_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;