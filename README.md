# BLOOMS BY JEN

**Project Title:** Blooms by Jen: A Web-Based Handmade Flower Shop Management System with Order Tracking and Bouquet Customization

## Description

A **frontend-only** floral management system for Blooms by Jen, a handmade flower shop. Customers browse the catalog, design their own bouquet, check out with GCash or Cash on Delivery, and follow their order through a four-stage tracker. The owner manages inventory, orders, sales, and reports from a role-protected admin area.

There is **no backend and no database** — all data lives in the browser through Local Storage (persistent) and Session Storage (per-tab login).

## Features

### Customer

- **Product catalog** of handmade flowers with live stock checks
- **Bouquet Customizer** — wrapping color, ribbon color, and a personalized message (free)
- **Cart** with quantity limits based on available stock
- **Distance-based delivery fee**, auto-detected from the delivery address
- **Checkout** with contact number, address, and GCash number auto-filled from the saved profile
- **Payments** — GCash (GCash number + auto-generated reference) or COD
- **Order tracking in 4 stages:** To Pay → To Ship → To Receive → To Review
- **Reviews** — star rating and comment on completed orders
- **Profile** — saved addresses with Philippine province/city autocomplete
- **Notification bell** for order updates and status changes

### Owner (admin)

- **Dashboard metrics** — total orders, in progress, unpaid orders, today's sales, stock varieties
- **Inventory** — Add/Edit Product, delete, stock badges, and **low-stock alerts** (below 10 units)
- **Order management** — update status (Pending → Processing → Shipped → Completed), adjust quantities, delete (which restores stock)
- **Sales history** recorded automatically from every order, with per-row edit
- **Reports & analytics** with CSV export
- **Notification bell** for new customer orders and low-stock items

### System

- Role-based access control (admin screens vs. customer-only screens)
- Click any notification to jump straight to the related order
- Cross-tab data sync (open the app in two tabs and data stays in step)
- Unique record IDs (`ORD` / `SAL` / `INV`) even after deletions
- Fast navigation — locally served Vue, deferred scripts, click-time loading bar, and idle prefetching
- `Escape` closes modals and dropdowns
- Mobile-responsive glassmorphism UI

## Technologies Used

- **HTML5, CSS3, Vanilla JavaScript** — no build step, no bundler, no `npm install`
- **Vue.js 3.5.43** — production build served locally from `JS/vue.global.prod.js`, loaded with `defer`
- Custom Glassmorphism CSS theme with a responsive layout
- Google Fonts (Playfair Display, Plus Jakarta Sans)
- Font Awesome 6.4 icons
- Browser storage for persistence (Local Storage + Session Storage)

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Owner / Admin | `jenelyn.ortiz@bloomsbyjen.com` | `password123` |
| Customer | Register your own account on the **Register** page | — |

The owner account is seeded automatically on first load, so no setup is needed. Registration always creates a customer account. To try both roles at once, use a second browser or a private window.

## Live Demo

- Deployed Live Link: https://blooms-by-jen.infinityfree.me/
- Deployment Platform: InfinityFree
- Repository: https://github.com/Dreicode/BLOOMS-BY-JEN

## Setup and Installation

### Option A: Run Locally (Recommended)

1. Download or clone this repository.
2. Open the project folder.
3. Open `index.html` in your browser. Vue is bundled with the project, so the app logic works without an internet connection.

Google Fonts and Font Awesome are loaded from a CDN, so those fonts/icons need internet (the layout still works without them). Running a local server — e.g. VS Code **Live Server** or `python -m http.server` — is still recommended so it matches the deployed environment.

### Option B: Deploy to a Hosting Platform

1. Upload all files **keeping the folder structure**:
   - `index.html` (root), `favicon.svg`
   - `CSS/`, `JS/`, `Pages/`, `Flower_images/`, `Bouquet_assets/`
2. No build step, no dependencies, no database configuration.
3. Open the deployed link in a browser.

## How Ordering Works

1. **Shop** — add products to the cart
2. **Customize** *(optional)* — design a bouquet
3. **Checkout** — the delivery address determines the fee zone
4. **Payment** — GCash (number + reference) or COD
5. **My Orders** — live stage tracker and notifications
6. **Owner updates the status** in Orders — the customer is notified automatically and can review the order once it is completed

### Delivery fee zones (ships from Baliwag, Bulacan)

| Zone | Fee |
|---|---|
| Bulacan / NCR | ₱160 |
| Rest of Luzon | ₱230 |
| Visayas | ₱345 |
| Mindanao | ₱415 |

The fee is added to the order total, but it is **excluded from sales records** — sales track product revenue only.

### Order stages

| Stage | Meaning |
|---|---|
| To Pay | Order placed, payment not yet confirmed (e.g. COD) |
| To Ship | Payment confirmed, bouquet being prepared |
| To Receive | Order shipped |
| To Review | Order completed — the customer can leave a rating |

## Project Structure

```
BLOOMS-BY-JEN/
├── index.html              (redirects to Pages/landingpage.html)
├── favicon.svg             (flower favicon)
├── CSS/
│   └── style.css           (global theme + components)
├── JS/
│   ├── vue.global.prod.js  (Vue 3 build, served locally)
│   ├── app.js              (all application logic + routing)
│   └── ph-locations.js     (PH provinces/cities for address autocomplete)
├── Flower_images/          (product photos)
├── Bouquet_assets/         (customizer assets)
└── Pages/
    ├── landingpage.html    (public marketing page)
    ├── login.html
    ├── register.html
    ├── shop.html
    ├── customize.html
    ├── cart.html
    ├── checkout.html
    ├── payment.html
    ├── myorders.html
    ├── profile.html
    ├── dashboard.html      (admin)
    ├── inventory.html      (admin)
    ├── order.html          (admin)
    ├── sales.html          (admin)
    └── report.html         (admin)
```

## Data & Storage Notes

- All data is stored in the browser — there is no server and no database.
- Main storage keys: `blooms_orders`, `blooms_inventory`, `blooms_sales`, `blooms_cart`, `blooms_notifications`, `blooms_users`.
- Login state is per tab (Session Storage); catalog data is shared across tabs and kept in Local Storage.
- Clearing browser data resets the system to its seeded demo state.

## Team Apex Coder 2.0

**Project Manager / Leader:** Punzalan, Ronald Andrei G.

| Members | Role |
|---|---|
| Calim, Lovely Rose | Team Member |
| Canoza, Ryan James | Team Member |
| Cantoba, Johncyril | Team Member |
| Leo, Benjo | Team Member |
| Ortiz, Rodel | Team Member |
