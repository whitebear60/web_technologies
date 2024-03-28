CREATE DATABASE `herb_institute`;
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