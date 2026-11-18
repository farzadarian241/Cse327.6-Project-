-- ============================================================================
-- HaatBodol (হাতবদল) Database Schema for XAMPP MySQL
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `haatbodol_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `haatbodol_db`;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone_number` VARCHAR(25) NOT NULL,
  `institutional_email` VARCHAR(150) NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `residential_address` VARCHAR(255) NOT NULL,
  `campus_area` VARCHAR(100) NOT NULL DEFAULT 'Dhaka Central',
  `is_campus_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `active_role` ENUM('BUYER', 'SELLER') NOT NULL DEFAULT 'BUYER',
  `account_type` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
  `account_status` ENUM('ACTIVE', 'SUSPENDED', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
  `average_rating` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `total_reviews` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_email` (`email`),
  INDEX `idx_users_status` (`account_status`)
) ENGINE=InnoDB;

-- 2. PRODUCT LISTINGS TABLE
CREATE TABLE IF NOT EXISTS `product_listings` (
  `listing_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `seller_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `description` TEXT NOT NULL,
  `category` ENUM('Electronic Devices', 'Furniture', 'Clothing') NOT NULL,
  `original_price` DECIMAL(10,2) NOT NULL,
  `age_in_months` INT UNSIGNED NOT NULL DEFAULT 0,
  `item_condition` ENUM('Like New', 'Good', 'Fair', 'Needs Repair') NOT NULL,
  `suggested_min_price` DECIMAL(10,2) NOT NULL,
  `suggested_max_price` DECIMAL(10,2) NOT NULL,
  `current_asking_price` DECIMAL(10,2) NOT NULL,
  `pickup_location` VARCHAR(150) NOT NULL,
  `listing_status` ENUM('AVAILABLE', 'RESERVED', 'SOLD', 'HIDDEN') NOT NULL DEFAULT 'AVAILABLE',
  `is_negotiable` TINYINT(1) NOT NULL DEFAULT 1,
  `auto_drop_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `published_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`listing_id`),
  CONSTRAINT `fk_listings_seller` FOREIGN KEY (`seller_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  INDEX `idx_listings_category_status` (`category`, `listing_status`),
  INDEX `idx_listings_price` (`current_asking_price`),
  INDEX `idx_listings_published` (`published_at`)
) ENGINE=InnoDB;

-- 3. LISTING IMAGES TABLE (Up to 5 images per listing)
CREATE TABLE IF NOT EXISTS `listing_images` (
  `image_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `listing_id` INT UNSIGNED NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `display_order` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `is_compressed` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`image_id`),
  CONSTRAINT `fk_images_listing` FOREIGN KEY (`listing_id`) REFERENCES `product_listings`(`listing_id`) ON DELETE CASCADE,
  INDEX `idx_images_listing_order` (`listing_id`, `display_order`)
) ENGINE=InnoDB;

-- 4. AUTO-DROP DUTCH AUCTION CONFIG TABLE (1:1 with Product Listing)
CREATE TABLE IF NOT EXISTS `auto_drop_configs` (
  `config_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `listing_id` INT UNSIGNED NOT NULL,
  `min_reserve_price` DECIMAL(10,2) NOT NULL,
  `drop_percentage` DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  `interval_hours` INT UNSIGNED NOT NULL DEFAULT 168,
  `last_drop_at` TIMESTAMP NULL DEFAULT NULL,
  `next_drop_at` TIMESTAMP NOT NULL,
  `is_halted` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`config_id`),
  UNIQUE KEY `uq_autodrop_listing` (`listing_id`),
  CONSTRAINT `fk_autodrop_listing` FOREIGN KEY (`listing_id`) REFERENCES `product_listings`(`listing_id`) ON DELETE CASCADE,
  INDEX `idx_autodrop_schedule` (`is_halted`, `next_drop_at`)
) ENGINE=InnoDB;

-- 5. NEGOTIATION SESSIONS TABLE (Structured 3-Round Bargaining)
CREATE TABLE IF NOT EXISTS `negotiation_sessions` (
  `session_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `listing_id` INT UNSIGNED NOT NULL,
  `buyer_id` INT UNSIGNED NOT NULL,
  `round_count` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `min_slider_price` DECIMAL(10,2) NOT NULL,
  `max_slider_price` DECIMAL(10,2) NOT NULL,
  `current_offer_amount` DECIMAL(10,2) NOT NULL,
  `last_offered_by_id` INT UNSIGNED NOT NULL,
  `session_status` ENUM('PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  CONSTRAINT `fk_neg_listing` FOREIGN KEY (`listing_id`) REFERENCES `product_listings`(`listing_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_neg_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  INDEX `idx_neg_listing_status` (`listing_id`, `session_status`),
  INDEX `idx_neg_buyer` (`buyer_id`)
) ENGINE=InnoDB;

-- 6. OFFER ROUNDS AUDIT TABLE (Logs up to 3 rounds per session)
CREATE TABLE IF NOT EXISTS `offer_rounds` (
  `round_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` INT UNSIGNED NOT NULL,
  `offered_by_id` INT UNSIGNED NOT NULL,
  `round_number` TINYINT UNSIGNED NOT NULL,
  `offer_amount` DECIMAL(10,2) NOT NULL,
  `action_type` ENUM('INITIAL_OFFER', 'COUNTER_OFFER', 'ACCEPTED', 'REJECTED') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`round_id`),
  CONSTRAINT `fk_rounds_session` FOREIGN KEY (`session_id`) REFERENCES `negotiation_sessions`(`session_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rounds_user` FOREIGN KEY (`offered_by_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. DIRECT CHAT MESSAGES TABLE (Unlocked on Offer Acceptance / Deal Lock)
CREATE TABLE IF NOT EXISTS `direct_chat_messages` (
  `message_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` INT UNSIGNED NOT NULL,
  `sender_id` INT UNSIGNED NOT NULL,
  `message_text` TEXT NOT NULL,
  `is_contact_revealed` TINYINT(1) NOT NULL DEFAULT 1,
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  CONSTRAINT `fk_chat_session` FOREIGN KEY (`session_id`) REFERENCES `negotiation_sessions`(`session_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_sender` FOREIGN KEY (`sender_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  INDEX `idx_chat_session_time` (`session_id`, `sent_at`)
) ENGINE=InnoDB;

-- 8. WATCHLIST ITEMS TABLE
CREATE TABLE IF NOT EXISTS `watchlist_items` (
  `watchlist_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `listing_id` INT UNSIGNED NOT NULL,
  `added_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`watchlist_id`),
  UNIQUE KEY `uq_watchlist_user_listing` (`user_id`, `listing_id`),
  CONSTRAINT `fk_watch_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_watch_listing` FOREIGN KEY (`listing_id`) REFERENCES `product_listings`(`listing_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. SHOPPING CART ITEMS TABLE
CREATE TABLE IF NOT EXISTS `cart_items` (
  `cart_item_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `listing_id` INT UNSIGNED NOT NULL,
  `agreed_price` DECIMAL(10,2) NOT NULL,
  `session_id` INT UNSIGNED NULL DEFAULT NULL,
  `added_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_item_id`),
  UNIQUE KEY `uq_cart_user_listing` (`user_id`, `listing_id`),
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_listing` FOREIGN KEY (`listing_id`) REFERENCES `product_listings`(`listing_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `listing_id` INT UNSIGNED NULL DEFAULT NULL,
  `notification_type` VARCHAR(50) NOT NULL,
  `delivery_channel` ENUM('IN_APP', 'EMAIL') NOT NULL DEFAULT 'IN_APP',
  `title` VARCHAR(160) NOT NULL,
  `message_body` TEXT NOT NULL,
  `action_url` VARCHAR(255) NULL DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  INDEX `idx_notif_user_read` (`user_id`, `is_read`, `sent_at`)
) ENGINE=InnoDB;

-- 11. TRANSACTION ORDERS TABLE
CREATE TABLE IF NOT EXISTS `transaction_orders` (
  `order_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_number` VARCHAR(40) NOT NULL,
  `listing_id` INT UNSIGNED NOT NULL,
  `buyer_id` INT UNSIGNED NOT NULL,
  `seller_id` INT UNSIGNED NOT NULL,
  `session_id` INT UNSIGNED NULL DEFAULT NULL,
  `final_agreed_price` DECIMAL(10,2) NOT NULL,
  `payment_method` ENUM('CASH_ON_HANDOVER', 'MOBILE_BANKING', 'CARD') NOT NULL DEFAULT 'CASH_ON_HANDOVER',
  `payment_status` ENUM('PENDING', 'PAID') NOT NULL DEFAULT 'PENDING',
  `delivery_method` ENUM('CAMPUS_MEETUP', 'LOCAL_COURIER') NOT NULL DEFAULT 'CAMPUS_MEETUP',
  `delivery_status` ENUM('PROCESSING', 'READY_FOR_PICKUP', 'DELIVERED') NOT NULL DEFAULT 'PROCESSING',
  `shipping_address` VARCHAR(255) NOT NULL,
  `completed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `uq_order_invoice` (`invoice_number`),
  UNIQUE KEY `uq_order_listing` (`listing_id`),
  CONSTRAINT `fk_order_listing` FOREIGN KEY (`listing_id`) REFERENCES `product_listings`(`listing_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_seller` FOREIGN KEY (`seller_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. USER REVIEWS TABLE (Mutual 1-5 Star Ratings)
CREATE TABLE IF NOT EXISTS `user_reviews` (
  `review_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `reviewer_id` INT UNSIGNED NOT NULL,
  `reviewee_id` INT UNSIGNED NOT NULL,
  `star_rating` TINYINT UNSIGNED NOT NULL,
  `feedback_text` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  UNIQUE KEY `uq_review_order_reviewer` (`order_id`, `reviewer_id`),
  CONSTRAINT `fk_review_order` FOREIGN KEY (`order_id`) REFERENCES `transaction_orders`(`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_review_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_review_reviewee` FOREIGN KEY (`reviewee_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. MODERATION REPORTS TABLE
CREATE TABLE IF NOT EXISTS `moderation_reports` (
  `report_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `listing_id` INT UNSIGNED NOT NULL,
  `reporter_id` INT UNSIGNED NOT NULL,
  `admin_id` INT UNSIGNED NULL DEFAULT NULL,
  `reason` VARCHAR(120) NOT NULL,
  `details` TEXT NULL,
  `report_status` ENUM('OPEN', 'DISMISSED', 'ACTION_TAKEN') NOT NULL DEFAULT 'OPEN',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`report_id`),
  CONSTRAINT `fk_report_listing` FOREIGN KEY (`listing_id`) REFERENCES `product_listings`(`listing_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;
