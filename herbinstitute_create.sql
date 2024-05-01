DROP DATABASE IF EXISTS `herb_institute`;
CREATE DATABASE IF NOT EXISTS `herb_institute`;
USE `herb_institute`;

-- Сreating the new tables according to the developed DB structure
CREATE TABLE IF NOT EXISTS `SORT`
(
    -- ID of the sort
    `sort_id` BIGINT PRIMARY KEY UNIQUE AUTO_INCREMENT,
    -- Sort name
    `name` VARCHAR(40) NOT NULL,
    -- Year of creation
    `year` YEAR DEFAULT (YEAR(CURRENT_DATE)),
    -- Is the sort adapted to the local conditions?
    `adaptation` BOOLEAN NOT NULL DEFAULT 0,
    -- Check if the boolean value is correct or not
    CONSTRAINT `bool_adaptation` CHECK(`adaptation` = 0 OR `adaptation` = 1),
    -- IS the sort frost resistant?
    `frost` BOOLEAN NOT NULL DEFAULT 0,
    CONSTRAINT `bool_frost` CHECK(`frost` = 0 OR `frost` = 1),
    -- Sort description
    `description` VARCHAR(200),
    -- Planting technology
    `technology` MEDIUMTEXT,
    -- Picture of the plant of this sort
    `picture` BLOB,
    -- Was the sort approved by the inspection?
    `approved` BOOLEAN NOT NULL DEFAULT 0,
    CONSTRAINT `bool_approved` CHECK(`approved` = 0 OR `approved` = 1),
    -- The time it takes for the plant of this sort to grow up in days
    `period` TINYINT
);
-- Change the type to SMALLINT to accept the year values from 0 to 65546 instead of 1901-2155 for compatibility with sorts cultivated a very long time ago
ALTER TABLE `SORT` MODIFY `year` SMALLINT UNSIGNED DEFAULT (YEAR(CURDATE()));
ALTER TABLE `SORT` ADD CONSTRAINT `period_1_early_2_mid_3_late` CHECK ( `period` >= 1 AND `period` <= 3);
ALTER TABLE `SORT` MODIFY `picture` MEDIUMBLOB;

-- Recently created plant sorts
CREATE TABLE IF NOT EXISTS `NEW_SORT`
(
    -- New sort ID (should match the `SORT`.id
    new_sort_id BIGINT PRIMARY KEY UNIQUE NOT NULL,
    -- Date of creation
    `date` DATETIME NOT NULL,
    -- Any comments about the newly created sort
    `comment` MEDIUMTEXT,
    -- Foreign key that references the `sort_id` in the `SORT` table to underline the relation
    CONSTRAINT `new_sort_fk` FOREIGN KEY (new_sort_id)
        REFERENCES `SORT`(sort_id)
);
-- Change the date field type to a correct one; add a default value
ALTER TABLE `NEW_SORT` MODIFY `date` DATE NOT NULL DEFAULT (DATE(curdate()));

-- A table for the types of the seeds packing that the university provides
CREATE TABLE IF NOT EXISTS `PACKING`
(
    -- ID of a packing type
    `packing_id` INT(10) PRIMARY KEY UNIQUE AUTO_INCREMENT,
    -- Name of a packing type
    `packing_name` VARCHAR(20),
    -- Amount of the seeds in the packing
    `amount` INT(4) NOT NULL
);

-- Change the index type to a 64-bit integer
ALTER TABLE `PACKING` MODIFY `packing_id` BIGINT AUTO_INCREMENT;

-- A table for the produced batches of seeds that are up for sale
CREATE TABLE IF NOT EXISTS `BATCH`
(
    -- ID of the batch
    `batch_id` BIGINT PRIMARY KEY UNIQUE AUTO_INCREMENT,
    -- ID of the sort in the pack
    `sort_id` BIGINT NOT NULL,
    -- The date the seeds are better to be used until
    `end` DATE NOT NULL,
    -- ID of the packing these seeds are packed into
    `packing_id` BIGINT,
    -- Date of the packing
    `packing_date` DATE NOT NULL,
    -- Weight of the pack
    `weight` INT(4),
    -- Price of the pack
    `price` INT(10),
    -- Size of the batch
    `batch_size` INT NOT NULL,
    -- Foreign key definition
    CONSTRAINT `sort_id_fk` FOREIGN KEY (`sort_id`)
        REFERENCES `SORT`(`sort_id`),
    -- Non-negativity checks
    CONSTRAINT `price_non_negative` CHECK(`price` >= 0),
    CONSTRAINT `batch_size_non_negative` CHECK(`batch_size` >= 0)
-- Will add this constraint to the table using the ALTER TABLE statement
-- 	CONSTRAINT `packing_fk` FOREIGN KEY (`packing_id`)
-- 		REFERENCES `PACKING`(`packing_id`)
);
-- Another foreign key definition
ALTER TABLE `BATCH`
    ADD CONSTRAINT `packing_fk` FOREIGN KEY (`packing_id`)
        REFERENCES `PACKING`(`packing_id`);
-- Set the price to be not empty
ALTER TABLE `BATCH` MODIFY `price` INT NOT NULL;

-- Table for the clients that have bought the seeds at the Institute
CREATE TABLE IF NOT EXISTS `CLIENT`
(
    -- ID of the client
    `client_id` BIGINT PRIMARY KEY UNIQUE AUTO_INCREMENT,
    -- Company name
    `company` VARCHAR(20) NOT NULL,
    -- Address of the company
    `address` VARCHAR(100),
    -- Phone number of the company
    `phone` VARCHAR(17),
    CONSTRAINT `phone_number_format` CHECK(`phone` LIKE "+380_________")
);

-- Increase the length of the company name field to account for the long names
ALTER TABLE `CLIENT` MODIFY `company` VARCHAR(40);
-- Remove the phone number format to account for the international companies
ALTER TABLE `CLIENT` DROP CONSTRAINT `phone_number_format`;

-- Sellers list
CREATE TABLE IF NOT EXISTS `SELLER`
(
    -- ID of the seller
    `seller_id` BIGINT UNIQUE AUTO_INCREMENT NOT NULL,
    -- Name of the seller
    `seller_name` VARCHAR(15) NOT NULL,
    -- checking that the name value has both the name and the surname
    CONSTRAINT `seller_name_surname_format` CHECK(`seller_name` LIKE "% %")
);
-- adding the primary key for the table
ALTER TABLE `SELLER` ADD PRIMARY KEY(`seller_id`);
-- Alternative way:
-- ALTER TABLE `SELLER` MODIFY `seller_id` BIGINT UNIQUE AUTO_INCREMENT NOT NULL PRIMARY KEY;

ALTER TABLE `SELLER` MODIFY `seller_name` VARCHAR(30) NOT NULL;

-- The purchases that the clients have made through the Institute
CREATE TABLE IF NOT EXISTS `PURCHASE`
(
    -- ID of the purchase
    `purchase_id` BIGINT PRIMARY KEY UNIQUE AUTO_INCREMENT,
    -- ID of the client that made the purchase
    `client_id` BIGINT NOT NULL,
    -- ID of the batch that was purchased
    `batch_id` BIGINT NOT NULL,
    -- Date of the purchase
    `buy_date` DATE DEFAULT (CURRENT_DATE),
    -- The cashless flag (default is cashless)
    `is_cash` BOOLEAN NOT NULL DEFAULT 0,
    -- Boolean checks because MySQL doesn't enforce boolean values by default
    CONSTRAINT `bool_is_cash` CHECK(`is_cash` = 0 OR `is_cash` = 1),
    -- THe ID of the seller that has sold the seeds
    `seller_id` BIGINT NOT NULL,
    -- Add the foreign keys required
    CONSTRAINT `seller_id_fk` FOREIGN KEY(`seller_id`)
        REFERENCES `SELLER`(`seller_id`),
    CONSTRAINT `client_id_fk` FOREIGN KEY (`client_id`)
        REFERENCES `CLIENT`(`client_id`)
);
-- Add another foreign key
ALTER TABLE `PURCHASE` ADD CONSTRAINT `batch_id_fk` FOREIGN KEY (`batch_id`)
    REFERENCES `BATCH`(`batch_id`);
    
INSERT INTO `SORT` (`name`, `year`, `adaptation`, `frost`, `description`, `approved`, `period`) VALUES 

('Tulipa agenensis', 2024, 1, 0, 'The flowers are brick red or deep red with black and yellow markings toward the center with a green stem. The petals are oval, tapered with curled tips and it has green and lanceolate foliage.', 1, 1), 

('Malus Abbomdanza', 2024, 1, TRUE, 'Width 70–75 mm, height 65 mm. Cold Storage 3C 150 days.', 1, 2), 

('Malus domestica Adams Pearmain', 2024, 0, 0, 'A dessert apple. First introduced under the name "Norfolk Pippin". Width 64 mm (2.5 in), height 63 mm (2.5 in). Cells obovate, abaxile. Flesh pale yellow, crisp,fine-textured, firm, juicy, aromatic.', 1, 2), 

('Malus Admiral', 2024, 1, 0, 'New very popular variety. Flesh firm, crisp, juicy with very good taste. Robust, healthy, scab resistant variety with excellent keeping qualities and taste', 1, 2); 

 

-- Add new values to the sort table without the description 

INSERT INTO `SORT` (`name`, `year`, `adaptation`, `frost`, `approved`, `period`) VALUES 

('Malus Granny Smith', 2024, 0, TRUE, 0, 3), 

('Cucumis melo', 2024, 1, false, 1, 2), 

('Malus pumila Antonovka', 1800, true, false, true, 3), 

('Malus Mere de Menage', 1800, true, true, true, 3), 

('Antonovka', 1800, true, true, true, 3), 

('Weißer Wintertaffetapfel', 1797, true, true, true, 3); 

 

# DROP TRIGGER new_sort_date; 

 

INSERT INTO herb_institute.NEW_SORT (new_sort_id, date, comment) VALUES 

(1, CURDATE(), 'Досліджено поведінку у сухих умовах'), 

(2, CURDATE(), 'Досліджено поведінку у вологих умовах'), 

(3, CURDATE(), 'Потрібно дослідити поведінку у сухих умовах'), 

(4, CURDATE(), 'Дослідження завершено'), 

(5, CURDATE(), 'Направити на схвалення інспекцією'), 

(6, '2016-12-20', 'Досліджено поведінку у сухих умовах'); 

 

-- Add the descriptions with UPDATE statements 

UPDATE `SORT` 

SET `description`='Apples are large, yellow-green and bracingly tart to eat out of hand, but superb for cooking, as they keep their shape.' 

WHERE `name`='Antonovka'; 

 

UPDATE `SORT` 

SET `description`='Large flat-round yellow apple with crimson flush (50–100%). Width 77–128 mm (3.0–5.0 in), height 67–95 mm (2.6–3.7 in). Stalk very stout (4–5 mm) and short (10–15 mm). Cells roundish, obovate, abaxile' 

WHERE `name`='Malus Mere de Menage'; 

 

 

INSERT INTO `SELLER` (`seller_name`) VALUES 

                                         ('Ivanov Ivan'), 

                                         ('Petrov Petro'), 

                                         ('Sydorov Sydir'), 

                                         ('Yaremenko Mykhailo'), 

                                         ('Fedorchenko Oleksandra'), 

                                         ('Prots Maksym'), 

                                         ('Protsenko Vitalii'), 

                                         ('Meleshko Ivan'), 

                                         ('Kolomyiets Ivanna'), 

                                         ('Shevchenko Ganna'); 

 

UPDATE `SELLER` SET `seller_name`='Shevchenko Hanna' WHERE `seller_name`='Shevchenko Ganna'; 

 

INSERT INTO `PACKING` (`packing_name`, `amount`) VALUES ('Small', 10), 

    	('Medium', 25), 

                                                        ('Large', 50), 

    ('Huge', 100); 

 

INSERT INTO `BATCH` (`end`, `packing_id`, `packing_date`, `weight`, `price`, `sort_id`, `batch_size`) 

     VALUES (DATE_ADD(CURDATE(), INTERVAL 90 DAY), 1, CURDATE(), 40, 200, 1, 10), 

(DATE_ADD(CURDATE(), INTERVAL 90 DAY), 2, CURDATE(), 40, 200, 2, 30), 

(DATE_ADD(CURDATE(), INTERVAL 180 DAY), 2, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 50, 100, 2, 10); 

 

INSERT INTO CLIENT (company, address, phone) VALUES 

('ТОВ "Золоте Поле"', 'вул. Сонячна, с. Нове Життя, Вінницька область, Україна', '+380 432 123 456'), 

('ТОВ "Урожайна Долина"', 'вул. Шевченка, 24, м. Рівне, Рівненська область, Україна', '+380 362 654 321'), 

('ВАТ "Полісся-Агро"', 'м. Луцьк, вул. Центральна, 7, Волинська область, Україна', '+380 332 987 654'), 

('ПАТ "Дніпровські Зорі"', 'вул. Шевченка, 56, м. Кременчук, Полтавська область, Україна', '+380 536 345 678'), 

('ПрАТ "Поляничка"', 'с. Зелене Поле, вул. Садова, 10, Хмельницька область, Україна', '+380 382 876 543'), 

('ТОВ "Зелений Вітер"', 'вул. Гагаріна, 2, м. Житомир, Житомирська область, Україна', '+380 412 234 567'), 

('КП "Одеса-Агро"', 'м. Одеса, вул. Лісова, 5, Одеська область, Україна', '+380 482 765 432'), 

('ТОВ "Барвисте Поле"', 'с. Веселе, вул. Поляна, 3, Донецька область, Україна', '+380 622 876 543'), 

('АТ "Агрофірма "Соняшникове Поле"', 'вул. Шевченка, 18, м. Херсон, Херсонська область, Україна', '+380 552 987 654'), 

('ТДВ "Зоряний Сад"', 'с. Полісся, вул. Садова, 9, Чернігівська область, Україна', '+380 462 345 678'); 

 

UPDATE `CLIENT` SET `phone`='+380 462 345 444' WHERE `company`='ТДВ "Зоряний Сад"'; 

 

INSERT INTO `BATCH` 

(`end`, `packing_id`, `packing_date`, `weight`, `price`, `sort_id`, `batch_size`) 

VALUES 

    (DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 1, DATE_SUB(CURDATE(), INTERVAL 3 WEEK), 60, 3000, 5, 100), 

    (DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 180, 3600, 5, 80), 

    (DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 2, DATE_SUB(CURDATE(), INTERVAL 2 WEEK), 200, 200, 1, 100), 

    (DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 3, DATE_SUB(CURDATE(), INTERVAL 1 WEEK), 180, 1000, 5, 100), 

    (DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 3, DATE_SUB(CURDATE(), INTERVAL 1 MONTH), 250, 3600, 2, 120), 

    (DATE_ADD(CURDATE(), INTERVAL 4 YEAR), 4, DATE_SUB(CURDATE(), INTERVAL 1 WEEK), 100, 450, 6, 50), 

    (DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 100, 4500, 3, 10), 

    (DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 4, CURDATE(), 100, 2500, 10, 10); 

 

INSERT INTO `PURCHASE` (`client_id`, `batch_id`, `buy_date`, `seller_id`) VALUES 

(1, 1, CURDATE(), 7), 

(6, 2, CURDATE(), 7), 

(2, 1, CURDATE(), 3), 

(8, 7, CURDATE(), 6), 

(7, 5, CURDATE(), 8), 

(3, 10, CURDATE(), 2), 

(7, 3, CURDATE(), 1), 

(2, 6, CURDATE(), 4), 

(1, 1, CURDATE(), 1), 

(3, 5, CURDATE(), 3); 