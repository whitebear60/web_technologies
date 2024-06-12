DROP DATABASE `timetable`;
CREATE DATABASE IF NOT EXISTS `timetable`;
USE `timetable`;
CREATE TABLE IF NOT EXISTS `GROUP` (
                                       `id` BIGINT PRIMARY KEY AUTO_INCREMENT UNIQUE,
                                       `name` VARCHAR(10) NOT NULL,
                                       `year` TINYINT
);

CREATE TABLE IF NOT EXISTS `STUDENT` (
                                         `id` BIGINT PRIMARY KEY AUTO_INCREMENT UNIQUE,
                                         `first_name` VARCHAR(50) NOT NULL,
                                         `last_name` VARCHAR(50) NOT NULL,
                                         `middle_name` VARCHAR(50) NOT NULL,
                                         `group` BIGINT,
                                         CONSTRAINT `group_fk` FOREIGN KEY (`group`) REFERENCES `GROUP`(`id`)
);

CREATE TABLE IF NOT EXISTS `TEACHER` (
                                         `id` BIGINT PRIMARY KEY AUTO_INCREMENT UNIQUE,
                                         `first_name` VARCHAR(50) NOT NULL,
                                         `last_name` VARCHAR(50) NOT NULL,
                                         `middle_name` VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS `CLASSTIME` (
                                               `id` BIGINT PRIMARY KEY AUTO_INCREMENT UNIQUE,
                                               `day` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
                                               `class_time` ENUM('8:00-9:20', '9:30-10:50', '11:00-12:20', '12:50-14:10', '14:20-15:40', '15:50-17:10')
);

CREATE TABLE IF NOT EXISTS `CLASSROOM` (
                                           `id` VARCHAR(4) PRIMARY KEY UNIQUE
);

CREATE TABLE IF NOT EXISTS `CLASSES` (
                                         `id` BIGINT PRIMARY KEY AUTO_INCREMENT UNIQUE,
                                         `class_name` VARCHAR(100) NOT NULL,
                                         `classroom` VARCHAR(4),
                                         `teacher` BIGINT,
                                         CONSTRAINT `classroom_fk` FOREIGN KEY (`classroom`) REFERENCES `CLASSROOM`(id),
                                         CONSTRAINT `teacher_fk` FOREIGN KEY (`teacher`) REFERENCES `TEACHER`(id)
);

CREATE TABLE IF NOT EXISTS `SCHEDULE` (
                                          `id` BIGINT PRIMARY KEY AUTO_INCREMENT UNIQUE,
                                          `time` BIGINT NOT NULL,
                                          `subject` BIGINT NOT NULL,
                                          `group` BIGINT NOT NULL,
                                          CONSTRAINT `schedule_classtime_fk` FOREIGN KEY (`time`) REFERENCES classtime(`id`),
                                          CONSTRAINT `schedule_subject_fk` FOREIGN KEY (`subject`) REFERENCES `CLASSES`(`id`),
                                          CONSTRAINT `schedule_group_fk` FOREIGN KEY (`group`) REFERENCES `GROUP`(`id`)
);

INSERT INTO classtime VALUES (1,'Monday','8:00-9:20'),(2,'Monday','9:30-10:50'),(3,'Monday','11:00-12:20'),(4,'Monday','12:50-14:10'),(5,'Monday','14:20-15:40'),(6,'Monday','15:50-17:10'),(7,'Tuesday','8:00-9:20'),(8,'Tuesday','9:30-10:50'),(9,'Tuesday','11:00-12:20'),(10,'Tuesday','12:50-14:10'),(11,'Tuesday','14:20-15:40'),(12,'Tuesday','15:50-17:10'),(13,'Wednesday','8:00-9:20'),(14,'Wednesday','9:30-10:50'),(15,'Wednesday','11:00-12:20'),(16,'Wednesday','12:50-14:10'),(17,'Wednesday','14:20-15:40'),(18,'Wednesday','15:50-17:10'),(31,'Thursday','8:00-9:20'),(32,'Thursday','9:30-10:50'),(33,'Thursday','11:00-12:20'),(34,'Thursday','12:50-14:10'),(35,'Thursday','14:20-15:40'),(36,'Thursday','15:50-17:10'),(37,'Friday','8:00-9:20'),(38,'Friday','9:30-10:50'),(39,'Friday','11:00-12:20'),(40,'Friday','12:50-14:10'),(41,'Friday','14:20-15:40'),(42,'Friday','15:50-17:10');

INSERT INTO `CLASSROOM` (`ID`) VALUES ('226'), ('405'), ('606'), ('609'), ('610'), ('613'), ('613a')