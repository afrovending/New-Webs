# AfroVending Marketplace - Product Requirements Document

## Original Problem Statement
Build a full-featured African marketplace platform (AfroVending) connecting vendors selling African products and services with customers worldwide.

## What's Been Implemented (Feb 2025)

### Core Features
- **User Authentication**: JWT-based auth with roles (admin, vendor, customer)
- **Product Catalog**: Full CRUD with categories, images, pricing, stock management
- **Service Catalog**: Separate catalog for services with duration, location type
- **Vendor System**: Registration, approval workflow, store profiles, verified badges
- **Shopping Cart & Checkout**: Stripe payment integration (LIVE)
- **Admin Panel**: User management, vendor approvals, content moderation
- **Admin Analytics Dashboard**: Comprehensive platform stats with growth indicators
- **Vendor Deactivation**: Admin can deactivate/reactivate vendors for non-compliance

### NEW Features (Feb 18, 2026)
- **Multi-Currency Support**: 11 currencies with LIVE exchange rates from exchangerate-api.com
  - Auto-detect currency by visitor IP
  - Currency selector in header
  - Prices display in selected currency (vendors set prices in USD)
  - Real-time rates cached hourly
- **Customer Reviews & Ratings**:
  - Star ratings (1-5) with review comments
  - Optional review title and images
  - "Would recommend" toggle
  - Mark reviews as helpful
  - Rating distribution display
  - Purchase verification required
- **Advanced Search Filters**:
  - Text search across name/description
  - Category and vendor filters
  - Price range filter (with currency conversion)
  - Minimum rating filter
  - Verified vendor filter
  - Sort by: relevance, price, rating, newest
- **Email Notifications (SendGrid)**:
  - Order confirmation emails
  - Shipping notification with tracking
  - Booking confirmation
  - Vendor deactivation with reason & appeal info
  - Vendor reactivation notification
  - Password reset emails
  - Vendor approval notification
  - **Price Drop Alert emails** (NEW - sends when product price drops below target)
- **Wishlist Functionality**:
  - Add/remove products from wishlist
  - Wishlist page with product cards
  - Move to cart functionality
  - Wishlist button on product cards
  - Wishlist icon in header
- **Order History with Timeline**:
  - Order history page with filtering
  - Visual status timeline (pending → confirmed → processing → shipped → delivered)
  - Order detail page with tracking number
  - Support for cancelled/refunded states
- **Price Alerts** (NEW):
  - Set target price alerts on products
  - Quick discount buttons (-10%, -20%, -30%)
  - Email and in-app notification preferences
  - View and manage all price alerts
- **PDF Invoice Download** (NEW):
  - Download professional PDF invoices for orders
  - Branded invoice design with AfroVending branding
  - Includes order details, items, shipping address
- **Reorder Items** (NEW):
  - One-click reorder from order history
  - Adds all items from previous order to cart
- **Fulfillment Options** (NEW):
  - FBV (Fulfilled by Vendor) - vendor ships directly
  - FBA (Fulfilled by AfroVending) - ship to US warehouse
  - Fulfillment badges on product cards
- **Social Proof Components** (NEW):
  - "Recently Sold" live ticker on homepage
  - Shows products sold with country and time
  - Vendor Success Stories section
  - Displays top vendors with sales stats

### UI/UX Features
- Red-themed brand identity with custom logo
- Dynamic navigation dropdowns for Products, Services, Countries
- "Shop-by-Country" filtering
- Trust Bar with security/shipping reassurances
- Vendor Spotlight section on homepage
- SEO-optimized category landing pages
- Related products & cross-sell sections on product pages
- Responsive design with shadcn/ui components
- Password visibility toggle on login/register
- Forgot password flow

## Technical Architecture
- **Backend**: FastAPI, Python 3.9, MongoDB (Motor async driver)
- **Frontend**: React.js 18.2.0, Tailwind CSS, shadcn/ui
- **Payments**: Stripe SDK (live integration)
- **Email**: SendGrid
- **Currency**: exchangerate-api.com (live rates)
- **Deployment**: DigitalOcean App Platform
- **API Prefix**: All routes under `/api` prefix

## Current Status (Updated Feb 19, 2026)

### Bug Fixes (Feb 19, 2026 - Latest)
- **P0 FIXED: "Product not found" error** - Root cause was frontend calling `GET /api/reviews?product_id=xxx` but backend only had `GET /api/reviews/product/{product_id}`. Fixed by adding query parameter endpoint in reviews.py.
- **VAPID Keys Moved to Environment Variables** - Push notification keys now properly read from backend/.env and frontend/.env instead of being hardcoded.

### Completed
- All E2E tests passed (26+ backend, 95%+ frontend)
- Multi-currency with LIVE exchange rates
- Wishlist functionality with move-to-cart
- Order history with visual status timeline
- Customer reviews & ratings system
- Advanced search with filters
- Email notifications via SendGrid
- Stripe LIVE subscription integration
- Production database seeding script
- Full Admin Analytics Dashboard
- Vendor Management with deactivation controls
- **Backend Modularization** - Migrated from monolithic to modular architecture
- **Database Seeding API** - `/api/admin/seed-database` endpoint for production
- **Forgot Password Email** - Now sends secure reset link via SendGrid
- **Currency Symbol Refresh** - Fixed with version counter for immediate updates
- **Legacy server.py Deleted** - Codebase cleaned up
- **Vendor Dashboard Redesign** - New Store Settings page and enhanced Products page (Feb 19, 2026)
  - Store Settings page for vendor profile management (store name, description, story, branding)
  - Enhanced Add Product form with category selector and fulfillment options (FBV/FBA)
  - Fixed `/api/vendor/products` routing issue
- **Recently Sold Fix** - Now shows product images instead of "No Image" (Feb 19, 2026)
  - Fixed field name mismatch in RecentlySold.jsx (product_image vs image)
- **Vendor Onboarding System** - Complete vendor verification flow (Feb 19, 2026)
  - **Stripe Connect** - Bank account linking for payouts
  - **Stripe Identity** - Government ID verification with selfie matching
  - **Tax Information** - US (SSN/EIN) and International (VAT) support
  - Store Settings with 4 tabs (Profile, Payment, Identity, Tax)
  - Onboarding Wizard at `/vendor/onboarding` with 6-step flow
- **Automatic Payout Scheduling** - Vendor earnings management (Feb 19, 2026)
  - Configurable auto-payouts (weekly/bi-weekly/monthly)
  - Threshold-based payouts (minimum $10, default $50)
  - Manual payout requests
  - Earnings summary dashboard
  - Payout history tracking
  - **APScheduler cron job** - Runs daily at 9 AM UTC to process payouts
  - **Email notifications** - Payout initiated, completed, failed, auto-enabled
  - **Stripe webhooks** - Handles payout.paid, payout.failed, account.updated events
- **Legal & Policy Pages** - Complete legal framework (Feb 19, 2026)
  - Terms of Service
  - Vendor Agreement Framework
  - Buyer Protection Policy
  - Privacy Policy & Data Responsibility
  - Liability Limitations
  - Marketplace Enforcement Rights (includes chargeback defense)
  - Footer updated with legal links
- **Cookie Consent Banner** - GDPR/CCPA compliance (Feb 19, 2026)
  - Accept All / Reject All / Preferences buttons
  - Granular cookie preferences (Analytics, Marketing, Personalization)
  - localStorage persistence with timestamp
  - Link to Privacy Policy
- **Additional Legal Pages** - Based on user-provided policy documents (Feb 19, 2026)
  - Risk Shield System - Fraud prevention and dispute resolution framework
  - Chargeback Defense Policy - Payment dispute handling procedures
  - Elite Return Policy - Comprehensive return and refund guidelines
  - Legal Hub page updated with all 9 policy cards
  - Footer reorganized with "Legal" and "Policies" columns
- **Admin Broken Images Tool** - Product image health checker (Feb 19, 2026)
  - `/api/admin/products/broken-images` endpoint identifies products with missing/broken images
  - Distinguishes Cloudinary-hosted vs local/ephemeral storage images
  - Shows affected vendor info (store name, email)
  - Integrated into Admin Dashboard "Action Required" section
- **Vendor Spotlight Enhancement** - Updated seed script and API (Feb 19, 2026)
  - Added 4 demo vendors with compelling stories in seed_production.py
  - Updated `/api/homepage/vendor-success` to use vendor's custom story when available
  - Fallback to generic testimonials for vendors without stories
- **Vendor Email Notifications** - Notify vendors about broken images (Feb 19, 2026)
  - `/api/admin/products/notify-broken-images` endpoint sends email to affected vendors
  - Professional email template with instructions for re-uploading images
  - "Email Affected Vendors" button in Admin Dashboard
- **Progressive Web App (PWA) Support** - Installable web app (Feb 19, 2026)
  - Service worker with caching strategies (cache-first, network-first, stale-while-revalidate)
  - Web app manifest with icons, shortcuts, and app metadata
  - PWA install prompt for Android, iOS, and desktop
  - Offline support for static assets
  - Background sync support for cart and wishlist
- **Push Notifications System** - Real-time user notifications (Feb 19, 2026)
  - Push subscription management (`/api/notifications/subscribe`, `/api/notifications/unsubscribe`)
  - User notification preferences on Profile page
  - Order update notifications
  - Price drop alerts for wishlist items
  - Notification preferences (order updates, promotions, price alerts, new products, vendor messages)

### Pending Deployment
- User needs to **Save to GitHub** and **Redeploy on DigitalOcean**
- After deployment, call `/api/admin/seed-database` to populate production database

## API Endpoints

### Database Seeding (NEW - Admin Only)
- `POST /api/admin/seed-database` - Populate database with essential data (admin-only, JWT required)
  - Seeds: Categories, Countries, Admin account, Demo Vendor with Products/Services
  - Returns: Created counts, skipped items, and credentials

### Currency (Live Rates)
- `GET /api/currency/live-rates` - Get live exchange rates (cached hourly)
- `GET /api/currency/convert-live?amount=X&from_currency=USD&to_currency=NGN` - Live conversion

### Wishlist
- `GET /api/wishlist` - Get user's wishlist with product details
- `POST /api/wishlist/add` - Add product to wishlist
- `DELETE /api/wishlist/remove/{item_id}` - Remove from wishlist
- `DELETE /api/wishlist/remove-product/{product_id}` - Remove by product ID
- `GET /api/wishlist/check/{product_id}` - Check if in wishlist
- `POST /api/wishlist/move-to-cart/{item_id}` - Move to cart

### Order History
- `GET /api/orders/history?status=&page=&limit=` - Get order history
- `GET /api/orders/{order_id}/timeline` - Get order status timeline
- `GET /api/orders/{order_id}/detail` - Get detailed order info
- `PUT /api/orders/{order_id}/update-status` - Update with history tracking
- `GET /api/orders/{order_id}/invoice` - Download PDF invoice (NEW)
- `POST /api/orders/{order_id}/reorder` - Reorder all items (NEW)

### Price Alerts (NEW)
- `POST /api/price-alerts/create` - Create price alert
- `GET /api/price-alerts` - Get user's price alerts
- `DELETE /api/price-alerts/{alert_id}` - Delete price alert

### Social Proof (NEW)
- `GET /api/homepage/recently-sold` - Get recently sold items
- `GET /api/homepage/vendor-success` - Get vendor success stories

### Stripe Connect - Vendor Onboarding (NEW)
- `POST /api/stripe-connect/create-account` - Create Stripe Express account for vendor
- `POST /api/stripe-connect/onboarding-link` - Get Stripe hosted onboarding URL
- `GET /api/stripe-connect/account-status` - Get Stripe account and payout status
- `POST /api/stripe-connect/identity-verification` - Start Stripe Identity verification
- `GET /api/stripe-connect/identity-status` - Get identity verification status
- `PUT /api/stripe-connect/tax-information` - Update vendor tax info (SSN, EIN, VAT)
- `GET /api/stripe-connect/onboarding-status` - Get overall onboarding completion (6 steps)
- `GET /api/stripe-connect/payout-balance` - Get vendor's payout balance
- `GET /api/stripe-connect/payout-settings` - Get auto-payout settings
- `PUT /api/stripe-connect/payout-settings` - Update auto-payout threshold, frequency
- `POST /api/stripe-connect/request-payout` - Request manual payout
- `GET /api/stripe-connect/payout-history` - Get payout history with pagination
- `GET /api/stripe-connect/earnings-summary` - Get comprehensive earnings overview

### Stripe Webhooks (NEW)
- `POST /api/webhooks/stripe` - Handle Stripe webhook events (payout.paid, payout.failed, account.updated)

### Admin Scheduler (NEW)
- `GET /api/admin/scheduler/status` - Get scheduler status and next run times
- `POST /api/admin/scheduler/trigger-payouts` - Manually trigger payout processing
- `GET /api/admin/scheduler/logs` - Get scheduler job execution logs

### Reviews
- `POST /api/reviews/create` - Create review (requires purchase)
- `GET /api/reviews/product/{product_id}` - Get product reviews
- `GET /api/reviews/service/{service_id}` - Get service reviews
- `GET /api/reviews/vendor/{vendor_id}` - Get all vendor reviews
- `POST /api/reviews/{review_id}/helpful` - Mark review helpful

### Search
- `POST /api/search/products` - Advanced product search
- `POST /api/search/services` - Advanced service search

## Order Status Flow
1. **Pending** - Order received
2. **Confirmed** - Vendor confirmed
3. **Processing** - Being prepared
4. **Shipped** - On the way (with tracking)
5. **Out for Delivery** - Arriving today
6. **Delivered** - Complete
- Also: Cancelled, Refunded

## Supported Currencies (Live Rates)
| Code | Symbol | Name |
|------|--------|------|
| USD | $ | US Dollar |
| EUR | € | Euro |
| GBP | £ | British Pound |
| NGN | ₦ | Nigerian Naira |
| KES | KSh | Kenyan Shilling |
| ZAR | R | South African Rand |
| GHS | ₵ | Ghanaian Cedi |
| EGP | E£ | Egyptian Pound |
| MAD | MAD | Moroccan Dirham |
| XOF | CFA | West African CFA |
| XAF | FCFA | Central African CFA |

## Prioritized Backlog

### P0 (Critical)
- [x] Multi-currency with live rates - DONE
- [x] Wishlist functionality - DONE
- [x] Order history with timeline - DONE
- [x] Customer reviews & ratings - DONE
- [x] Advanced search filters - DONE
- [x] Email notifications - DONE
- [x] Price Alerts feature - DONE
- [x] PDF Invoice download - DONE
- [x] Reorder items from history - DONE
- [x] Fulfillment options (FBA/FBV) - DONE
- [x] Social proof (Recently Sold, Vendor Success) - DONE
- [x] African product images - DONE
- [x] Price Drop Alert email notification - DONE
- [x] Backend Modularization - DONE
- [x] **Database Seeding API Endpoint** - DONE (Feb 19, 2026)
  - Secure `/api/admin/seed-database` endpoint for populating production database
  - Admin-only access with proper JWT authentication
  - Seeds: Categories, Countries, Admin account, Demo Vendor with Products/Services
- [ ] **User action**: Save to GitHub and Redeploy on DigitalOcean, then call seed endpoint

### P1 (High Priority) - REFACTORING COMPLETE ✅
- [x] Created `/app/backend/models.py` - All Pydantic models (225 lines)
- [x] Created `/app/backend/database.py` - DB connection (39 lines)
- [x] Created `/app/backend/auth.py` - JWT utilities (71 lines)
- [x] Created 14 route modules in `/app/backend/routes/`:
  - `auth.py` (227 lines) - Authentication endpoints
  - `products.py` (155 lines) - Product CRUD
  - `vendors.py` (108 lines) - Vendor management
  - `services.py` (146 lines) - Service CRUD
  - `categories.py` (79 lines) - Categories & Countries
  - `bookings.py` (137 lines) - Booking management
  - `orders.py` (248 lines) - Cart & Orders
  - `reviews.py` (128 lines) - Review system
  - `wishlist.py` (131 lines) - Wishlist functionality
  - `price_alerts.py` (163 lines) - Price alerts
  - `notifications.py` (58 lines) - Notifications
  - `homepage.py` (97 lines) - Homepage data
  - `admin.py` (183 lines) - Admin endpoints
- [x] Created `/app/backend/server_modular.py` - New modular entry point (117 lines)
- [x] **MIGRATION COMPLETE** - Supervisor now running `server_modular:app`
- [x] Old `server.py` (4252 lines) preserved as backup

### P2 (Medium Priority)
- [ ] Progressive Web App (PWA) support
- [ ] Push notifications
- [ ] Vendor analytics improvements

### P3 (Nice to Have)
- [ ] Native mobile app
- [ ] Chat between buyer and vendor

## Test Credentials
- **Admin**: admin@afrovending.com / AfroAdmin2024!
- **Vendor**: vendor@afrovending.com / AfroVendor2024!

## Key Files
- `/app/backend/server_modular.py` - Main modular entry point (active)
- `/app/backend/models.py` - All Pydantic models
- `/app/backend/database.py` - MongoDB connection
- `/app/backend/auth.py` - JWT authentication utilities
- `/app/backend/routes/` - 15 modular route files including vendor_router
- `/app/backend/routes/products.py` - Products + vendor_router for /vendor/products
- `/app/backend/email_service.py` - SendGrid email templates
- `/app/backend/invoice_service.py` - PDF invoice generation
- `/app/frontend/src/contexts/CurrencyContext.js` - Live currency provider
- `/app/frontend/src/pages/WishlistPage.jsx` - Wishlist UI
- `/app/frontend/src/pages/OrderHistoryPage.jsx` - Order History, Invoice & Reorder
- `/app/frontend/src/pages/vendor/VendorProducts.jsx` - Product form with fulfillment options
- `/app/frontend/src/pages/vendor/VendorStoreSettings.jsx` - Store Settings page (NEW)
- `/app/frontend/src/components/RecentlySold.jsx` - Fixed to use product_image field
- `/app/frontend/src/components/Reviews.jsx` - Review components
- `/app/frontend/src/components/WishlistButton.jsx` - Heart button
- `/app/frontend/src/components/PriceAlertButton.jsx` - Price alert dialog
- `/app/frontend/src/components/RecentlySold.jsx` - Social proof ticker
- `/app/frontend/src/components/VendorSuccess.jsx` - Vendor success stories
- `/app/frontend/src/components/CookieConsentBanner.jsx` - GDPR/CCPA cookie consent (NEW)
- `/app/frontend/src/pages/legal/RiskShieldPage.jsx` - Risk Shield System policy (NEW)
- `/app/frontend/src/pages/legal/ChargebackDefensePage.jsx` - Chargeback Defense policy (NEW)
- `/app/frontend/src/pages/legal/EliteReturnPolicyPage.jsx` - Elite Return Policy (NEW)
- `/app/frontend/src/pages/legal/LegalPages.jsx` - Legal hub with all 9 policies (UPDATED)
