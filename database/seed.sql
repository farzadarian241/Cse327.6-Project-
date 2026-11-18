-- ============================================================================
-- HaatBodol (হাতবদল) Seed Data Script for XAMPP MySQL
-- ============================================================================

USE `haatbodol_db`;

-- Disable foreign key checks for clean truncation and seeding
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `moderation_reports`;
TRUNCATE TABLE `user_reviews`;
TRUNCATE TABLE `transaction_orders`;
TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `cart_items`;
TRUNCATE TABLE `watchlist_items`;
TRUNCATE TABLE `direct_chat_messages`;
TRUNCATE TABLE `offer_rounds`;
TRUNCATE TABLE `negotiation_sessions`;
TRUNCATE TABLE `auto_drop_configs`;
TRUNCATE TABLE `listing_images`;
TRUNCATE TABLE `product_listings`;
TRUNCATE TABLE `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. USERS SEED (1 Admin, 4 Realistic Standard Users)
-- Password for all seed accounts is: Password123!
-- Bcrypt hash ($2a$10$wwBGR.pSYdIr24A4S5qUiuAbvcPiopu/rnQMIDdM8WMKDiCxGjmt6)
-- ----------------------------------------------------------------------------
INSERT INTO `users` (
  `user_id`, `full_name`, `email`, `phone_number`, `institutional_email`,
  `password_hash`, `residential_address`, `campus_area`, `is_campus_verified`,
  `active_role`, `account_type`, `account_status`, `average_rating`, `total_reviews`, `created_at`
) VALUES
(
  1,
  'HaatBodol Super Admin',
  'admin@haatbodol.com',
  '+8801700000000',
  'admin@haatbodol.com',
  '$2a$10$wwBGR.pSYdIr24A4S5qUiuAbvcPiopu/rnQMIDdM8WMKDiCxGjmt6',
  'Level 5, ICT Innovation Center, Agargaon',
  'Dhaka Central',
  1,
  'BUYER',
  'ADMIN',
  'ACTIVE',
  5.00,
  0,
  NOW() - INTERVAL 60 DAY
),
(
  2,
  'Tanvir Ahmed',
  'tanvir@northsouth.edu',
  '+8801711000001',
  'tanvir@northsouth.edu',
  '$2a$10$wwBGR.pSYdIr24A4S5qUiuAbvcPiopu/rnQMIDdM8WMKDiCxGjmt6',
  'House 14, Road 7, Block D, Bashundhara R/A',
  'Bashundhara R/A (NSU/IUB)',
  1,
  'SELLER',
  'USER',
  'ACTIVE',
  4.90,
  14,
  NOW() - INTERVAL 45 DAY
),
(
  3,
  'Nusrat Jahan',
  'nusrat@bracu.ac.bd',
  '+8801811000002',
  'nusrat@bracu.ac.bd',
  '$2a$10$wwBGR.pSYdIr24A4S5qUiuAbvcPiopu/rnQMIDdM8WMKDiCxGjmt6',
  'Cha-72, Pragati Sarani, Merul Badda',
  'Merul Badda / Mohakhali (BRACU)',
  1,
  'BUYER',
  'USER',
  'ACTIVE',
  4.80,
  8,
  NOW() - INTERVAL 30 DAY
),
(
  4,
  'Rafiul Islam',
  'rafiul.dhaka@gmail.com',
  '+8801911000003',
  NULL,
  '$2a$10$wwBGR.pSYdIr24A4S5qUiuAbvcPiopu/rnQMIDdM8WMKDiCxGjmt6',
  'Flat 4B, House 22, Road 9/A, Dhanmondi',
  'Dhanmondi (UIU/DIU Area)',
  0,
  'SELLER',
  'USER',
  'ACTIVE',
  4.50,
  5,
  NOW() - INTERVAL 20 DAY
),
(
  5,
  'Sadia Rahman',
  'sadia@du.ac.bd',
  '+8801611000004',
  'sadia@du.ac.bd',
  '$2a$10$wwBGR.pSYdIr24A4S5qUiuAbvcPiopu/rnQMIDdM8WMKDiCxGjmt6',
  'Ruqayyah Hall, Dhaka University Campus',
  'Nilkhet / Shahbagh (DU Campus)',
  1,
  'BUYER',
  'USER',
  'ACTIVE',
  5.00,
  11,
  NOW() - INTERVAL 15 DAY
);

-- ----------------------------------------------------------------------------
-- 2. PRODUCT LISTINGS SEED (12 Realistic Items: 4 Electronic, 4 Furniture, 4 Clothing)
-- ----------------------------------------------------------------------------
INSERT INTO `product_listings` (
  `listing_id`, `seller_id`, `title`, `description`, `category`,
  `original_price`, `age_in_months`, `item_condition`, `suggested_min_price`,
  `suggested_max_price`, `current_asking_price`, `pickup_location`,
  `listing_status`, `is_negotiable`, `auto_drop_enabled`, `published_at`
) VALUES
-- 1. Electronic Devices: MacBook Air M1 (Tanvir, Available, Auto-Drop on)
(
  1,
  2,
  'MacBook Air M1 8GB/256GB - Space Gray',
  'Used for 14 months for computer science coursework. Excellent battery health (92%), original 30W USB-C charger and box included. No body dents, crisp Retina display.',
  'Electronic Devices',
  88000.00,
  14,
  'Like New',
  54000.00,
  62000.00,
  58000.00,
  'North South University Gate 8, Bashundhara R/A, Dhaka',
  'AVAILABLE',
  1,
  1,
  NOW() - INTERVAL 4 DAY
),
-- 2. Electronic Devices: Sony WH-1000XM4 (Rafiul, Available, Auto-Drop DUE NOW for testing)
(
  2,
  4,
  'Sony WH-1000XM4 Wireless Noise Cancelling Headphones',
  'Flagship active noise cancelling over-ear headphones. Great for studying in university libraries or noisy dorms. Includes audio jack cable, airplane adapter, and travel case.',
  'Electronic Devices',
  32000.00,
  8,
  'Good',
  18000.00,
  22000.00,
  19500.00,
  'Dhanmondi 27 (near Cafe Mango), Dhaka',
  'AVAILABLE',
  1,
  1,
  NOW() - INTERVAL 8 DAY
),
-- 3. Electronic Devices: Samsung Galaxy S22 (Tanvir, Available, Auto-Drop on)
(
  3,
  2,
  'Samsung Galaxy S22 5G (Phantom Black, 128GB)',
  'Compact flagship smartphone. Clean display with glass protector applied from day one. Single hand used with Spigen rugged armor case. Minor cosmetic paint wear near USB port.',
  'Electronic Devices',
  75000.00,
  20,
  'Fair',
  30000.00,
  36000.00,
  33500.00,
  'Bashundhara R/A Block C, Dhaka',
  'AVAILABLE',
  1,
  1,
  NOW() - INTERVAL 10 DAY
),
-- 4. Electronic Devices: iPad 9th Gen with Pencil (Nusrat, SOLD for Order seed)
(
  4,
  3,
  'iPad 9th Gen 64GB WiFi with Apple Pencil 1st Gen',
  'Perfect student tablet bundle for lecture annotations and reading PDFs. Matte paperlike screen protector already installed. Light scratch on back casing, screen is flawless.',
  'Electronic Devices',
  44000.00,
  16,
  'Good',
  24000.00,
  29000.00,
  26000.00,
  'BRAC University New Campus Gate, Merul Badda, Dhaka',
  'SOLD',
  1,
  0,
  NOW() - INTERVAL 12 DAY
),
-- 5. Furniture: Solid Segun Wood Study Desk (Rafiul, Available, Auto-Drop on)
(
  5,
  4,
  'Solid Segun Wood Student Study Desk with 3 Drawers',
  'Heavy handcrafted solid mahogany/segun study table. Built-in cable management hole and lockable drawers. Sturdy build, ideal for dual laptop and monitor setup.',
  'Furniture',
  14500.00,
  18,
  'Good',
  7500.00,
  9500.00,
  8500.00,
  'Dhanmondi Road 8/A, Dhaka',
  'AVAILABLE',
  1,
  1,
  NOW() - INTERVAL 6 DAY
),
-- 6. Furniture: Otobi Ergonomic High-Back Chair (Tanvir, RESERVED for Negotiation seed)
(
  6,
  2,
  'Otobi Ergonomic High-Back Mesh Office Chair',
  'Breathable mesh back with adjustable lumbar support, 2D armrests, and smooth tilt mechanism. Clean pneumatic cylinder with zero height-sagging.',
  'Furniture',
  11000.00,
  10,
  'Like New',
  6500.00,
  8200.00,
  7400.00,
  'Bashundhara R/A Block D, Dhaka',
  'RESERVED',
  1,
  0,
  NOW() - INTERVAL 3 DAY
),
-- 7. Furniture: Compact 4-Tier Bookshelf (Sadia, Available, Auto-Drop on)
(
  7,
  5,
  'Compact 4-Tier Engineered Wood Bookshelf',
  'Lightweight space-saving bookshelf designed for university student dorms and bachelor apartments. Holds up to 60 standard textbooks and binders.',
  'Furniture',
  5200.00,
  22,
  'Fair',
  2100.00,
  2800.00,
  2400.00,
  'Dhaka University Curzon Hall / Shahidullah Hall Gate, Dhaka',
  'AVAILABLE',
  1,
  1,
  NOW() - INTERVAL 5 DAY
),
-- 8. Furniture: Bedside Laptop Table (Nusrat, Available)
(
  8,
  3,
  'Adjustable Metal Frame Bedside Laptop Table',
  'Wheeled multi-angle height adjustable bed desk. Great for studying in bed or beside a sofa. Wheels lock properly. Minor scuffs on corner edge.',
  'Furniture',
  3800.00,
  12,
  'Needs Repair',
  1200.00,
  1700.00,
  1400.00,
  'Mohakhali Wireless Gate, Dhaka',
  'AVAILABLE',
  1,
  0,
  NOW() - INTERVAL 7 DAY
),
-- 9. Clothing: North Face Winter Jacket (Tanvir, Available)
(
  9,
  2,
  'North Face Windproof Thermal Winter Down Jacket (Size L)',
  'Authentic waterproof breathable goose down jacket with detachable fleece hood. Worn during one semester abroad. Kept in dry cleaner condition.',
  'Clothing',
  16500.00,
  12,
  'Like New',
  7000.00,
  9200.00,
  7900.00,
  'NSU Campus Plaza, Bashundhara R/A, Dhaka',
  'AVAILABLE',
  1,
  0,
  NOW() - INTERVAL 4 DAY
),
-- 10. Clothing: Nike Air Max 270 (Rafiul, Available)
(
  10,
  4,
  'Nike Air Max 270 Running Shoes (Size UK 9 / EU 43)',
  'Triple black colorway. Cushioned large volume Max Air unit heel. Sole grip in 85% condition, freshly washed and deodorized. Very comfortable university walk.',
  'Clothing',
  13500.00,
  15,
  'Good',
  4800.00,
  6500.00,
  5400.00,
  'Dhanmondi Lakefront (Rabindra Sarobar), Dhaka',
  'AVAILABLE',
  1,
  0,
  NOW() - INTERVAL 9 DAY
),
-- 11. Clothing: Aarong Formal Silk Kurta (Nusrat, Available)
(
  11,
  3,
  'Aarong Formal Heritage Silk Kurta & Pajama Set (Size 40)',
  'Festive Eid collection kurta set worn only twice. Hand-embroidered neckline, premium silk blend fabric. Professionally dry-cleaned.',
  'Clothing',
  8900.00,
  6,
  'Like New',
  3800.00,
  4900.00,
  4200.00,
  'BRAC University Merul Badda Campus, Dhaka',
  'AVAILABLE',
  1,
  0,
  NOW() - INTERVAL 11 DAY
),
-- 12. Clothing: Levis 511 Slim Fit Jeans (Sadia, Available)
(
  12,
  5,
  'Levis 511 Slim Fit Selvedge Denim Jeans (Waist 32 / Length 32)',
  'Dark indigo wash, classic 5-pocket styling with brass rivets. Clean hems, slight vintage fade on knees. Premium raw denim character.',
  'Clothing',
  6200.00,
  24,
  'Fair',
  2000.00,
  2700.00,
  2300.00,
  'Dhaka University Arts Building (Kala Bhaban), Dhaka',
  'AVAILABLE',
  1,
  0,
  NOW() - INTERVAL 14 DAY
);

-- ----------------------------------------------------------------------------
-- 3. LISTING IMAGES SEED (Pointing to /uploads/products/*.jpg)
-- ----------------------------------------------------------------------------
INSERT INTO `listing_images` (`image_id`, `listing_id`, `image_url`, `display_order`, `is_compressed`) VALUES
(1, 1, '/uploads/products/macbook-air-m1.jpg', 1, 1),
(2, 2, '/uploads/products/sony-wh1000xm4.jpg', 1, 1),
(3, 3, '/uploads/products/samsung-s22.jpg', 1, 1),
(4, 4, '/uploads/products/ipad-9th-gen.jpg', 1, 1),
(5, 5, '/uploads/products/wooden-study-desk.jpg', 1, 1),
(6, 6, '/uploads/products/ergonomic-office-chair.jpg', 1, 1),
(7, 7, '/uploads/products/compact-bookshelf.jpg', 1, 1),
(8, 8, '/uploads/products/bedside-laptop-table.jpg', 1, 1),
(9, 9, '/uploads/products/north-face-jacket.jpg', 1, 1),
(10, 10, '/uploads/products/nike-air-max-270.jpg', 1, 1),
(11, 11, '/uploads/products/aarong-silk-kurta.jpg', 1, 1),
(12, 12, '/uploads/products/levis-511-jeans.jpg', 1, 1);

-- ----------------------------------------------------------------------------
-- 4. AUTO-DROP DUTCH AUCTION CONFIGS (5 Listings with Auto-Drop)
-- Listing 2 has next_drop_at set to NOW() - INTERVAL 1 HOUR for immediate Dutch Auction testing!
-- ----------------------------------------------------------------------------
INSERT INTO `auto_drop_configs` (
  `config_id`, `listing_id`, `min_reserve_price`, `drop_percentage`,
  `interval_hours`, `last_drop_at`, `next_drop_at`, `is_halted`
) VALUES
-- Config 1: MacBook Air M1 (Next drop in 4 days)
(1, 1, 48000.00, 5.00, 168, NULL, NOW() + INTERVAL 4 DAY, 0),

-- Config 2: Sony Headphones (DUE FOR DROP NOW: 1 hour overdue!)
(2, 2, 15000.00, 5.00, 168, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 1 HOUR, 0),

-- Config 3: Samsung Galaxy S22 (Next drop in 3 days)
(3, 3, 25000.00, 5.00, 168, NULL, NOW() + INTERVAL 3 DAY, 0),

-- Config 4: Segun Wood Desk (Next drop in 5 days)
(4, 5, 6000.00, 5.00, 168, NULL, NOW() + INTERVAL 5 DAY, 0),

-- Config 5: 4-Tier Bookshelf (Next drop in 2 days)
(5, 7, 1800.00, 5.00, 168, NULL, NOW() + INTERVAL 2 DAY, 0);

-- ----------------------------------------------------------------------------
-- 5. NEGOTIATION SESSIONS & OFFER ROUNDS (1 Active 2-Round Session)
-- Buyer Nusrat (3) negotiating on Listing 6 (Otobi Chair, Asking 7400) with Seller Tanvir (2)
-- Round 1: Buyer offered 5800
-- Round 2: Seller countered 6200
-- ----------------------------------------------------------------------------
INSERT INTO `negotiation_sessions` (
  `session_id`, `listing_id`, `buyer_id`, `round_count`,
  `min_slider_price`, `max_slider_price`, `current_offer_amount`,
  `last_offered_by_id`, `session_status`, `created_at`, `updated_at`
) VALUES (
  1,
  6,
  3,
  2,
  5180.00,  -- 70% floor
  6290.00,  -- 85% ceiling
  6200.00,
  2,        -- Tanvir made counter-offer
  'COUNTERED',
  NOW() - INTERVAL 24 HOUR,
  NOW() - INTERVAL 6 HOUR
);

INSERT INTO `offer_rounds` (
  `round_id`, `session_id`, `offered_by_id`, `round_number`,
  `offer_amount`, `action_type`, `created_at`
) VALUES
(1, 1, 3, 1, 5800.00, 'INITIAL_OFFER', NOW() - INTERVAL 24 HOUR),
(2, 1, 2, 2, 6200.00, 'COUNTER_OFFER', NOW() - INTERVAL 6 HOUR);

-- Direct Chat Messages inside session 1
INSERT INTO `direct_chat_messages` (
  `message_id`, `session_id`, `sender_id`, `message_text`, `is_contact_revealed`, `sent_at`
) VALUES
(1, 1, 3, 'Hello! Would you consider ৳5,800? I can pick it up tomorrow from NSU Gate 8.', 0, NOW() - INTERVAL 23 HOUR),
(2, 1, 2, 'Hi Nusrat, ৳5,800 is a bit low for this condition. I can do ৳6,200 firm. Let me know!', 0, NOW() - INTERVAL 6 HOUR);

-- ----------------------------------------------------------------------------
-- 6. WATCHLIST ITEMS (Sample Bookmarks)
-- ----------------------------------------------------------------------------
INSERT INTO `watchlist_items` (`watchlist_id`, `user_id`, `listing_id`, `added_at`) VALUES
(1, 3, 1, NOW() - INTERVAL 3 DAY), -- Nusrat watches MacBook Air
(2, 3, 2, NOW() - INTERVAL 2 DAY), -- Nusrat watches Sony Headphones (will receive price drop alert!)
(3, 5, 2, NOW() - INTERVAL 1 DAY), -- Sadia watches Sony Headphones (will receive price drop alert!)
(4, 5, 6, NOW() - INTERVAL 2 DAY), -- Sadia watches Otobi Chair
(5, 4, 9, NOW() - INTERVAL 1 DAY); -- Rafiul watches North Face Jacket

-- ----------------------------------------------------------------------------
-- 7. CART ITEMS (Sample Shopping Cart)
-- ----------------------------------------------------------------------------
INSERT INTO `cart_items` (`cart_item_id`, `user_id`, `listing_id`, `agreed_price`, `session_id`, `added_at`) VALUES
(1, 5, 1, 58000.00, NULL, NOW() - INTERVAL 1 DAY),
(2, 3, 5, 8500.00, NULL, NOW() - INTERVAL 12 HOUR);

-- ----------------------------------------------------------------------------
-- 8. TRANSACTION ORDERS & MUTUAL 5-STAR USER REVIEWS (1 Completed Order)
-- Listing 4 (iPad) purchased by Sadia (5) from Nusrat (3)
-- ----------------------------------------------------------------------------
INSERT INTO `transaction_orders` (
  `order_id`, `invoice_number`, `listing_id`, `buyer_id`, `seller_id`,
  `session_id`, `final_agreed_price`, `payment_method`, `payment_status`,
  `delivery_method`, `delivery_status`, `shipping_address`, `completed_at`
) VALUES (
  1,
  'HB-20261114-001',
  4,
  5,
  3,
  NULL,
  25000.00,
  'CASH_ON_HANDOVER',
  'PAID',
  'CAMPUS_MEETUP',
  'DELIVERED',
  'BRAC University New Campus Gate, Merul Badda, Dhaka',
  NOW() - INTERVAL 2 DAY
);

INSERT INTO `user_reviews` (
  `review_id`, `order_id`, `reviewer_id`, `reviewee_id`, `star_rating`, `feedback_text`, `created_at`
) VALUES
(
  1,
  1,
  5,
  3,
  5,
  'The iPad was in pristine condition, exactly as described! On-time handover at the campus gate. Highly recommended verified seller.',
  NOW() - INTERVAL 1 DAY
),
(
  2,
  1,
  3,
  5,
  5,
  'Very polite, courteous, and punctual student buyer. Smooth cash handover at campus. Would love to trade again!',
  NOW() - INTERVAL 1 DAY
);

-- ----------------------------------------------------------------------------
-- 9. NOTIFICATIONS SEED (Sample Alerts)
-- ----------------------------------------------------------------------------
INSERT INTO `notifications` (
  `notification_id`, `user_id`, `listing_id`, `notification_type`,
  `delivery_channel`, `title`, `message_body`, `action_url`, `is_read`, `sent_at`
) VALUES
(
  1,
  3,
  6,
  'COUNTER_OFFER',
  'IN_APP',
  'Counter-Offer Received (৳6,200)',
  'Tanvir Ahmed has countered your offer with ৳6,200 for "Otobi Ergonomic High-Back Mesh Office Chair".',
  '/negotiations/1',
  0,
  NOW() - INTERVAL 6 HOUR
),
(
  2,
  2,
  6,
  'NEW_OFFER',
  'IN_APP',
  'New Offer Received (৳5,800)',
  'Nusrat Jahan placed an initial offer of ৳5,800 on "Otobi Ergonomic High-Back Mesh Office Chair".',
  '/negotiations/1',
  1,
  NOW() - INTERVAL 24 HOUR
),
(
  3,
  5,
  4,
  'DEAL_LOCKED',
  'IN_APP',
  'Order Completed & Delivered',
  'Your order HB-20261114-001 for "iPad 9th Gen 64GB WiFi with Apple Pencil 1st Gen" is fulfilled. Please leave a review!',
  '/orders/1',
  1,
  NOW() - INTERVAL 2 DAY
);

-- ----------------------------------------------------------------------------
-- 10. MODERATION REPORTS SEED (Sample Open Report for Admin Review)
-- ----------------------------------------------------------------------------
INSERT INTO `moderation_reports` (
  `report_id`, `listing_id`, `reporter_id`, `admin_id`, `reason`,
  `details`, `report_status`, `created_at`, `resolved_at`
) VALUES (
  1,
  8,
  2,
  NULL,
  'Misleading condition description',
  'Item is tagged as Needs Repair, but description indicates broken table leg brackets that might be hazardous for laptops.',
  'OPEN',
  NOW() - INTERVAL 1 DAY,
  NULL
);
