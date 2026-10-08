# BLOOMS BY JEN

**Project Title:** Blooms by Jen: A Web-Based Handmade Flower Shop Management System with Order Tracking and Bouquet Customization

## Description

A frontend prototype floral management system for Blooms by Jen, a handmade flower shop. The system digitalizes order management with custom bouquet tracking, real-time inventory monitoring with low-stock alerts, sales recording, and business reports.

## Features

- Order Management with custom bouquet tracking (wrapping, ribbon, and personalized message)
- Real-time Inventory Monitoring with low-stock and out-of-stock alerts
- Sales Recording with GCash and Cash payment methods
- Reports & Analytics with CSV export
- Owner login / user authentication
- Mobile-responsive design

## Technologies Used

- HTML5, CSS3, JavaScript (Vanilla JS)
- Vue.js 3 (bundled locally at `JS/vue.global.prod.js`, no CDN dependency)
- Bootstrap-like utility styling / custom Glassmorphism theme
- Google Fonts (Playfair Display, Plus Jakarta Sans)
- Font Awesome 6 Icons (self-hosted in `CSS/fontawesome/`)


## Live Demo

- Deployed Live Link: https://blooms-by-jen.infinityfree.me/
- Deployment Platform: InfinityFree
- Repository: https://github.com/Dreicode/BLOOMS-BY-JEN

## Setup and Installation

### Option A: Run Locally (Recommended)

1. Download or clone this repository.
2. Open the project folder.
3. Open `index.html` in your browser, OR use a local server (e.g., Live Server extension in VS Code) — a local server is recommended so browser storage behaves the same way it does when hosted.

### Option B: Deploy to a Hosting Platform

1. Upload all project files keeping the folder structure:
   - `index.html` (root)
   - `CSS/`, `JS/`, `Pages/`
2. Open the deployed live link in a browser.

## Owner Access & Data

The app has **no backend** — all data is stored in your browser's
`localStorage`, and no password is stored anywhere in the source code.

- **The first account you register becomes the shop owner (admin).**
  Every account registered after that is a customer.
- To start over, clear the site's data (or open it in a fresh browser).
- Because there is no shared database, do **not** enter real customer
  or payment details — treat all data as demo data.

## Project Structure


BLOOMS-BY-JEN/
├── index.html            (redirects to Pages/landingpage.html)
├── CSS/style.css        (global styles)
├── JS/app.js            (all Vue 3 application logic)
└── Pages/               (all major screens)
    ├── landingpage.html
    ├── login.html
    ├── dashboard.html
    ├── order.html
    ├── inventory.html
    ├── sales.html
    └── report.html


## Team Apex Coder 2.0

**Project Manager / Leader:** Punzalan, Ronald Andrei G.

| Members | Role |
|---|---|
| Calim, Lovely Rose | Team Member |
| Canoza, Ryan James | Team Member |
| Cantoba, Johncyril | Team Member |
| Leo, Benjo | Team Member |
| Ortiz, Rodel | Team Member |