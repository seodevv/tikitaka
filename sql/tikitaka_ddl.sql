/*
SQLyog Community v13.2.0 (64 bit)
MySQL - 10.6.15-MariaDB : Database - chat
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
USE `chat`;

/*Table structure for table `alarm` */

CREATE TABLE `alarm` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `source` int(8) NOT NULL,
  `target` int(8) NOT NULL,
  `type` varchar(32) NOT NULL,
  `chatId` varchar(16) DEFAULT NULL,
  `socialId` int(8) DEFAULT NULL,
  `created` datetime NOT NULL DEFAULT current_timestamp(),
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk-user-alarm-id-1` (`source`),
  KEY `fk-user-alarm-id-2` (`target`),
  KEY `fk-chat-alarm-id` (`chatId`),
  KEY `fk-social-alarm-id` (`socialId`),
  CONSTRAINT `fk-chat-alarm-id` FOREIGN KEY (`chatId`) REFERENCES `chat` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk-social-alarm-id` FOREIGN KEY (`socialId`) REFERENCES `social` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk-user-alarm-id-1` FOREIGN KEY (`source`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk-user-alarm-id-2` FOREIGN KEY (`target`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=184 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `chat` */

CREATE TABLE `chat` (
  `id` varchar(16) NOT NULL,
  `creator` int(8) NOT NULL,
  `target` int(8) NOT NULL,
  `pined` tinyint(1) NOT NULL DEFAULT 0,
  `lastChatId` int(8) DEFAULT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active',
  `created` datetime NOT NULL DEFAULT current_timestamp(),
  `modified` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`,`creator`,`target`),
  KEY `fk-user-chat-1` (`creator`),
  KEY `fk-user-chat-2` (`target`),
  KEY `fk-chat-message-chat` (`lastChatId`),
  CONSTRAINT `fk-chat-message-chat` FOREIGN KEY (`lastChatId`) REFERENCES `chat_message` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk-user-chat-1` FOREIGN KEY (`creator`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk-user-chat-2` FOREIGN KEY (`target`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `chat_message` */

CREATE TABLE `chat_message` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `chatId` varchar(16) NOT NULL,
  `userId` int(8) NOT NULL,
  `type` varchar(8) NOT NULL DEFAULT 'text',
  `message` varchar(512) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`,`date`),
  KEY `fk-user-id` (`userId`),
  KEY `fk-chat-id` (`chatId`),
  CONSTRAINT `fk-chat-id` FOREIGN KEY (`chatId`) REFERENCES `chat` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk-user-id` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1929 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `emojis` */

CREATE TABLE `emojis` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `type` varchar(16) NOT NULL,
  `unicode` varchar(16) NOT NULL,
  `desc` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk-emojis_type-emojis-type` (`type`),
  CONSTRAINT `fk-emojis_type-emojis-type` FOREIGN KEY (`type`) REFERENCES `emojis_type` (`type`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1504 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `emojis_type` */

CREATE TABLE `emojis_type` (
  `type` varchar(16) NOT NULL,
  `icontype` varchar(16) NOT NULL,
  `icon` varchar(32) NOT NULL,
  `index` int(8) NOT NULL,
  PRIMARY KEY (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `follower` */

CREATE TABLE `follower` (
  `source` int(8) NOT NULL,
  `target` int(8) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`source`,`target`),
  KEY `fk-user-follower-id-2` (`target`),
  CONSTRAINT `fk-user-follower-id-1` FOREIGN KEY (`source`) REFERENCES `user` (`id`),
  CONSTRAINT `fk-user-follower-id-2` FOREIGN KEY (`target`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `menu` */

CREATE TABLE `menu` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `type` varchar(16) NOT NULL DEFAULT 'fa-solid',
  `icon` varchar(32) NOT NULL,
  `title` varchar(16) NOT NULL,
  `selected` tinyint(1) NOT NULL DEFAULT 0,
  `show` tinyint(1) NOT NULL DEFAULT 1,
  `url` varchar(32) NOT NULL DEFAULT '/',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `reaction` */

CREATE TABLE `reaction` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `socialId` int(8) NOT NULL,
  `userId` int(8) NOT NULL,
  `like` tinyint(1) NOT NULL DEFAULT 0,
  `bookmark` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk-social-reaction-id` (`socialId`),
  KEY `fk-user-reaction-id` (`userId`),
  CONSTRAINT `fk-social-reaction-id` FOREIGN KEY (`socialId`) REFERENCES `social` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk-user-reaction-id` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=183 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `reply` */

CREATE TABLE `reply` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `socialId` int(8) NOT NULL,
  `userId` int(8) NOT NULL,
  `reply` varchar(256) DEFAULT NULL,
  `likes` int(8) NOT NULL DEFAULT 0,
  `created` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk-reply-user-id` (`userId`),
  KEY `fk-reply-social-id` (`socialId`),
  CONSTRAINT `fk-reply-social-id` FOREIGN KEY (`socialId`) REFERENCES `social` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk-user-reply-id` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=136 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `social` */

CREATE TABLE `social` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `userId` int(8) NOT NULL,
  `location` varchar(32) DEFAULT NULL,
  `type` varchar(16) NOT NULL,
  `thumbnail` varchar(128) DEFAULT NULL,
  `media` varchar(1024) NOT NULL,
  `content` varchar(1024) NOT NULL,
  `tags` varchar(1024) DEFAULT NULL,
  `created` datetime NOT NULL DEFAULT current_timestamp(),
  `modified` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk-user-social-id` (`userId`),
  CONSTRAINT `fk-user-social-id` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `subscribe` */

CREATE TABLE `subscribe` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `userId` int(8) NOT NULL,
  `endpoint` varchar(256) NOT NULL,
  `expirationTime` int(32) DEFAULT NULL,
  `p256dh` varchar(128) NOT NULL,
  `auth` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk-user-subscribe-id` (`userId`),
  CONSTRAINT `fk-user-subscribe-id` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `tags` */

CREATE TABLE `tags` (
  `socialId` int(8) NOT NULL,
  `tag` varchar(32) NOT NULL,
  PRIMARY KEY (`socialId`,`tag`),
  CONSTRAINT `fk-social-tags-id` FOREIGN KEY (`socialId`) REFERENCES `social` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `user` */

CREATE TABLE `user` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `type` varchar(16) NOT NULL DEFAULT 'App',
  `userId` varchar(64) NOT NULL,
  `email` varchar(32) DEFAULT NULL,
  `password` varchar(256) DEFAULT NULL,
  `nick` varchar(16) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `desc` varchar(256) NOT NULL DEFAULT '',
  `regist` datetime NOT NULL DEFAULT current_timestamp(),
  `birth` date DEFAULT '1900-01-01',
  `profile` varchar(256) NOT NULL DEFAULT 'profile.png',
  `login` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
