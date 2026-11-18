# Project Implementation Plan: HaatBodol (হাতবদল) — Peer-to-Peer Used Goods Marketplace

---

## 1. Project Overview and Objectives

### 1.1 Project Background
**HaatBodol (হাতবদল)**—which translates from Bangla to *"changing hands"*—is a dedicated peer-to-peer (P2P) second-hand e-commerce web application designed for buying and selling pre-owned **Clothing**, **Furniture**, and **Electronic Devices**. While general classified sites and social media groups are commonly used in Bangladesh for second-hand trading, they suffer from severe usability and trust issues: sellers struggle to price used goods accurately, buyers flood comment sections with unrealistic lowball offers, unsold listings stagnate for months without price adjustments, and users face privacy risks when exposing personal contact details prematurely.

HaatBodol solves these domain problems by combining a commercial-grade e-commerce user experience (inspired by Amazon) with structured, automated marketplace mechanisms tailored for university students and local residents.

### 1.2 Core Project Objectives
1. **Fair & Transparent Pricing (Dynamic Depreciation Estimator):** Guide sellers during listing creation by computing a recommended resale price range based on the item's category, original retail price, age (in months), and physical condition (`Like New`, `Good`, `Fair`, `Needs Repair`).
2. **Structured, Anti-Lowball Bargaining ("Make an Offer" Slider):** Replace unstructured text haggling with a constrained visual slider restricted strictly between **70% and 85%** of the current asking price (representing a **15% to 30% discount**). Enforce a maximum of **3 negotiation rounds** (`Offer` -> `Counter-Offer` -> `Final Offer/Response`) per buyer per item.
3. **Automated Clearance of Stagnant Inventory (Auto-Drop Dutch Auction Engine):** Allow sellers to opt into an automated Dutch Auction mode with a mandatory **Minimum Reserve Price**. Every **7 days (168 hours)** from publication, the system automatically reduces the asking price by **5%** until purchased or capped at the seller's floor price, alerting all watchlisted buyers.
4. **Privacy-First Deal Locking & Community Trust:** Mask seller phone numbers and exact residential addresses on public listings. Unmask contact details and unlock a private **Direct Chat** channel only after an offer is formally accepted (moving the item to `RESERVED` and locking out competing offers) or upon direct checkout. Support institutional `.edu` / university email verification for a **Campus Verified** badge and mutual **1–5 star** post-transaction reviews.
5. **Seamless Dual-Role & E-Commerce Experience:** Enable a single registered user account to switch effortlessly between **Buyer** and **Seller** modes, browse with faceted filtering and sorting, manage a **Watchlist** and **Shopping Cart**, complete checkout, and allow **Administrators** to moderate flagged listings and user accounts.

### 1.3 Target User Roles
- **Everyday Sellers (Students & Local Residents):** Create categorized listings with up to 5 compressed images, use the Depreciation Estimator, configure optional Auto-Drop rules, respond to structured offers, coordinate handover via Direct Chat, and rate buyers.
- **Budget-Conscious Buyers (Thrift Shoppers):** Search and filter second-hand items, track price drops via Watchlist, submit constrained 70%–85% offers or buy immediately via Cart/Checkout, communicate with matched sellers, and submit seller reviews.
- **Platform Administrators:** Monitor marketplace health, review user-submitted listing reports, remove prohibited/fraudulent listings, suspend or ban policy-violating users, and trigger/audit scheduled Auto-Drop cycles.

---

## 2. Technology Stack and Architecture

### 2.1 Approved Technology Stack
| Layer | Technology / Tool | Specification & Constraints |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js (App Router)** | Latest stable Next.js using the `src/app/` directory architecture, running on `http://localhost:3000`. Proxies all `/api/*` requests via `next.config.mjs` rewrites to `http://localhost:8080/api/*`. |
| **Frontend Library** | **React** | Functional components and React Hooks (`useState`, `useEffect`, `useContext`, etc.). |
| **Frontend Language** | **JavaScript (ES6+)** | **STRICTLY `.js` and `.jsx` files ONLY on the frontend.** Zero TypeScript (`.ts`, `.tsx`, `tsconfig.json`) anywhere in `src/`. |
| **Backend API Framework** | **Java (Spring Boot 3.x)** | Located in `backend/` and built with the Maven Wrapper (`./mvnw`), targeting **Java 17+** (compatible with **JDK 17–24**). Serves RESTful JSON and multipart endpoints on `http://localhost:8080`. |
| **Database Engine** | **MySQL (via XAMPP)** | Local MySQL Server (`haatbodol_db`) running on `127.0.0.1:3306` through XAMPP Control Panel. |
| **Database Admin** | **phpMyAdmin (via XAMPP)** | Local web management at `http://localhost/phpmyadmin` for schema import and inspection. |
| **Database Driver & Pool** | **JDBC (`mysql-connector-j`) + HikariCP** | Direct parameterized SQL (`PreparedStatement`) executed via a thread-safe HikariCP pool encapsulated inside the Java Singleton `DatabasePool` (no heavy JPA/Hibernate ORMs obscuring the GoF patterns). |
| **Styling** | **Tailwind CSS** | Standard utility-first CSS configured in JavaScript (`tailwind.config.js`, `postcss.config.js`). |
| **Icons** | **`lucide-react`** | Crisp, lightweight commercial e-commerce SVG icons. |
| **Authentication (Java)** | **`spring-security-crypto` + `jjwt`** | Secure password hashing (`BCryptPasswordEncoder`) and stateless HS256 JWT tokens (`jjwt`) stored in an `HTTP-only` cookie named `haatbodol_session`. |
| **Image Optimization (Java)** | **`Thumbnailator`** | Server-side Java image compression and resizing upon multipart upload, saving optimized images into `public/uploads/listings/`. |
| **Local Orchestration** | **`start.py` (Python 3)** | Single-command launcher (`python3 start.py`) to verify XAMPP MySQL, boot the Spring Boot API (`:8080`), and start the Next.js UI (`:3000`). |

### 2.2 High-Level System Architecture
The system uses a clean **Decoupled Full-Stack Layered Architecture** combining a Next.js JavaScript storefront (`:3000`) with a dedicated Java Spring Boot REST API backend (`:8080`) that houses all 8 textbook Gang of Four (GoF) OOP design patterns:

```text
+-----------------------------------------------------------------------+
|                        CLIENT BROWSER (React UI)                      |
|  - Amazon-Inspired Storefront, Search/Filter, Offer Slider, Cart      |
|  - Unified Buyer/Seller Dashboard, Direct Chat, Admin Moderation      |
+-----------------------------------+-----------------------------------+
                                    | HTTP / JSON / FormData (Fetch API)
                                    v
+-----------------------------------------------------------------------+
|                  NEXT.JS UI LAYER (http://localhost:3000)             |
|  - App Router Pages & React Components (JavaScript .js / .jsx ONLY)   |
|  - next.config.mjs Rewrites: /api/* -> http://localhost:8080/api/*    |
+-----------------------------------+-----------------------------------+
                                    | Proxied REST / Multipart HTTP
                                    v
+-----------------------------------------------------------------------+
|         JAVA SPRING BOOT REST API LAYER (http://localhost:8080)       |
|  - @RestController Endpoints (backend/src/main/java/com/haatbodol/)   |
|  - Stateless JWT Cookie Auth (haatbodol_session via jjwt) & BCrypt    |
|  - Input Validation, Thumbnailator Uploads & HTTP Status Handling     |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|              TEXTBOOK GoF JAVA DESIGN PATTERN LAYER                   |
|  - Singleton: DatabasePool & AutoDropScheduler                        |
|  - Strategy:  DepreciationStrategy + Abstract + Concrete + Context    |
|  - Observer:  MarketplaceSubject + MarketplaceObserver (InApp/Email)  |
|  - Factory:   NotificationFactory + MarketplaceNotification Products  |
|  - Facade:    DealCheckoutFacade (Atomic JDBC Transactions)           |
|  - Builder:   ListingQueryBuilder + BuiltSqlQuery                     |
|  - Proxy:     ListingAccessService + RealService + ListingAccessProxy |
|  - Decorator: ListingPresentationComponent + Concrete Decorators      |
+-----------------------------------+-----------------------------------+
                                    | Parameterized JDBC SQL (HikariCP)
                                    v
+-----------------------------------------------------------------------+
|               LOCAL MYSQL DATABASE (XAMPP - haatbodol_db)             |
|  - 13 Normalized Tables + Local File Storage (public/uploads/)        |
+-----------------------------------------------------------------------+
```

### 2.3 Architectural & Technical Constraints
- **Architectural Mandate (Textbook GoF Java Design Patterns):** *"All 8 backend Design Patterns MUST be implemented in Java following classic textbook Gang of Four (GoF) structure — using formal Java `interface`s, `abstract class`es, concrete classes, Contexts, Subjects/Observers, private-constructor Singletons, Factories, Builders, Facades, and Proxies — for clean OOP separation and easy academic explanation."*
- **Zero TypeScript on Frontend:** Do not use TypeScript anywhere in the Next.js frontend. Every frontend component, layout, page, context, and config file under `src/` must end in `.js` or `.jsx` (with `jsconfig.json` and zero `.ts`/`.tsx`/`tsconfig.json` files).
- **Clean Backend Ownership:** All REST API endpoints and all 8 Design Pattern implementations live exclusively in the Java Spring Boot `backend/` application, keeping the Next.js `src/` directory focused solely on the React UI and presentation layer.
- **Local Infrastructure Only:** Do not use Supabase, Firebase, MongoDB Atlas, AWS S3, or external SaaS dependencies. Store product images locally under `public/uploads/listings/` (served statically by Next.js) and persist all relational data in local XAMPP MySQL (`haatbodol_db`).
- **Simplicity & Maintainability:** Avoid unnecessary wrapper abstractions, Redux/MobX bloat, or heavy ORM frameworks (Hibernate/JPA). Use React Context (`AuthContext`, `CartContext`) for lightweight global client state and clean JDBC + Spring Boot REST controllers for server mutations.

---

## 3. Language and UI/UX Design Requirements

### 3.1 Strict Language Policy (CRITICAL)
1. **100% English Interface:** Every single navigation link, button label, heading, subheading, product category, form field, placeholder, validation message, toast notification, modal, dashboard tab, and email/alert template **must be written in English**.
2. **Sole Bangla Element (Logo Only):** The **only** Bangla text permitted anywhere in the entire application is the website logo in the header/footer displaying the project's original Bangla name: **`হাতবদল`** (optionally accompanied by the English subtitle `HaatBodol` in smaller typography).
3. **No Bilingual Body Text:** Do not include Bangla translations, Bangla tooltips, or Bangla product descriptions anywhere else in the UI or seed data.

### 3.2 UI/UX Visual Direction & Layout Standards
The application must look and feel like a trustworthy, production-grade commercial e-commerce marketplace (using Amazon's clarity, information density, and navigation ergonomics as inspiration):

- **Color Palette (Consistent Design Tokens):**
  - **Primary Header / Dark Chrome:** `#131921` (Deep Slate Navy) with secondary sub-nav `#232F3E`.
  - **Primary Brand Accent:** `#0F766E` (Deep Teal — trustworthy, sustainable second-hand commerce) with hover `#115E59`.
  - **Action / Deal Highlight:** `#D97706` (Warm Amber — star ratings, "Make an Offer" & "Auto-Drop" badges) and `#F59E0B` for primary CTA highlights.
  - **Surface & Background:** `#F3F4F6` (Soft Neutral Gray page canvas) and `#FFFFFF` (Crisp White product cards, modals, and form containers) with subtle `#E5E7EB` borders.
  - **Text Hierarchy:** `#111827` (Primary headings/prices), `#374151` (Body text), `#6B7280` (Muted metadata/timestamps).
  - **Semantic Status Colors:** Emerald `#059669` (`Available`, `Campus Verified`, `Accepted`), Amber `#D97706` (`Reserved`, `Countered`, `Auto-Drop Active`), Rose `#DC2626` (`Sold`, `Rejected`, `Suspended`).
- **Typography:** Clean sans-serif system/Google font (`Inter` or `Plus Jakarta Sans` via `next/font/google`) with tabular numerals (`tabular-nums`) for prices, percentages, and countdown timers.
- **Header & Navigation Structure:**
  - **Top Bar (`#131921`):**
    1. Brand Logo (`হাতবদল` in crisp white/amber typography + `HaatBodol` tag).
    2. Campus/Location selector pill (e.g., `Deliver / Pickup: Dhaka Campuses`).
    3. Integrated Search Bar (Category dropdown `All | Electronics | Furniture | Clothing` + keyword input + Amber search submit button).
    4. Notification Bell icon with unread count dropdown.
    5. Watchlist shortcut with saved item count.
    6. Account & Lists dropdown (shows user name, `Campus Verified` badge if applicable, instant **Buyer / Seller Mode Switcher**, Dashboard link, Sign Out).
    7. Shopping Cart icon with item count badge.
  - **Secondary Sub-Navigation Bar (`#232F3E`):**
    - Quick links: `All Listings`, `Electronic Devices`, `Furniture`, `Clothing`, `Auto-Drop Deals`, `Campus Verified`, and a prominent **`+ Sell an Item`** button on the right.
- **Product Cards:**
  - Clean white card with 4:3 aspect-ratio image container, top-left condition badge (`Like New`, `Good`, `Fair`, `Needs Repair`), top-right Auto-Drop indicator badge (if active, showing `-5% Soon`), 2-line clamped product title, seller name + star rating + `Campus Verified` checkmark, strikethrough original retail price, bold current asking price, pickup area tag, and action buttons (`View Details` / `Quick Add`).
- **Anti-Patterns to Avoid:**
  - No neon gradients, glassmorphism clutter, bouncing animations, or unstyled HTML tables/forms.
  - Full mobile, tablet, and desktop responsiveness using CSS Grid and Flexbox (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`).

---

## 4. Complete Feature Breakdown

### 4.1 User Authentication, Role Switching & Campus Verification
- **Registration & Login:** Users register with Full Name, Email, Phone Number, Residential/Campus Pickup Area, Password, and an optional Institutional Student Email (e.g., `*@*.edu.bd` or `*@*.edu`). Passwords are hashed in Java with `BCryptPasswordEncoder` (`spring-security-crypto`, 10 salt rounds). Login sets an `HTTP-only` HS256 JWT cookie (`haatbodol_session` signed via `jjwt`).
- **Campus Verified Badge:** Providing a valid `.edu` / `.edu.bd` institutional email (or verifying via profile settings) sets `is_campus_verified = TRUE` and displays a trusted **Campus Verified** shield badge on the user's profile and listings.
- **Seamless Role Switching:** Every standard user (`account_type = 'USER'`) has an `active_role` (`'BUYER'` or `'SELLER'`) toggleable in the header and dashboard without logging out. Admin users (`account_type = 'ADMIN'`) have access to `/admin`.
- **Account Status Enforcement:** Suspended or banned users (`SUSPENDED`, `BANNED`) are blocked from logging in or performing write operations.

### 4.2 Product Listing Creation & Dynamic Depreciation Estimator
- **Categorized Listing Form:** Sellers create listings under three categories: **`Electronic Devices`**, **`Furniture`**, and **`Clothing`**, uploading **1 to 5 images** (validated for JPEG/PNG/WebP and compressed server-side in Java via `Thumbnailator` into `public/uploads/listings/`), plus Title, Description, Original Purchase Price (BDT `৳`), Age in Months, Physical Condition (`Like New`, `Good`, `Fair`, `Needs Repair`), Pickup Location, `is_negotiable` toggle, and `auto_drop_enabled` toggle.
- **Real-Time Dynamic Depreciation Estimator:** As the seller selects Category, Original Price, Age in Months, and Condition, the frontend calls `POST /api/listings/estimate-price` (using the **Strategy Pattern**). The system calculates and displays a **Suggested Fair Resale Range (`suggested_min_price` – `suggested_max_price`)** alongside an explanation of the depreciation factors so the seller can price competitively.
- **Listing Lifecycle States:** Sellers can transition their listings between `AVAILABLE`, `HIDDEN` (temporarily paused), `RESERVED` (locked via accepted offer or active checkout), and `SOLD` (handover completed).

### 4.3 Structured "Make an Offer" Bargaining System (Max 3 Rounds)
- **Constrained Offer Slider:** On any `AVAILABLE` listing where `is_negotiable = TRUE`, buyers see an interactive **"Make an Offer"** panel. The range slider is strictly locked between **70% (30% off)** and **85% (15% off)** of `current_asking_price`. Both frontend UI and backend API reject any offer outside `[0.70 * askingPrice, 0.85 * askingPrice]`.
- **Strict 3-Round Workflow:**
  - **Round 1 (Buyer Initiates):** Buyer submits an offer within 70%–85%. A `negotiation_sessions` record (`round_count = 1`, `session_status = 'PENDING'`) and an `offer_rounds` entry are created. Seller receives a notification.
  - **Round 2 (Seller Responds):** Seller can **Accept**, **Reject**, or **Counter-Offer** (constrained between the buyer's offer and the current asking price). Countering increments `round_count = 2` (`session_status = 'COUNTERED'`) and notifies the buyer.
  - **Round 3 (Buyer Final Response):** Buyer can **Accept**, **Reject**, or submit one **Final Counter-Offer** (`round_count = 3`). At Round 3, the seller can only **Accept** or **Reject** (no further counter-offers permitted).
- **Deal Lock & Direct Chat Unlock:** When either party clicks **Accept**:
  1. `negotiation_sessions.session_status` becomes `'ACCEPTED'`.
  2. `product_listings.listing_status` becomes `'RESERVED'`.
  3. All other pending/countered negotiation sessions on that same listing are automatically set to `'REJECTED'` (competing offers locked out).
  4. The agreed price item is automatically added to the matched buyer's Cart/Checkout queue.
  5. A private **Direct Chat** thread unlocks between buyer and seller, and their **phone numbers and exact pickup addresses are unmasked** (via the **Proxy Pattern**).

### 4.4 Auto-Drop Dutch Auction Engine
- **Configuration:** When `auto_drop_enabled = TRUE`, the seller must provide a `min_reserve_price` (must be strictly less than `current_asking_price` and `> 0`). The system creates an `auto_drop_configs` record with `drop_percentage = 5.00`, `interval_hours = 168` (7 days), and `next_drop_at = published_at + 7 days`.
- **Automated Price Reduction Logic:**
  - Every 7 days (`NOW() >= next_drop_at` and `is_halted = FALSE` and `listing_status = 'AVAILABLE'`), the engine calculates:
    $$\text{newPrice} = \text{ROUND}(\text{current\_asking\_price} \times 0.95, 2)$$
  - **Floor Price Cap:** If $\text{newPrice} \le \text{min\_reserve\_price}$, $\text{newPrice}$ is clamped to $\text{min\_reserve\_price}$ and `is_halted` is set to `TRUE`. Otherwise, `next_drop_at` is advanced by 168 hours.
  - **Watchlist Alerts:** Every successful price drop triggers the **Observer Pattern** to dispatch in-app and simulated email notifications to all users who bookmarked that listing in `watchlist_items`.
- **Evaluator/Demo Trigger:** In addition to the automatic server interval check, provide an **Admin "Run Auto-Drop Cycle Now"** control in the Admin Dashboard (which processes due listings or allows simulating a 7-day tick on a test listing) so evaluators can demonstrate the Dutch Auction drop and Watchlist notification immediately.

### 4.5 Search, Multi-Attribute Filtering, Sorting & Watchlist
- **Search & Faceted Discovery (`/listings`):**
  - Keyword search across title and description.
  - Filters: Category (`Electronic Devices`, `Furniture`, `Clothing`), Price Range (`Min` – `Max` BDT), Condition (`Like New`, `Good`, `Fair`, `Needs Repair`), Pickup Location, `Auto-Drop Active` checkbox, and `Campus Verified Sellers Only` checkbox.
  - Sorting: `Newly Listed` (default), `Price: Low to High`, `Price: High to Low`, and `Soonest Price Drop` (`next_drop_at ASC`).
- **Watchlist (`/watchlist`):** Buyers can toggle a heart/bookmark icon on any product card or detail page to save items and receive automatic price-drop notifications.

### 4.6 Shopping Cart, Checkout, Direct Chat & Mutual Reviews
- **Shopping Cart (`/cart`) & Checkout (`/checkout`):**
  - Supports adding `AVAILABLE` items directly at `current_asking_price` ("Buy Now / Add to Cart") as well as pre-populated items locked via an `ACCEPTED` negotiation at `final_agreed_price`.
  - Checkout captures Delivery/Handover Method (`Campus Public Meetup` or `Local Courier Delivery`), Handover/Shipping Address, and Payment Method (`Cash on Handover`, `bKash / Mobile Banking`, `Card Payment`).
  - Completing checkout creates a `transaction_orders` record with a unique invoice number (e.g., `HB-2026-00012`), marks the listing `RESERVED` (if bought directly), unlocks Direct Chat for handover coordination, and allows the seller/buyer to confirm delivery and mark the listing **`SOLD`**.
- **Direct Chat (`/messages` or embedded in Deal View):** Available exclusively for `RESERVED` or `SOLD` transactions between the matched buyer and seller. Displays unmasked contact phone numbers, pickup location safety guidelines (recommending public campus hubs), and real-time polling message history.
- **Mutual Rating & Review System:** Once an order/listing reaches `SOLD`, both buyer and seller can submit a **1 to 5 star rating** and written feedback (`user_reviews`), which dynamically recalculates the target user's `average_rating` and `total_reviews`.

### 4.7 Administrative & Moderation Dashboard (`/admin`)
- **Platform KPI Overview:** Total active users, available/reserved/sold listings, completed transaction volume (BDT), pending reports, and active Auto-Drop auctions.
- **Listing Moderation Queue:** View all user-flagged listings (`moderation_reports`), inspect reported reason and listing details, and click **Dismiss Report** or **Remove Listing** (sets `listing_status = 'HIDDEN'` and notifies the seller).
- **User Management:** Search users, inspect ratings/reports, toggle `Campus Verified` status if needed, and **Suspend**, **Ban**, or **Reactivate** accounts.
- **Auto-Drop Engine Control Panel:** Inspect active Dutch auctions, see `next_drop_at` timestamps, and manually trigger an Auto-Drop evaluation cycle.

---

## 5. Selection and Detailed Implementation Plans for the 8 Design Patterns

All 8 backend Design Patterns are implemented in **Java** under `backend/src/main/java/com/haatbodol/patterns/` following **classic textbook Gang of Four (GoF) OOP architecture** (formal Java `interface`s, `abstract class`es, concrete classes, Contexts, Subjects/Observers, private-constructor Singletons, Factories, Builders, Facades, and Protection Proxies).

### 5.1 Design Patterns Summary Mapping Table

| # | Design Pattern | Application Module / Feature | Java Package & Files (`backend/src/main/java/com/haatbodol/patterns/...`) | Core Problem Solved |
| :- | :--- | :--- | :--- | :--- |
| **1** | **Singleton Pattern** | MySQL HikariCP Pool & Auto-Drop Scheduler | `singleton/DatabasePool.java` & `singleton/AutoDropScheduler.java` | Enforces a single JVM-wide HikariCP connection pool to XAMPP MySQL and prevents overlapping Dutch Auction execution cycles. |
| **2** | **Strategy Pattern** | Dynamic Depreciation Estimator | `strategy/DepreciationStrategy.java` (`interface`), `AbstractDepreciationStrategy.java`, `ElectronicsDepreciationStrategy.java`, `FurnitureDepreciationStrategy.java`, `ClothingDepreciationStrategy.java`, `DepreciationContext.java` | Encapsulates interchangeable category-specific resale depreciation algorithms behind a formal Strategy interface and Context. |
| **3** | **Observer Pattern** | Watchlist Price-Drop & Offer Event Broadcaster | `observer/MarketplaceSubject.java` (`interface`), `MarketplaceObserver.java` (`interface`), `MarketplaceEventSubject.java`, `InAppNotificationObserver.java`, `EmailGatewayObserver.java` | Decouples core pricing/offer mutations from multi-channel notification delivery (In-App DB + simulated Email log). |
| **4** | **Factory Pattern** | Structured Notification Object Generator | `factory/NotificationFactory.java` (with `MarketplaceNotification` product hierarchy / typed factory methods) | Standardizes construction of typed alert products (`PRICE_DROP`, `OFFER_RECEIVED`, `OFFER_COUNTERED`, `OFFER_ACCEPTED`, `OFFER_REJECTED`, `LISTING_MODERATED`). |
| **5** | **Facade Pattern** | Deal Lock, Offer Acceptance & Order Checkout | `facade/DealCheckoutFacade.java` | Coordinates multi-table atomic JDBC transactions across listings, negotiations, cart/orders, direct chat, and `MarketplaceEventSubject`. |
| **6** | **Builder Pattern** | Multi-Attribute Marketplace Search Query Builder | `builder/ListingQueryBuilder.java` (with `BuiltSqlQuery` product class and fluent `Builder` interface/implementation) | Step-by-step fluent assembly of injection-proof parameterized JDBC `WHERE`, `JOIN`, `ORDER BY`, and pagination queries. |
| **7** | **Proxy Pattern** | Listing Contact Privacy & Role Authorization Guard | `proxy/ListingAccessService.java` (`interface`), `RealListingAccessService.java`, `ListingAccessProxy.java` | Protection Proxy controlling access to `RealListingAccessService`: masks seller phone/address for unauthorized viewers and guards write operations. |
| **8** | **Decorator Pattern** | Product Card & Detail Presentation Enhancer | `decorator/ListingPresentationComponent.java` (`interface`), `BaseListingComponent.java`, `ListingPresentationDecorator.java` (`abstract class`), `SavingsBadgeDecorator.java`, `AutoDropCountdownDecorator.java`, `CampusVerifiedDecorator.java`, `ListingDecoratorPipeline.java` | Dynamically layers computed savings badges, Auto-Drop countdown metadata, and Campus Verified trust badges around a base listing component. |

---

### 5.2 Detailed Implementation Specifications for Each Pattern

#### Pattern 1: Singleton Pattern
- **Pattern Name:** Singleton Pattern (Creational — Thread-Safe Double-Checked Locking)
- **Purpose:** Ensures a class has strictly one shared instance across the entire Java Virtual Machine (JVM) runtime and provides a global point of access to it. This solves two critical issues in a Spring Boot + XAMPP environment: (1) preventing connection exhaustion (`ER_CON_COUNT_ERROR`) against local XAMPP MySQL by pooling connections through one shared `HikariDataSource`; (2) ensuring the background Auto-Drop Dutch Auction scheduler runs through a single guarded controller rather than spawning duplicate timers that double-discount items.
- **Project Application:** Database connection pooling (`DatabasePool.java`) and background Auto-Drop Dutch Auction scheduler (`AutoDropScheduler.java`).
- **Textbook GoF Java Structure:**
  - `backend/src/main/java/com/haatbodol/patterns/singleton/DatabasePool.java`:
    - `private static volatile DatabasePool instance;`
    - `private final HikariDataSource dataSource;`
    - `private DatabasePool()` — true **`private` constructor** that loads local DB settings from environment variables / `.env.local` (defaulting to `jdbc:mysql://127.0.0.1:3306/haatbodol_db`, user `root`, blank password, max pool size `10`) and initializes `HikariDataSource`.
    - `public static DatabasePool getInstance()` — thread-safe **double-checked locking** (`synchronized (DatabasePool.class)`).
    - Exposes `public Connection getConnection() throws SQLException` and `public HikariDataSource getDataSource()`.
  - `backend/src/main/java/com/haatbodol/patterns/singleton/AutoDropScheduler.java`:
    - `private static volatile AutoDropScheduler instance;`
    - `private AutoDropScheduler()` — true **`private` constructor** with a thread-safe `AtomicBoolean isRunning` mutex lock.
    - `public static AutoDropScheduler getInstance()` — double-checked locking accessor, invoked both by a Spring `@Scheduled` periodic trigger (e.g., every 60 seconds) and by the Admin manual cycle endpoint (`POST /api/admin/autodrop/run`).
- **Interaction Flow:** Any Spring Boot controller, service, or pattern class needing MySQL access calls `DatabasePool.getInstance().getConnection()`. When the 60-second `@Scheduled` tick or an Admin triggers `AutoDropScheduler.getInstance().runDueDrops()`, the `AtomicBoolean` mutex guarantees only one drop pass executes at a time.
- **Practical Example:** When 15 concurrent users browse the homepage and submit offers simultaneously, every Java controller borrows and returns connections through the single `DatabasePool` `HikariDataSource` without ever opening duplicate pools to XAMPP MySQL.
- **Implementation Phase:** Phase 3 (`DatabasePool.java`) & Phase 7 (`AutoDropScheduler.java`).

---

#### Pattern 2: Strategy Pattern
- **Pattern Name:** Strategy Pattern (Behavioral)
- **Purpose:** Defines a family of interchangeable depreciation algorithms, encapsulates each one in its own concrete class behind a common Java `interface`, and allows the `Context` to select and swap them cleanly at runtime without brittle `if/else` chains.
- **Project Application:** Dynamic Depreciation Estimator during product listing creation and editing (`POST /api/listings/estimate-price`).
- **Textbook GoF Java Structure (`backend/src/main/java/com/haatbodol/patterns/strategy/`):**
  - **Strategy Interface (`DepreciationStrategy.java`):** Declares `DepreciationEstimate calculate(double originalPrice, int ageInMonths, String condition)` and `String getCategoryName()`.
  - **Abstract Strategy (`AbstractDepreciationStrategy.java`):** `public abstract class AbstractDepreciationStrategy implements DepreciationStrategy` holding shared condition multipliers (`Like New: 0.92`, `Good: 0.80`, `Fair: 0.65`, `Needs Repair: 0.45`) and `MIN_FLOOR_RATIO = 0.10`, implementing the common estimation calculation while delegating category-specific decay to `protected abstract double calculateAgeFactor(int ageInMonths)` and `protected abstract String generateExplanation(...)`.
  - **Concrete Strategies:**
    - `ElectronicsDepreciationStrategy.java`: Applies steeper monthly decay (`2.2%` per month up to 24 months, `1.0%` thereafter) because gadgets and phones depreciate rapidly.
    - `FurnitureDepreciationStrategy.java`: Applies gradual monthly decay (`0.8%` per month) weighted heavily by physical condition.
    - `ClothingDepreciationStrategy.java`: Applies a steep initial second-hand drop (`45%` off retail immediately) followed by mild monthly wear decay (`0.6%` per month).
  - **Context (`DepreciationContext.java`):** Maintains a reference `private DepreciationStrategy strategy;`, provides `setStrategy(DepreciationStrategy)` and `resolveStrategy(String category)` mapping `'Electronic Devices'`, `'Furniture'`, and `'Clothing'` to their concrete strategy classes, and returns a `DepreciationEstimate` DTO (`suggestedMin`, `suggestedMax`, `baselinePrice`, `depreciationPercentage`, `explanation`).
- **Interaction Flow:** Seller enters Original Price (`৳50,000`), Category (`Electronic Devices`), Age (`12 months`), and Condition (`Good`) -> Next.js proxies `POST /api/listings/estimate-price` to `ListingController` -> `DepreciationContext` resolves `ElectronicsDepreciationStrategy` -> computes baseline value (`৳36,800` × `0.80` = `৳29,440`) and returns a fair range (`৳27,000 – ৳31,500`) as JSON.
- **Practical Example:** A student listing a 12-month-old laptop receives a steeper depreciation curve than a student listing a 12-month-old wooden study desk of the same original price, simply by swapping the Strategy object inside `DepreciationContext`.
- **Implementation Phase:** Phase 6.

---

#### Pattern 3: Observer Pattern
- **Pattern Name:** Observer Pattern (Behavioral)
- **Purpose:** Defines a one-to-many dependency between a `Subject` and multiple `Observer` implementations so that when an item's price drops or a negotiation state changes, all registered notification channels are notified automatically without tightly coupling domain services to delivery mechanisms.
- **Project Application:** Watchlist price-drop alerts (triggered by `AutoDropScheduler`) and real-time Offer / Counter-Offer / Deal-Lock / Moderation alerts.
- **Textbook GoF Java Structure (`backend/src/main/java/com/haatbodol/patterns/observer/`):**
  - **Subject Interface (`MarketplaceSubject.java`):** Declares `void subscribe(MarketplaceObserver observer)`, `void unsubscribe(MarketplaceObserver observer)`, and `void notifyObservers(String eventType, Map<String, Object> payload)`.
  - **Observer Interface (`MarketplaceObserver.java`):** Declares `void update(String eventType, Map<String, Object> payload)`.
  - **Concrete Subject (`MarketplaceEventSubject.java`):** Implements `MarketplaceSubject`, manages a thread-safe collection of registered `MarketplaceObserver` instances, and dispatches domain events (`PRICE_DROPPED`, `OFFER_RECEIVED`, `OFFER_COUNTERED`, `OFFER_ACCEPTED`, `OFFER_REJECTED`, `LISTING_MODERATED`) to all subscribers.
  - **Concrete Observers:**
    - `InAppNotificationObserver.java` (`implements MarketplaceObserver`): Delegates to `NotificationFactory` to build typed `MarketplaceNotification` products and persists rows into MySQL `notifications` (`delivery_channel = 'IN_APP'`) via `DatabasePool`.
    - `EmailGatewayObserver.java` (`implements MarketplaceObserver`): Formats and logs structured email dispatches (to Spring Boot server logs and MySQL `notifications` with `delivery_channel = 'EMAIL'`), simulating external email delivery for price drops and accepted deals reliably without external SMTP failures in local XAMPP testing.
- **Interaction Flow:** `AutoDropScheduler` reduces a study table's price from `৳4,000` to `৳3,800` -> calls `eventSubject.notifyObservers("PRICE_DROPPED", payload)` -> `MarketplaceEventSubject` queries `watchlist_items` for `listingId` and invokes `observer.update(...)` on both `InAppNotificationObserver` and `EmailGatewayObserver` for every watching user.
- **Practical Example:** Three students have bookmarked a used graphing calculator. When its 7-day Auto-Drop timer fires and lowers the price by 5%, all three students immediately receive an unread bell notification in their header and a logged email notification entry.
- **Implementation Phase:** Phase 7.

---

#### Pattern 4: Factory Pattern
- **Pattern Name:** Factory Pattern (Creational — Factory Method / Simple Factory with Product Hierarchy)
- **Purpose:** Centralizes and encapsulates object instantiation for diverse marketplace notification types behind a common product abstraction, ensuring consistent English titles, message templates, delivery channels, and deep-link `action_url` paths across the entire backend.
- **Project Application:** Notification generation across Auto-Drop price reductions, 3-round offer negotiations, deal locks, and admin moderation actions.
- **Textbook GoF Java Structure (`backend/src/main/java/com/haatbodol/patterns/factory/`):**
  - **Product Interface / Abstract Product (`MarketplaceNotification.java`):** Defines the common contract (`getUserId()`, `getListingId()`, `getNotificationType()`, `getDeliveryChannel()`, `getTitle()`, `getMessageBody()`, `getActionUrl()`) with specialized notification products (or strongly typed concrete subclasses such as `PriceDropNotification`, `OfferNotification`, `DealLockedNotification`, `ModerationNotification`).
  - **Factory (`NotificationFactory.java`):** Provides typed static/instance factory methods (`createNotification(String type, Map<String, Object> data)` plus type-specific builders for `PRICE_DROP`, `OFFER_RECEIVED`, `OFFER_COUNTERED`, `OFFER_ACCEPTED`, `OFFER_REJECTED`, `LISTING_MODERATED`) that instantiate and return validated `MarketplaceNotification` objects ready for JDBC insertion.
- **Interaction Flow:** `InAppNotificationObserver` receives an `OFFER_COUNTERED` event -> calls `NotificationFactory.createNotification("OFFER_COUNTERED", payload)` -> receives a cleanly formatted English `MarketplaceNotification` (`title = "Counter-Offer Received (Round 2/3)"`, `actionUrl = "/dashboard"`) -> persists row into MySQL `notifications`.
- **Practical Example:** Instead of scattering string concatenation and deep-link URLs across `OfferController`, `AdminController`, and `AutoDropScheduler`, every module delegates alert instantiation to `NotificationFactory`.
- **Implementation Phase:** Phase 7.

---

#### Pattern 5: Facade Pattern
- **Pattern Name:** Facade Pattern (Structural)
- **Purpose:** Provides a unified, high-level Java interface to a complex subsystem of multi-table transactional operations, shielding Spring Boot REST controllers from low-level JDBC transaction management and ensuring atomic database consistency across 5+ tables.
- **Project Application:** Offer Acceptance / Deal Locking (`acceptOfferAndLockDeal`) and Direct E-Commerce Order Checkout (`completeOrderCheckout`).
- **Textbook GoF Java Structure (`backend/src/main/java/com/haatbodol/patterns/facade/`):**
  - **Facade (`DealCheckoutFacade.java`):** Coordinates multiple domain subsystems inside a single explicit JDBC transaction (`conn.setAutoCommit(false)`, `conn.commit()`, `conn.rollback()` via `DatabasePool.getInstance().getConnection()`):
    1. **Listing Subsystem:** Locks and verifies (`SELECT ... FOR UPDATE`) that the target `product_listings` row is still `AVAILABLE` (or `RESERVED` for that matched buyer).
    2. **Negotiation Subsystem:** Updates `negotiation_sessions` (`session_status = 'ACCEPTED'`), inserts the final `offer_rounds` audit entry, and auto-rejects all competing pending/countered sessions on the same listing.
    3. **Inventory State Transition:** Updates `product_listings` (`listing_status = 'RESERVED'` upon offer acceptance or direct checkout; `'SOLD'` upon final handover confirmation).
    4. **Cart, Order & Direct Chat Subsystem:** Populates `cart_items` or inserts `transaction_orders` (generating unique invoice numbers such as `HB-2026-00012`) and seeds the initial `direct_chat_messages` system welcome message signaling that contact details are now unmasked.
    5. **Event Notification Subsystem:** Invokes `MarketplaceEventSubject.notifyObservers(...)` after commit to alert both buyer and seller (and notify rejected rival bidders).
- **Interaction Flow:** Buyer clicks **Accept Counter-Offer** -> `POST /api/offers/{sessionId}/accept` in `OfferController` invokes `dealCheckoutFacade.acceptOfferAndLockDeal(sessionId, userId)` -> Facade executes all 5 steps atomically in JDBC and returns the locked deal summary, chat session ID, and cart/checkout payload.
- **Practical Example:** If two buyers negotiate on the same bicycle and Buyer A accepts a counter-offer first, `DealCheckoutFacade` atomically reserves the bicycle for Buyer A, rejects Buyer B's session, opens Buyer A's Direct Chat with the seller's unmasked phone number, and dispatches notifications in one single Facade call.
- **Implementation Phase:** Phase 8.

---

#### Pattern 6: Builder Pattern
- **Pattern Name:** Builder Pattern (Creational)
- **Purpose:** Separates the step-by-step construction of a complex parameterized SQL query from its final representation (`BuiltSqlQuery`), enabling clean, injection-proof assembly of dynamic search, filter, sort, and pagination clauses.
- **Project Application:** Marketplace product browsing, search bar queries, and multi-attribute filtering (`GET /api/listings`).
- **Textbook GoF Java Structure (`backend/src/main/java/com/haatbodol/patterns/builder/`):**
  - **Product (`BuiltSqlQuery.java`):** Immutable value object holding `final String sql`, `final String countSql`, `final List<Object> params`, and `final List<Object> countParams` ready for JDBC `PreparedStatement` binding.
  - **Builder Interface (`SqlQueryBuilder.java`):** Declares the fluent construction steps (`filterByStatus`, `filterByKeyword`, `filterByCategory`, `filterByPriceRange`, `filterByCondition`, `filterByLocation`, `filterAutoDropOnly`, `filterCampusVerifiedOnly`, `sortBy`, `paginate`, `build()`).
  - **Concrete Builder (`ListingQueryBuilder.java`):** Implements `SqlQueryBuilder`, safely accumulating `WHERE` predicates, `LEFT JOIN` clauses (for `auto_drop_configs`, `users`, and primary `listing_images`), whitelisted `ORDER BY` expressions, bound JDBC parameter lists, and `LIMIT / OFFSET` pagination before returning `BuiltSqlQuery`.
- **Interaction Flow:** User selects `Category: Electronic Devices`, `Condition: Like New`, `Auto-Drop Active: true`, `Sort: Soonest Price Drop` -> `ListingController` chains the fluent methods on `new ListingQueryBuilder()` -> calls `.build()` -> executes the returned `BuiltSqlQuery` against `DatabasePool.getInstance().getConnection()`.
- **Practical Example:** Searching `"desk"` under `Furniture` between `৳1,500` and `৳5,000` sorted by `Price: Low to High` produces a clean, SQL-injection-proof `BuiltSqlQuery` with exact bound JDBC parameters (`["AVAILABLE", "%desk%", "%desk%", "Furniture", 1500.0, 5000.0]`).
- **Implementation Phase:** Phase 7.

---

#### Pattern 7: Proxy Pattern
- **Pattern Name:** Proxy Pattern (Structural — Protection Proxy)
- **Purpose:** Provides a surrogate/placeholder implementing the exact same Java `interface` as the real listing access service so that sensitive personal contact details (`phone_number`, `residential_address`) are masked for unauthorized viewers and role/ownership authorization is strictly enforced before delegating to the real service.
- **Project Application:** Privacy masking of seller/buyer personal contact details on public listings (`GET /api/listings/{id}`), Direct Chat access guards, and ownership/admin validation on listing updates/deletions (`PATCH/DELETE /api/listings/{id}`).
- **Textbook GoF Java Structure (`backend/src/main/java/com/haatbodol/patterns/proxy/`):**
  - **Subject Interface (`ListingAccessService.java`):** Declares `ListingDetailResponse getListingDetail(long listingId, AuthenticatedUser requester)`, `void updateListing(long listingId, UpdateListingRequest req, AuthenticatedUser requester)`, and `void deleteListing(long listingId, AuthenticatedUser requester)`.
  - **Real Subject (`RealListingAccessService.java`):** Implements `ListingAccessService` and performs the raw JDBC fetches (including seller phone number and full residential address) and SQL updates/deletes without privacy filtering.
  - **Protection Proxy (`ListingAccessProxy.java`):** Implements `ListingAccessService` and holds a reference to `RealListingAccessService`. Before returning a listing detail, it checks whether `requester` is the `seller`, the matched `buyer` of a `RESERVED`/`SOLD` deal on that item, or an `ADMIN`:
    - If unauthorized, replaces `seller_phone` with `"Hidden until offer accepted"`, masks `residential_address` to general campus/neighborhood area only, and sets `contact_unlocked = false`.
    - On write operations (`updateListing`, `deleteListing`), verifies `requester.getUserId() == listing.getSellerId() || "ADMIN".equals(requester.getAccountType())`, throwing a `403 Forbidden` exception before ever invoking `RealListingAccessService`.
- **Interaction Flow:** Public visitor opens `/listings/104` -> `ListingController` calls `listingAccessProxy.getListingDetail(104, requester)` -> Proxy delegates raw fetch to `RealListingAccessService`, inspects deal lock status, and returns the privacy-sanitized response.
- **Practical Example:** A browsing buyer sees `"Pickup Area: Dhanmondi / Campus Gate 2"` and `"Phone: Hidden until offer accepted"`. The exact second the seller accepts the buyer's slider offer, refreshing `/listings/104` causes `ListingAccessProxy` to detect the matched `RESERVED` deal and unmask `"+88017XXXXXXXX"`.
- **Implementation Phase:** Phase 8.

---

#### Pattern 8: Decorator Pattern
- **Pattern Name:** Decorator Pattern (Structural)
- **Purpose:** Dynamically attaches computed presentation attributes, discount badges, Auto-Drop countdown timers, and Campus Verified trust metadata to listing objects by wrapping them in composable Java decorator classes without altering the underlying MySQL schema or core `ListingDto` model.
- **Project Application:** Enriching product cards (`ProductCard.jsx`) and product detail views returned by `GET /api/listings` and `GET /api/listings/{id}`.
- **Textbook GoF Java Structure (`backend/src/main/java/com/haatbodol/patterns/decorator/`):**
  - **Component Interface (`ListingPresentationComponent.java`):** Declares `Map<String, Object> toPresentationMap()`, `ListingDto getBaseListing()`, and `Map<String, Object> getDecorators()`.
  - **Concrete Component (`BaseListingComponent.java`):** Implements `ListingPresentationComponent`, normalizes base numeric fields (`original_price`, `current_asking_price`), resolves photographic category fallback images (`/uploads/defaults/{laptop,study-desk,winter-jacket}.jpg`), and initializes the `decorators` presentation map.
  - **Abstract Decorator (`ListingPresentationDecorator.java`):** `public abstract class ListingPresentationDecorator implements ListingPresentationComponent` holding `protected final ListingPresentationComponent wrappedComponent;` and delegating base component operations.
  - **Concrete Decorators:**
    - `SavingsBadgeDecorator.java` (`extends ListingPresentationDecorator`): Computes `savingsAmount` and `savingsPercent` (`Math.round(((original - current) / original) * 100)`) and attaches `savingsBadge` (`"Save X% off retail"`) + `pricingMeta` when `savingsPercent >= 10`.
    - `AutoDropCountdownDecorator.java` (`extends ListingPresentationDecorator`): When `auto_drop_enabled` is true and `is_halted` is false, computes `nextDropPrice = Math.max(minReservePrice, Math.round(current * 0.95))`, calculates time remaining until `next_drop_at`, and attaches `autoDropBadge` (`"Drops 5% in Xd Yh"` / `"Drops 5% in Xh"` / `"Drops 5% Soon"`) + `auctionMeta`.
    - `CampusVerifiedDecorator.java` (`extends ListingPresentationDecorator`): Attaches `campusVerifiedBadge` (`{ label: "Campus Verified Seller", verified: true, tooltip: "Verified university student/staff identity" }`) when `seller.is_campus_verified` is true.
  - **Pipeline Utility (`ListingDecoratorPipeline.java`):** Composes the textbook decorator chain via `new CampusVerifiedDecorator(new AutoDropCountdownDecorator(new SavingsBadgeDecorator(new BaseListingComponent(dto))))` with `decorate(ListingDto)` and `decorateAll(List<ListingDto>)`.
- **Interaction Flow:** `GET /api/listings` retrieves `ListingDto` rows -> passes them through `ListingDecoratorPipeline.decorateAll(rows)` -> serializes each `toPresentationMap()` JSON payload -> Next.js `ProductCard.jsx` renders crisp, consistent badges directly from `listing.decorators`.
- **Practical Example:** A used mechanical keyboard originally `৳6,000`, now `৳3,600` with Auto-Drop active in 18 hours from a verified student seller automatically receives three structured decorator outputs: `"Save 40% off retail"`, `"Drops 5% in 18h"` (next price `৳3,420`), and `"Campus Verified Seller"`.
- **Implementation Phase:** Phase 6.

---

## 6. Database Schema and Relationship Documentation (XAMPP / MySQL)

### 6.1 XAMPP Connection Configuration
- **Database Name:** `haatbodol_db`
- **Character Set / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`
- **Default XAMPP Credentials (`.env.local` & `backend/src/main/resources/application.properties`):**
  ```env
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=
  DB_NAME=haatbodol_db
  JWT_SECRET=haatbodol_super_secret_university_key_2026
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  BACKEND_URL=http://localhost:8080
  ```

### 6.2 Entity Relationships Overview
- **One-to-Many (`1:N`):**
  - `users` $\rightarrow$ `product_listings` (One seller creates many listings)
  - `product_listings` $\rightarrow$ `listing_images` (One listing has 1 to 5 images)
  - `product_listings` $\rightarrow$ `negotiation_sessions` (One listing can receive multiple buyer negotiation threads)
  - `negotiation_sessions` $\rightarrow$ `offer_rounds` (One negotiation thread logs up to 3 offer/counter rounds)
  - `negotiation_sessions` $\rightarrow$ `direct_chat_messages` (One accepted negotiation unlocks many chat messages)
  - `users` $\rightarrow$ `notifications` (One user receives many notifications)
  - `transaction_orders` $\rightarrow$ `user_reviews` (One completed order enables up to 2 mutual reviews: buyer-to-seller and seller-to-buyer)
  - `product_listings` $\rightarrow$ `moderation_reports` (One listing can have moderation reports)
- **One-to-One (`1:1`):**
  - `product_listings` $\leftrightarrow$ `auto_drop_configs` (Optional 1:1 Dutch Auction configuration per listing)
  - `product_listings` $\leftrightarrow$ `transaction_orders` (Each unique second-hand item is fulfilled in at most one completed order)
- **Many-to-Many (`M:N` resolved via junction tables):**
  - `users` $\leftrightarrow$ `product_listings` via `watchlist_items` (Unique pair `user_id + listing_id`)
  - `users` $\leftrightarrow$ `product_listings` via `cart_items` (Unique pair `user_id + listing_id`)

### 6.3 Complete phpMyAdmin SQL Schema & Seed Data Script
The coding agent must save this SQL script to `database/schema.sql` and import/execute it in **phpMyAdmin** (`http://localhost/phpmyadmin`):

```sql
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
```

### 6.4 Sample Seed Data Strategy (`database/seed.sql`)
Provide a `database/seed.sql` script that inserts:
- **1 Admin Account:** `admin@haatbodol.com` / Password: `Password123!` (`account_type = 'ADMIN'`).
- **4 Realistic Standard Users** (all using password `Password123!` stored as BCrypt hashes):
  1. `Tanvir Ahmed` (`tanvir@northsouth.edu`, `is_campus_verified = 1`, Bashundhara R/A)
  2. `Nusrat Jahan` (`nusrat@bracu.ac.bd`, `is_campus_verified = 1`, Merul Badda / Mohakhali)
  3. `Rafiul Islam` (`rafiul.dhaka@gmail.com`, `is_campus_verified = 0`, Dhanmondi)
  4. `Sadia Rahman` (`sadia@du.ac.bd`, `is_campus_verified = 1`, Nilkhet / Shahbagh)
- **12 Realistic Used Product Listings** (4 in `Electronic Devices`, 4 in `Furniture`, 4 in `Clothing`) with crisp, reliable local photographic visuals stored in `public/uploads/defaults/`, realistic depreciation ranges, 5 items with `auto_drop_enabled = 1` (including 1 item whose `next_drop_at` is set to `NOW() - INTERVAL 1 HOUR` so evaluators can immediately test the Auto-Drop engine), sample watchlist bookmarks, 1 active 2-round negotiation session, and 1 completed `SOLD` order with mutual 5-star reviews.

---

## 7. Recommended Project Folder Structure

The codebase strictly separates the **Java Spring Boot 3.x backend (`backend/`)** from the **JavaScript-only (`.js` / `.jsx`) Next.js frontend (`src/`)**. All REST API endpoints and all 8 textbook GoF design patterns live exclusively under `backend/`, while `src/` holds the Next.js App Router pages, React components, and client state contexts:

```text
haatbodol/
├── backend/                               # Java Spring Boot 3.x REST API (:8080, Java 17+, JDK 17-24)
│   ├── .mvn/wrapper/                      # Maven Wrapper properties
│   ├── mvnw                               # Maven Wrapper (macOS/Linux)
│   ├── mvnw.cmd                           # Maven Wrapper (Windows)
│   ├── pom.xml                            # Spring Boot Web, mysql-connector-j, HikariCP, spring-security-crypto, jjwt, Thumbnailator
│   └── src/
│       └── main/
│           ├── resources/
│           │   └── application.properties # Server port (8080), multipart upload limits, XAMPP DB & JWT config
│           └── java/com/haatbodol/
│               ├── HaatBodolApplication.java # Spring Boot entry point (@SpringBootApplication, @EnableScheduling)
│               ├── config/
│               │   ├── CorsConfig.java    # Local CORS configuration for http://localhost:3000
│               │   └── EnvConfig.java     # Shared loader for environment variables & root .env.local
│               ├── security/
│               │   ├── AuthenticatedUser.java # Authenticated principal model (userId, email, activeRole, accountType)
│               │   ├── PasswordService.java   # BCryptPasswordEncoder (spring-security-crypto) wrapper
│               │   ├── JwtService.java        # HS256 JWT sign/verify via jjwt
│               │   └── AuthCookieHelper.java  # HTTP-only cookie (`haatbodol_session`) reader/writer
│               ├── model/
│               │   ├── UserDto.java           # Sanitized user profile DTO (never exposes password_hash)
│               │   ├── ListingDto.java        # Product listing DTO (snake_case JSON contract for frontend)
│               │   ├── DepreciationEstimate.java # Strategy Pattern valuation response DTO
│               │   ├── OfferSessionDto.java   # 3-round negotiation session & rounds DTO
│               │   ├── OrderDto.java          # Transaction order & invoice DTO
│               │   └── NotificationDto.java   # In-app alert DTO
│               ├── controller/
│               │   ├── HealthController.java  # GET /api/health (verifies Singleton DatabasePool -> XAMPP MySQL)
│               │   ├── AuthController.java    # /api/auth/{register, login, logout, me, role}
│               │   ├── ListingController.java # GET/POST /api/listings, POST /api/listings/estimate-price, /api/listings/{id}, /report
│               │   ├── OfferController.java   # GET/POST /api/offers, /api/offers/{sessionId}/{counter, accept, reject}
│               │   ├── ChatController.java    # GET/POST /api/chat/{sessionId} (Proxy-verified Direct Chat)
│               │   ├── WatchlistController.java # GET/POST/DELETE /api/watchlist
│               │   ├── CartController.java    # GET/POST/DELETE /api/cart
│               │   ├── OrderController.java   # GET/POST /api/orders, PATCH /{orderId}/complete, POST /{orderId}/review
│               │   ├── NotificationController.java # GET/PATCH /api/notifications
│               │   └── AdminController.java   # /api/admin/{overview, reports/{id}, users/{id}, autodrop/run}
│               ├── service/
│               │   ├── AuthService.java       # Registration, .edu verification, login, role toggle
│               │   ├── ListingService.java    # Listing persistence, image binding & Auto-Drop config creation
│               │   ├── ImageStorageService.java # Thumbnailator compression & saving into public/uploads/listings/
│               │   ├── OfferService.java      # 70%-85% validation & strict 3-round negotiation state machine
│               │   ├── ChatService.java       # Direct Chat message persistence
│               │   ├── WatchlistService.java  # Watchlist bookmark operations
│               │   ├── CartService.java       # Shopping cart operations
│               │   ├── OrderService.java      # Handover completion (-> SOLD) & mutual 1-5 star reviews
│               │   └── AdminService.java      # KPI aggregation, moderation queue & user status enforcement
│               └── patterns/                  # STRICT TEXTBOOK GoF JAVA DESIGN PATTERNS
│                   ├── singleton/
│                   │   ├── DatabasePool.java          # Pattern 1A: Private constructor + DCL HikariCP pool
│                   │   └── AutoDropScheduler.java     # Pattern 1B: Private constructor + @Scheduled / mutex lock
│                   ├── strategy/
│                   │   ├── DepreciationStrategy.java  # Pattern 2: Strategy interface
│                   │   ├── AbstractDepreciationStrategy.java # Abstract Strategy (condition multipliers & floor)
│                   │   ├── ElectronicsDepreciationStrategy.java # Concrete Strategy (2.2%/mo -> 1.0%/mo)
│                   │   ├── FurnitureDepreciationStrategy.java   # Concrete Strategy (0.8%/mo gradual decay)
│                   │   ├── ClothingDepreciationStrategy.java    # Concrete Strategy (45% initial + 0.6%/mo)
│                   │   └── DepreciationContext.java   # Context selecting & invoking active Strategy
│                   ├── observer/
│                   │   ├── MarketplaceSubject.java    # Pattern 3: Subject interface
│                   │   ├── MarketplaceObserver.java   # Observer interface
│                   │   ├── MarketplaceEventSubject.java # Concrete Subject managing subscribers
│                   │   ├── InAppNotificationObserver.java # Concrete Observer (DB in-app alerts)
│                   │   └── EmailGatewayObserver.java  # Concrete Observer (simulated email log/DB)
│                   ├── factory/
│                   │   ├── MarketplaceNotification.java # Pattern 4: Notification product interface/hierarchy
│                   │   └── NotificationFactory.java   # Typed notification factory
│                   ├── facade/
│                   │   └── DealCheckoutFacade.java    # Pattern 5: Atomic JDBC deal lock, chat unlock & checkout
│                   ├── builder/
│                   │   ├── SqlQueryBuilder.java       # Pattern 6: Fluent SQL Builder interface
│                   │   ├── ListingQueryBuilder.java   # Concrete Builder for faceted search & sort
│                   │   └── BuiltSqlQuery.java         # Immutable parameterized SQL + params product
│                   ├── proxy/
│                   │   ├── ListingAccessService.java  # Pattern 7: Subject interface
│                   │   ├── RealListingAccessService.java # Real Subject (unfiltered DB access)
│                   │   └── ListingAccessProxy.java    # Protection Proxy (contact masking & ownership/admin guard)
│                   └── decorator/
│                       ├── ListingPresentationComponent.java # Pattern 8: Component interface
│                       ├── BaseListingComponent.java         # Concrete Component
│                       ├── ListingPresentationDecorator.java # Abstract Decorator
│                       ├── SavingsBadgeDecorator.java        # Concrete Decorator (retail % savings badge)
│                       ├── AutoDropCountdownDecorator.java   # Concrete Decorator (5% drop countdown badge)
│                       ├── CampusVerifiedDecorator.java      # Concrete Decorator (Campus Verified badge)
│                       └── ListingDecoratorPipeline.java     # Pipeline chaining all concrete decorators
├── database/
│   ├── schema.sql                         # Full 13-table MySQL DDL for phpMyAdmin import
│   └── seed.sql                           # Realistic sample users, listings, and deals
├── public/
│   └── uploads/
│       ├── defaults/                      # Crisp local photographic default product visuals
│       └── listings/                      # Java Thumbnailator-compressed user product uploads
├── src/                                   # Next.js App Router Frontend ONLY (STRICTLY .js / .jsx)
│   ├── app/
│   │   ├── globals.css                    # Tailwind directives + clean commercial base styles
│   │   ├── layout.jsx                     # Root layout with AuthProvider, CartProvider, Navbar & Footer
│   │   ├── page.jsx                       # Amazon-inspired Homepage (Hero, Categories, Auto-Drop Deals, Fresh Picks)
│   │   ├── login/page.jsx                 # User & Admin Login page
│   │   ├── register/page.jsx              # Registration page with optional .edu Campus Verification
│   │   ├── listings/
│   │   │   ├── page.jsx                   # Marketplace Discovery with Faceted Sidebar & Sorting
│   │   │   ├── new/page.jsx               # Create Listing + Interactive Depreciation Estimator + Auto-Drop setup
│   │   │   └── [id]/page.jsx              # Product Detail Page + 70%-85% Offer Slider + Privacy-Masked Seller Card
│   │   ├── cart/page.jsx                  # Shopping Cart (Direct items + Accepted Offer items)
│   │   ├── checkout/page.jsx              # Checkout & Handover/Payment Confirmation
│   │   ├── watchlist/page.jsx             # Saved Watchlist items with Auto-Drop price tracking
│   │   ├── dashboard/
│   │   │   ├── page.jsx                   # Unified User Dashboard (Buyer Orders/Offers & Seller Listings/Offers)
│   │   │   └── messages/[sessionId]/page.jsx # Unlocked Direct Chat + Unmasked Contact Details + Review Modal
│   │   └── admin/page.jsx                 # Admin Moderation Dashboard (Reports, Users, Auto-Drop Trigger)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx                 # Two-tier Amazon-style header with Bangla logo হাতবদল
│   │   │   └── Footer.jsx                 # Clean marketplace footer with safety guidelines
│   │   ├── listings/
│   │   │   ├── ProductCard.jsx            # Commercial product card with Decorator badges & actions
│   │   │   ├── FilterSidebar.jsx          # Category, price, condition, location & Auto-Drop filters
│   │   │   ├── OfferSliderModal.jsx       # Constrained 70%-85% visual slider & round tracker
│   │   │   └── DepreciationBox.jsx        # Real-time price estimator widget for listing form
│   │   └── shared/
│   │       ├── Badge.jsx                  # Reusable status, condition & Campus Verified badges
│   │       └── StarRating.jsx             # Reusable 1-5 star display and interactive rating input
│   └── context/
│       ├── AuthContext.jsx                # Global user auth state, role switcher, unread notifications
│       └── CartContext.jsx                # Global shopping cart state synced with /api/cart
├── .env.local                             # Local XAMPP MySQL & JWT configuration
├── jsconfig.json                          # Path alias @/* -> ./src/* (JavaScript-only frontend configuration)
├── next.config.mjs                        # Next.js configuration (rewrites /api/:path* -> http://localhost:8080/api/:path*, unoptimized images)
├── package.json                           # Frontend dependencies only (next, react, react-dom, lucide-react, tailwindcss)
├── start.py                               # Single-command launcher for XAMPP check, Java backend (:8080) & Next.js (:3000)
└── tailwind.config.js                     # Tailwind theme colors and typography setup
```

---

## 8. Sequential, Phase-Wise Implementation Instructions

Follow these 10 phases strictly in order. Do not skip verification at the end of any phase.

---

### Phase 1: Project Analysis, Requirements & Architecture Planning
1. **Phase Objective:** Validate all domain rules, confirm local XAMPP + JDK + Node.js environment readiness, and establish strict technical guardrails before generating files.
2. **Tasks:**
   - Review the 13 MySQL tables, all 8 textbook GoF Java design patterns, and the strict English-only UI policy (with `হাতবদল` reserved exclusively for the brand logo).
   - Verify that XAMPP Apache and MySQL services are started locally on port `3306` and phpMyAdmin is accessible at `http://localhost/phpmyadmin`.
   - Confirm **Java JDK 17+** (compatible with JDK 17–24), **Node.js (v18+)**, **npm**, and **Python 3** (for `start.py`) are installed locally.
3. **Technical Requirements:**
   - Frontend JavaScript-only rule enforced (`jsconfig.json`, zero `.ts`/`.tsx` files under `src/`).
   - Backend Java textbook GoF OOP mandate enforced under `backend/src/main/java/com/haatbodol/patterns/`.
   - Local filesystem storage strategy for product images (`public/uploads/listings/`).
4. **Design Patterns:** Architectural mapping of all 8 GoF Java patterns (`Singleton`, `Strategy`, `Observer`, `Factory`, `Facade`, `Builder`, `Proxy`, `Decorator`).
5. **Expected Outcome:** Clear decoupled architecture baseline (`Next.js :3000` -> `Spring Boot :8080` -> `XAMPP MySQL :3306`) and active local services.
6. **Verification:** Confirm `java -version` (JDK 17–24), `node -v` (v18+), and MySQL responding on `127.0.0.1:3306`.

---

### Phase 2: Next.js Frontend & Java Spring Boot Backend Project Setup
1. **Phase Objective:** Initialize the JavaScript-only Next.js App Router frontend (`:3000`) and the Spring Boot 3.x Maven backend (`backend/`, `:8080`), wire `/api/*` proxying, and scaffold the exact folder hierarchy.
2. **Tasks:**
   - Initialize Next.js with `--js --tailwind --eslint --app --src-dir --no-typescript` and install frontend dependencies (`lucide-react`, `tailwindcss`).
   - Configure `next.config.mjs` with `images: { unoptimized: true }` and an async `rewrites()` rule proxying `/api/:path*` to `http://localhost:8080/api/:path*`.
   - Scaffold the Java Spring Boot 3.x Maven project inside `backend/` with Maven Wrapper (`./mvnw`, `./mvnw.cmd`, `.mvn/wrapper/`) and `pom.xml` targeting Java 17+ (compatible with JDK 17–24) including: `spring-boot-starter-web`, `mysql-connector-j`, `HikariCP`, `spring-security-crypto`, `jjwt` (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`), and `net.coobird:thumbnailator`.
   - Create all directories defined in Section 7 (`backend/src/main/java/com/haatbodol/{config,security,model,controller,service,patterns/*}`, `database/`, `public/uploads/defaults/`, `public/uploads/listings/`, `src/components/*`, `src/context/`).
   - Configure `jsconfig.json` (`@/*` -> `./src/*`), `.env.local`, `backend/src/main/resources/application.properties`, and the root launcher script `start.py`.
   - Populate crisp local category visuals inside `public/uploads/defaults/` so seeded listings render reliably offline.
3. **Technical Requirements:**
   - Verify `package.json` contains only frontend packages (`next`, `react`, `react-dom`, `lucide-react`, `tailwindcss`, `postcss`, `autoprefixer`) and zero TypeScript packages (`typescript`, `@types/*`).
   - Verify `cd backend && ./mvnw test-compile` compiles cleanly on the installed JDK (17–24).
4. **Design Patterns:** Package scaffolding created for all 8 GoF patterns under `backend/src/main/java/com/haatbodol/patterns/`.
5. **Expected Outcome:** Spring Boot backend compiles/runs via `cd backend && ./mvnw spring-boot:run` (`:8080`), Next.js UI runs via `npm run dev` (`:3000`), and `python3 start.py` orchestrates the stack cleanly.
6. **Verification:** Run `cd backend && ./mvnw test-compile`, boot the servers via `python3 start.py`, visit `http://localhost:3000`, and confirm zero `.ts` or `.tsx` files exist in `src/`.

---

### Phase 3: Database Design & XAMPP/MySQL Integration
1. **Phase Objective:** Create the `haatbodol_db` MySQL database in XAMPP, populate realistic seed data, and implement the textbook Java Singleton `DatabasePool` backed by HikariCP.
2. **Tasks:**
   - Write `database/schema.sql` containing all 13 normalized `CREATE TABLE` statements from Section 6.3.
   - Write `database/seed.sql` containing 1 admin, 4 realistic users (with BCrypt hashes for `Password123!`), 12 realistic second-hand listings across `Electronic Devices`, `Furniture`, and `Clothing`, image rows, Auto-Drop configurations, watchlist bookmarks, a sample negotiation, and a completed review.
   - Execute `database/schema.sql` and `database/seed.sql` into XAMPP MySQL (via MySQL CLI or phpMyAdmin).
   - Implement **Pattern 1A: `DatabasePool.java` (`backend/src/main/java/com/haatbodol/patterns/singleton/DatabasePool.java`)** with a true `private` constructor, `private static volatile DatabasePool instance`, thread-safe double-checked locking `getInstance()`, and an internal `HikariDataSource` (max pool size `10`) reading `.env.local` / environment variables.
   - Implement `HealthController.java` (`GET /api/health`) executing `SELECT COUNT(*) AS count FROM product_listings` via `DatabasePool.getInstance().getConnection()`.
3. **Technical Requirements:**
   - All JDBC SQL queries must use parameterized `PreparedStatement` placeholders (`?`) to prevent SQL injection.
   - `InnoDB` engine and proper `FOREIGN KEY` constraints (`ON DELETE CASCADE`) must be active on all 13 relational tables.
4. **Design Patterns:** **Singleton Pattern** (`DatabasePool.java`).
5. **Expected Outcome:** `haatbodol_db` visible in phpMyAdmin with all 13 tables and seeded rows, and both `http://localhost:8080/api/health` and proxied `http://localhost:3000/api/health` returning `{ "status": "connected", "listingsCount": 12 }`.
6. **Verification:** Inspect tables in phpMyAdmin, run `cd backend && ./mvnw spring-boot:run`, and curl `GET http://localhost:3000/api/health` to confirm end-to-end Next.js -> Spring Boot -> HikariCP Singleton -> XAMPP MySQL connectivity.

---

### Phase 4: UI Foundation, Shared Components & Website Layout
1. **Phase Objective:** Build the commercial e-commerce design system, Amazon-inspired two-tier navigation header (featuring the Bangla logo `হাতবদল`), footer, and reusable UI primitives in JavaScript React (`.jsx`).
2. **Tasks:**
   - Configure `src/app/globals.css` and `tailwind.config.js` with the commercial color palette (`#131921`, `#232F3E`, `#0F766E`, `#D97706`, `#F3F4F6`).
   - Build `src/components/layout/Navbar.jsx`:
     - Display the Bangla logo **`হাতবদল`** (and subtle English subtitle `HaatBodol`) as the **sole Bangla element** in the entire application.
     - Include the integrated category selector + keyword search bar, Notification Bell dropdown, Watchlist counter, Account & Role Switcher menu, Shopping Cart counter, and secondary category/action bar (`All Listings`, `Electronic Devices`, `Furniture`, `Clothing`, `Auto-Drop Deals`, `+ Sell an Item`).
   - Build `src/components/layout/Footer.jsx` with marketplace navigation links and public campus meetup safety tips in English.
   - Build reusable components: `Badge.jsx` (condition, status, and Campus Verified badges), `StarRating.jsx`, and `ProductCard.jsx`.
   - Build the Amazon-inspired Homepage (`src/app/page.jsx`) featuring a commercial hero banner, 3 category showcase cards, an **Auto-Drop Dutch Auction Deals** strip, and a **Recently Listed Items** grid fetched from the Java backend (`/api/listings`).
3. **Technical Requirements:**
   - Strict adherence to Section 3.1: zero Bangla text outside the brand logo.
   - Full mobile drawer/responsive adaptation for viewports down to `375px`.
4. **Design Patterns:** Prepare `ProductCard.jsx` to consume enriched `decorators` metadata produced by Java Pattern 8 (`Decorator`).
5. **Expected Outcome:** Cohesive, commercial-grade storefront layout rendering seeded listings from the Spring Boot API on the homepage.
6. **Verification:** Visually inspect desktop (`1440px`), tablet (`768px`), and mobile (`375px`) layouts; verify all labels are English except the `হাতবদল` logo.

---

### Phase 5: User Authentication, Role Switching & Campus Verification
1. **Phase Objective:** Implement secure registration, login, stateless JWT cookie authentication, `.edu` Campus Verification badges, and instant Buyer/Seller role switching in Java Spring Boot and React `AuthContext`.
2. **Tasks:**
   - Implement Java security utilities under `backend/src/main/java/com/haatbodol/security/`:
     - `PasswordService.java` using `BCryptPasswordEncoder` (`spring-security-crypto`).
     - `JwtService.java` using `jjwt` (HS256 stateless JWT signing & verification).
     - `AuthCookieHelper.java` setting and clearing the `HTTP-only` cookie `haatbodol_session`.
   - Implement `AuthController.java` & `AuthService.java`:
     - `POST /api/auth/register`: Validate inputs, hash password via `BCryptPasswordEncoder`, auto-detect `.edu` / `.edu.bd` institutional email to set `is_campus_verified = 1`, insert into `users`, and issue `haatbodol_session` cookie.
     - `POST /api/auth/login`: Verify email/password, check `account_status == "ACTIVE"` (block `SUSPENDED`/`BANNED`), and set `haatbodol_session` cookie.
     - `POST /api/auth/logout`: Clear `haatbodol_session` cookie.
     - `GET /api/auth/me`: Return current logged-in `UserDto` profile and unread notification count.
     - `PATCH /api/auth/role`: Toggle `active_role` between `'BUYER'` and `'SELLER'`.
   - Implement `src/context/AuthContext.jsx` and wrap the root layout.
   - Build `/login/page.jsx` and `/register/page.jsx` with clean form validation and error alerts.
3. **Technical Requirements:**
   - `password_hash` must never be serialized in any JSON response (`UserDto`).
   - Include demo quick-fill credentials on the login page (`tanvir@northsouth.edu` / `Password123!` and `admin@haatbodol.com` / `Password123!`).
4. **Design Patterns:** Provides `AuthenticatedUser` principal used by Pattern 7 (**Proxy Pattern**) authorization checks.
5. **Expected Outcome:** Users can register, log in via Java JWT cookies proxied through Next.js, receive a `Campus Verified` badge for `.edu` emails, and switch Buyer/Seller roles seamlessly in the header.
6. **Verification:** Register a new student account with `@uiu.ac.bd`, verify the row in phpMyAdmin `users` has `is_campus_verified = 1` and a valid BCrypt hash, log in, inspect the `haatbodol_session` HTTP-only cookie, and switch roles in the navbar.

---

### Phase 6: Core Listing Creation, Image Compression & Dynamic Depreciation Estimator
1. **Phase Objective:** Enable sellers to publish categorized listings with Java `Thumbnailator`-compressed images, receive real-time fair resale price suggestions via the textbook Java **Strategy Pattern**, and enrich listing responses via the textbook Java **Decorator Pattern**.
2. **Tasks:**
   - Implement **Pattern 2 (Strategy)** under `backend/src/main/java/com/haatbodol/patterns/strategy/`:
     - `DepreciationStrategy.java` (`interface`), `AbstractDepreciationStrategy.java` (`abstract class`), `ElectronicsDepreciationStrategy.java`, `FurnitureDepreciationStrategy.java`, `ClothingDepreciationStrategy.java`, and `DepreciationContext.java`.
   - Implement **Pattern 8 (Decorator)** under `backend/src/main/java/com/haatbodol/patterns/decorator/`:
     - `ListingPresentationComponent.java` (`interface`), `BaseListingComponent.java`, `ListingPresentationDecorator.java` (`abstract class`), `SavingsBadgeDecorator.java`, `AutoDropCountdownDecorator.java`, `CampusVerifiedDecorator.java`, and `ListingDecoratorPipeline.java`.
   - Implement `POST /api/listings/estimate-price` in `ListingController.java` invoking `DepreciationContext`.
   - Implement `ImageStorageService.java` using **`Thumbnailator`** to accept up to 5 uploaded images (`multipart/form-data`), validate MIME types (`image/jpeg`, `image/png`, `image/webp`), resize/compress (max width `1000px`, quality `0.80`), and save into `public/uploads/listings/`.
   - Implement `POST /api/listings` in `ListingController.java` / `ListingService.java` to validate inputs, enforce `min_reserve_price < current_asking_price` when `auto_drop_enabled = true`, and insert into `product_listings`, `listing_images`, and `auto_drop_configs`.
   - Build `/listings/new/page.jsx` and `DepreciationBox.jsx` so changing Category, Original Price, Age, or Condition immediately updates the recommended resale price range.
3. **Technical Requirements:**
   - Enforce maximum 5 images per listing and valid MIME types (`image/jpeg`, `image/png`, `image/webp`).
   - Automatically set `next_drop_at = DATE_ADD(NOW(), INTERVAL 7 DAY)` when Auto-Drop is toggled on.
4. **Design Patterns:** **Strategy Pattern** (`strategy/*`) and **Decorator Pattern** (`decorator/*`).
5. **Expected Outcome:** Sellers can create complete listings with `Thumbnailator`-compressed images, live depreciation estimates, optional Auto-Drop reserve prices, and decorated presentation badges on cards.
6. **Verification:** Run `cd backend && ./mvnw test-compile` and `python3 start.py`; create a listing under `Electronic Devices` with 2 uploaded images and Auto-Drop enabled; verify compressed files appear in `public/uploads/listings/`, rows appear in `product_listings`, `listing_images`, and `auto_drop_configs`, and `GET /api/listings` returns `decorators` badges.

---

### Phase 7: Discovery Search/Filter, Watchlist & Auto-Drop Dutch Auction Engine
1. **Phase Objective:** Implement full-featured marketplace browsing using the textbook Java **Builder Pattern**, Watchlist bookmarking, and the automated 7-day 5% Auto-Drop Dutch Auction engine using Java **Singleton**, **Observer**, and **Factory** patterns.
2. **Tasks:**
   - Implement **Pattern 6 (Builder)** under `backend/src/main/java/com/haatbodol/patterns/builder/`: `SqlQueryBuilder.java` (`interface`), `ListingQueryBuilder.java`, and `BuiltSqlQuery.java` for dynamic keyword, category, price range, condition, location, Auto-Drop, Campus Verified, sorting, and pagination queries.
   - Wire `GET /api/listings` in `ListingController.java` to `ListingQueryBuilder` + `ListingDecoratorPipeline`.
   - Build `/listings/page.jsx` and `FilterSidebar.jsx` with URL query-synced filters and sorting (`Newly Listed`, `Price: Low to High`, `Price: High to Low`, `Soonest Price Drop`).
   - Implement `WatchlistController.java` (`GET/POST/DELETE /api/watchlist`) and `/watchlist/page.jsx`.
   - Implement **Pattern 4 (Factory)** under `backend/src/main/java/com/haatbodol/patterns/factory/`: `MarketplaceNotification.java` & `NotificationFactory.java`.
   - Implement **Pattern 3 (Observer)** under `backend/src/main/java/com/haatbodol/patterns/observer/`: `MarketplaceSubject.java` (`interface`), `MarketplaceObserver.java` (`interface`), `MarketplaceEventSubject.java`, `InAppNotificationObserver.java`, and `EmailGatewayObserver.java`.
   - Implement **Pattern 1B (Singleton)** `AutoDropScheduler.java` (`backend/src/main/java/com/haatbodol/patterns/singleton/AutoDropScheduler.java`) with a `private` constructor, `AtomicBoolean` mutex lock, and Spring `@Scheduled` runner that finds `AVAILABLE` listings where `next_drop_at <= NOW()` and `is_halted = 0`, deducts 5%, clamps at `min_reserve_price` (halting further drops if reached), advances `next_drop_at` by 7 days, and notifies watchlisted users via `MarketplaceEventSubject`.
   - Implement `NotificationController.java` (`GET/PATCH /api/notifications`) and wire the Notification Bell dropdown in `Navbar.jsx`.
3. **Technical Requirements:**
   - Floor price protection must strictly guarantee `current_asking_price` never drops below `min_reserve_price`.
   - Ensure `AutoDropScheduler` never double-discounts the same cycle under concurrent triggers.
4. **Design Patterns:** **Builder Pattern** (`builder/*`), **Factory Pattern** (`factory/*`), **Observer Pattern** (`observer/*`), and **Singleton Pattern** (`AutoDropScheduler.java`).
5. **Expected Outcome:** Buyers can search/filter/sort listings, bookmark items to Watchlist, and receive automatic notifications when Auto-Drop reduces a watched item's price.
6. **Verification:** Bookmark the seeded listing whose `next_drop_at` is past due, trigger the Auto-Drop engine (`POST /api/admin/autodrop/run`), and confirm the price drops by 5% in MySQL and an unread notification appears in the buyer's header bell.

---

### Phase 8: Structured 3-Round Bargaining, Deal Lock, Direct Chat, Cart & Checkout
1. **Phase Objective:** Build the constrained 70%–85% Offer Slider, 3-round negotiation workflow, contact privacy masking via the textbook Java **Proxy Pattern**, atomic Deal Lock & Checkout via the Java **Facade Pattern**, and unlocked Direct Chat.
2. **Tasks:**
   - Implement **Pattern 7 (Proxy)** under `backend/src/main/java/com/haatbodol/patterns/proxy/`: `ListingAccessService.java` (`interface`), `RealListingAccessService.java`, and `ListingAccessProxy.java` to mask seller phone numbers and street addresses on `GET /api/listings/{id}` unless the requester is the seller, an admin, or the matched buyer of a `RESERVED`/`SOLD` deal, and to guard `PATCH/DELETE` mutations.
   - Build Product Detail Page (`/listings/[id]/page.jsx`) with image gallery, Decorator badges, masked seller card, Watchlist toggle, `Add to Cart` button, and `OfferSliderModal.jsx`.
   - Implement `OfferController.java` & `OfferService.java` enforcing the slider range strictly between `Math.ceil(askingPrice * 0.70)` and `Math.floor(askingPrice * 0.85)` on both UI and `POST /api/offers` (Round 1), plus `POST /api/offers/{sessionId}/counter` (Rounds 2 and 3; block any counter beyond Round 3) and `POST /api/offers/{sessionId}/reject`.
   - Implement **Pattern 5 (Facade)** `DealCheckoutFacade.java` (`backend/src/main/java/com/haatbodol/patterns/facade/DealCheckoutFacade.java`) with `acceptOfferAndLockDeal()` and `completeOrderCheckout()` coordinating atomic JDBC transactions across `product_listings`, `negotiation_sessions`, `offer_rounds`, `cart_items`, `transaction_orders`, `direct_chat_messages`, and `MarketplaceEventSubject`.
   - Wire `POST /api/offers/{sessionId}/accept` to `DealCheckoutFacade.acceptOfferAndLockDeal()` (sets listing `RESERVED`, rejects rival offers, adds agreed item to buyer's Cart, initializes Direct Chat with unmasked contact details, notifies both parties).
   - Build Cart (`/cart/page.jsx`, `CartController.java`), `CartContext.jsx`, Checkout (`/checkout/page.jsx`, `OrderController.java`), and Direct Chat (`/dashboard/messages/[sessionId]/page.jsx`, `ChatController.java`).
3. **Technical Requirements:**
   - Any attempt to POST an offer `< 70%` or `> 85%` of `current_asking_price` must return HTTP `400 Bad Request`.
   - Competing buyers on the same listing must automatically have their pending negotiations marked `REJECTED` inside the JDBC transaction once one offer is accepted.
4. **Design Patterns:** **Proxy Pattern** (`proxy/*`) and **Facade Pattern** (`DealCheckoutFacade.java`).
5. **Expected Outcome:** Complete end-to-end bargaining (up to 3 rounds), atomic deal locking, automatic privacy unmasking, Direct Chat messaging, and Cart/Checkout order creation.
6. **Verification:** Test submitting a 65% lowball via API (expect `400`), submit a valid 80% offer, counter in Round 2, accept in Round 2, verify competing offers lock out, verify seller phone number unmasks in Direct Chat, and complete checkout.

---

### Phase 9: User Dashboard, Mutual Reviews & Administrative Moderation Dashboard
1. **Phase Objective:** Complete the unified Buyer/Seller dashboard, post-handover `SOLD` confirmation, 1–5 star mutual review system, and the Admin Moderation Dashboard.
2. **Tasks:**
   - Build Unified User Dashboard (`/dashboard/page.jsx`) displaying role-contextual tabs:
     - **Buyer View:** Active Negotiations (with Round badges & Accept/Counter buttons), Unlocked Direct Chats, Purchased Orders (with `Confirm Handover & Rate Seller`), and Watchlist summary.
     - **Seller View:** My Listings (with quick status toggle `AVAILABLE`/`HIDDEN`/`SOLD`, Edit/Delete), Incoming Offers (Accept/Counter/Reject), Active Handover Chats, and Seller Rating summary.
   - Implement `PATCH /api/orders/{orderId}/complete` in `OrderController.java` (transitions listing to `SOLD` and order to `DELIVERED`/`PAID`).
   - Implement `POST /api/orders/{orderId}/review` in `OrderController.java` to submit 1–5 star ratings and recalculate `users.average_rating` and `users.total_reviews`.
   - Implement `POST /api/listings/{id}/report` in `ListingController.java` so users can flag suspicious/prohibited listings.
   - Build Admin Moderation Dashboard (`/admin/page.jsx` + `AdminController.java` `/api/admin/**` routes) protected by `account_type == "ADMIN"`:
     - Platform KPI cards.
     - Flagged Listings Queue (`Dismiss` or `Remove Listing`).
     - User Management Table (`Suspend`, `Ban`, `Activate`).
     - **Auto-Drop Dutch Auction Control Panel** with a **"Run Auto-Drop Cycle Now"** button (and optional **"Simulate +7 Days on Selected Listing"** test helper for live evaluation).
3. **Technical Requirements:**
   - Non-admin users navigating to `/admin` or calling `/api/admin/**` must be redirected or receive `403 Forbidden`.
   - Prevent duplicate reviews per user per order (`uq_review_order_reviewer`).
4. **Design Patterns:** Uses `ListingAccessProxy` (Admin/Owner checks), `NotificationFactory`, `MarketplaceEventSubject`, and `AutoDropScheduler`.
5. **Expected Outcome:** Fully functional User Dashboard, mutual star ratings updating user averages, and Admin Moderation Dashboard.
6. **Verification:** Mark an order as `SOLD`, submit mutual 5-star reviews from buyer and seller, verify `average_rating` updates in phpMyAdmin, report a listing, and remove it from the Admin Dashboard.

---

### Phase 10: Testing, Debugging, UI Refinement & Final Completion Audit
1. **Phase Objective:** Conduct comprehensive end-to-end verification across all features, all 8 textbook GoF Java design patterns, responsive breakpoints, and language rules.
2. **Tasks:**
   - Execute full regression testing across all 10 verification categories in Section 9.
   - Audit both frontend (`src/`) and backend (`backend/`) for:
     - Zero TypeScript files on frontend (`find src -name "*.ts*"` returns empty).
     - Strict separation of concerns (all REST controllers and GoF patterns live under `backend/`, and `src/` contains only frontend UI code).
     - Strict English-only text everywhere except the `হাতবদল` logo.
     - Zero console errors, unhandled exceptions, or broken image links.
     - Consistent button heights, card spacing, loading states, and user-friendly error messages.
   - Verify `database/schema.sql` and `database/seed.sql` execute cleanly on a fresh database import.
   - Verify full-stack startup via `python3 start.py` and standalone backend run via `cd backend && ./mvnw spring-boot:run`.
3. **Technical Requirements:** Clean `cd backend && ./mvnw test-compile` (or `./mvnw package -DskipTests`) in Java and clean `npm run build` in Next.js with zero build errors.
4. **Design Patterns:** Verify all 8 textbook GoF Java design patterns under `backend/src/main/java/com/haatbodol/patterns/` use formal Java `interface`s / `abstract class`es / concrete classes and are actively executed by live Spring Boot endpoints.
5. **Expected Outcome:** Production-quality, academically exemplary CSE 327 software engineering project ready for live demonstration and code review.
6. **Verification:** Complete every item in the Section 10 Final Completion Checklist.

---

## 9. Testing and Quality Assurance Requirements

The coding agent must test each module immediately after implementation rather than waiting until Phase 10, verifying both direct Java endpoints (`http://localhost:8080/api/*`) and Next.js proxied endpoints (`http://localhost:3000/api/*`):

1. **Database Connectivity (XAMPP MySQL + Java HikariCP Singleton):** Verify `DatabasePool.getInstance()` connects cleanly to `127.0.0.1:3306`, enforces its single `HikariDataSource` across concurrent requests without connection leaks, and enforces foreign keys across all 13 tables.
2. **Authentication & Authorization (`BCryptPasswordEncoder` + `jjwt`):** Test registration (both standard Gmail and `.edu` Campus Verified), login (`haatbodol_session` HTTP-only cookie), invalid password rejection, suspended user lockout, logout, and Buyer/Seller role switching.
3. **Dynamic Depreciation Estimator (Java Strategy Pattern):** Test all 3 concrete strategies (`ElectronicsDepreciationStrategy`, `FurnitureDepreciationStrategy`, `ClothingDepreciationStrategy`) via `DepreciationContext` across different ages and conditions to verify distinct formulas and floor protection.
4. **Image Upload & Compression (`Thumbnailator`):** Upload JPEG/PNG/WebP product photos via `POST /api/listings` and confirm resized, compressed files are persisted in `public/uploads/listings/` and served cleanly by Next.js.
5. **Product Browsing, Search, Filtering & Sorting (Java Builder + Decorator Patterns):** Test keyword search combined with category, min/max price, condition, location, `Auto-Drop Active`, `Campus Verified`, and all 4 sort modes via `ListingQueryBuilder` + `ListingDecoratorPipeline`.
6. **Auto-Drop Dutch Auction & Watchlist Alerts (Singleton + Observer + Factory):** Verify 5% price reduction calculation, strict `min_reserve_price` floor clamping, `is_halted` flag activation at reserve price, mutex protection in `AutoDropScheduler`, and automatic Watchlist notification delivery via `MarketplaceEventSubject` + `NotificationFactory`.
7. **Structured 3-Round Bargaining & Atomic Deal Lock (Java Facade Pattern):**
   - Verify slider rejects `< 70%` and `> 85%` offers with HTTP `400`.
   - Verify Round 1 (Buyer) -> Round 2 (Seller Counter) -> Round 3 (Buyer Final Counter) -> Round 3 limit enforcement.
   - Verify `DealCheckoutFacade` atomically reserves the item (`RESERVED`), rejects rival offers, adds to Cart, and opens Direct Chat inside a single JDBC transaction.
8. **Privacy Masking & Access Control (Java Protection Proxy):** Verify `ListingAccessProxy` masks seller phone numbers and street addresses from unauthenticated users and non-matched buyers, unmasks them only for matched deal participants and Admins, and blocks unauthorized listing edits/deletes with `403 Forbidden`.
9. **Shopping Cart, Checkout, Mutual Reviews & Admin Moderation:** Test adding items to Cart, completing Checkout with invoice generation, marking items `SOLD`, submitting mutual 1–5 star ratings, reporting a listing as a buyer, dismissing/removing the listing as an Admin, and suspending/reactivating a user account.
10. **Responsive UI, Full-Stack Startup & Language Compliance:** Verify `python3 start.py` launches the full stack cleanly; inspect all pages at `1440px`, `768px`, and `375px`, confirming clean layout adaptation and verifying no Bangla text appears anywhere except the `হাতবদল` logo.

---

## 10. Final Completion Checklist

Before concluding the implementation, verify every item below is checked and satisfied:

- [ ] **Frontend JavaScript Only:** 100% of frontend files in `src/` use `.js` and `.jsx` extensions, with zero TypeScript files anywhere in the frontend.
- [ ] **Java Spring Boot Backend (`backend/`):** Spring Boot 3.x + Maven Wrapper (`./mvnw`) compiles cleanly on JDK 17–24, runs on `http://localhost:8080`, proxies seamlessly via `next.config.mjs` from `http://localhost:3000/api/*`, and uses `HikariCP`, `BCryptPasswordEncoder`, `jjwt` (`haatbodol_session`), and `Thumbnailator`.
- [ ] **Local XAMPP MySQL:** Application connects reliably to local MySQL (`haatbodol_db`, 13 tables) with `database/schema.sql` and `database/seed.sql` ready for phpMyAdmin.
- [ ] **Language Policy:** All UI text, forms, categories, alerts, and admin pages are strictly in English; the Bangla brand name **`হাতবদল`** appears exclusively in the website logo.
- [ ] **Commercial E-Commerce UI/UX:** Amazon-inspired two-tier header, faceted search/filter sidebar, clean product cards, responsive grids, and cohesive color palette are implemented across all pages.
- [ ] **All 8 Textbook GoF Java Design Patterns Active in `backend/src/main/java/com/haatbodol/patterns/`:**
  - [ ] **Singleton Pattern:** `singleton/DatabasePool.java` (private constructor + DCL HikariCP) & `singleton/AutoDropScheduler.java` (private constructor + `@Scheduled` / mutex lock)
  - [ ] **Strategy Pattern:** `strategy/DepreciationStrategy.java` (`interface`), `AbstractDepreciationStrategy.java`, `ElectronicsDepreciationStrategy.java`, `FurnitureDepreciationStrategy.java`, `ClothingDepreciationStrategy.java`, `DepreciationContext.java`
  - [ ] **Observer Pattern:** `observer/MarketplaceSubject.java` (`interface`), `MarketplaceObserver.java` (`interface`), `MarketplaceEventSubject.java`, `InAppNotificationObserver.java`, `EmailGatewayObserver.java`
  - [ ] **Factory Pattern:** `factory/NotificationFactory.java` & `MarketplaceNotification` product hierarchy
  - [ ] **Facade Pattern:** `facade/DealCheckoutFacade.java` (atomic JDBC transaction coordinator)
  - [ ] **Builder Pattern:** `builder/ListingQueryBuilder.java`, `SqlQueryBuilder.java`, & `BuiltSqlQuery.java`
  - [ ] **Proxy Pattern:** `proxy/ListingAccessService.java` (`interface`), `RealListingAccessService.java`, `ListingAccessProxy.java`
  - [ ] **Decorator Pattern:** `decorator/ListingPresentationComponent.java` (`interface`), `BaseListingComponent.java`, `ListingPresentationDecorator.java` (`abstract class`), `SavingsBadgeDecorator.java`, `AutoDropCountdownDecorator.java`, `CampusVerifiedDecorator.java`, `ListingDecoratorPipeline.java`
- [ ] **Core HaatBodol Innovations Functional:** Dynamic Depreciation Estimator, 70%–85% 3-Round Offer Slider, 7-Day 5% Auto-Drop Dutch Auction with Floor Protection, Watchlist Alerts, Privacy-Masked Contact Unmasking, Direct Chat, Cart/Checkout, Mutual Reviews, and Admin Moderation Dashboard all work end-to-end.
- [ ] **Clean Builds & Full-Stack Startup:** `cd backend && ./mvnw test-compile`, `cd backend && ./mvnw spring-boot:run`, `npm run build`, and `python3 start.py` all execute with zero errors.