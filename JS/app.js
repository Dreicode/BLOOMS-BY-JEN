/* ==========================================================================
   Blooms by Jen - Vue 3 Multi-Page System
   ========================================================================== */

const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

const getCurrentDir = () => {
    const path = window.location.pathname;
    const lastSlash = path.lastIndexOf('/');
    return lastSlash > 0 ? path.substring(0, lastSlash + 1) : '/';
};

// Calendar date in the visitor's own timezone. toISOString() is UTC, so
// between 00:00 and 08:00 PHT it yields the PREVIOUS day — which made
// "Today's Sales" read ₱0 and shifted order dates / delivery estimates.
const todayLocal = () => {
    const d = new Date();
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
};

// Owner account (demo)
// ----------
// There is no backend, so "users" live in each visitor's own
// localStorage — there is no shared database and no way to keep a
// secret in source. Any password committed here is public the moment
// this repo is pushed.
//
// For the demo, app.js therefore seeds ONE clearly-labeled demo owner
// account on first load (see seedDemoState). Every fresh browser
// gets that owner, so registering can never silently hand the admin
// role to whoever signs up first — new registrations are customers.
//
// Presentation line: "Because this is a frontend-only system, account
// and role data are simulated using browser storage."
//
// The demo owner password below is intentionally public. It only
// unlocks this browser's own local copy of the demo data; there is no
// server for it to reach.

// Safe storage helpers (prevent crashes when storage is blocked or full)
const safeGetItem = (storage, key) => {
    try {
        return storage.getItem(key);
    } catch (e) {
        return null;
    }
};

const safeSetItem = (storage, key, value) => {
    try {
        storage.setItem(key, value);
        return true;
    } catch (e) {
        return false;
    }
};

const safeRemoveItem = (storage, key) => {
    try {
        storage.removeItem(key);
    } catch (e) {}
};

const safeGetJSON = (storage, key, fallback = null) => {
    try {
        const raw = storage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
};

        const pageMap = {
            'landing': 'landingpage.html',
            'login': 'login.html',
            'register': 'register.html',
            'dashboard': 'dashboard.html',
            'orders': 'order.html',
            'myorders': 'myorders.html',
            'inventory': 'inventory.html',
            'sales': 'sales.html',
            'reports': 'report.html',
            'shop': 'shop.html',
            'customize': 'customize.html',
    'track': 'track.html',
    'cart': 'cart.html',
    'checkout': 'checkout.html',
    'payment': 'payment.html',
    'profile': 'profile.html'
};

const getScreenFromPath = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith('landingpage.html') || path.endsWith('landing.html')) return 'landing';
    if (path.endsWith('login.html')) return 'login';
    if (path.endsWith('register.html') || path.endsWith('signup.html')) return 'register';
    if (path.endsWith('dashboard.html')) return 'dashboard';
        // 'myorders.html' must be tested before 'orders.html':
        // 'myorders.html'.endsWith('orders.html') is true, so the
        // orders check below would otherwise swallow the My Orders
        // screen and the 'myorders' key could never be returned.
        if (path.endsWith('myorders.html')) return 'myorders';
        if (path.endsWith('order.html') || path.endsWith('orders.html')) return 'orders';
    if (path.endsWith('inventory.html')) return 'inventory';
    if (path.endsWith('sales.html')) return 'sales';
    if (path.endsWith('report.html') || path.endsWith('reports.html')) return 'reports';
    if (path.endsWith('shop.html')) return 'shop';
    if (path.endsWith('customize.html')) return 'customize';
    if (path.endsWith('track.html')) return 'track';
    if (path.endsWith('cart.html')) return 'cart';
    if (path.endsWith('checkout.html')) return 'checkout';
    if (path.endsWith('payment.html')) return 'payment';
    if (path.endsWith('profile.html')) return 'profile';
    return 'landing';
};

// --- Bouquet live preview (line-art wrapper + bow + flower variants) ---
// Module scope so both the customize page (via setup) and the bouquet-thumb
// component below can use the same asset paths and hole geometry.
const BOUQUET_ASSET_DIR = '../Bouquet_assets';
        // Bundled image format: WebP (keeps transparency for the cut-out assets)
        const ASSET_EXT = '.webp';
const PREVIEW_CANVAS = 1024;
// Flower holes on the wrapper artwork (x/y center, d diameter, 1024 canvas)
const PREVIEW_HOLES = [
    { x: 422, y: 206, d: 100 },
    { x: 600, y: 209, d: 95 },
    { x: 512, y: 261, d: 110 },
    { x: 404, y: 305, d: 112 },
    { x: 615, y: 311, d: 106 },
    { x: 504, y: 373, d: 113 }
];

// Layered bouquet thumbnail: renders the customer's exact bouquet (flowers,
// wrapper, ribbon) anywhere a custom cart/order line is shown - cart,
// checkout, payment and order details. Uses the same hole geometry as the
// customize preview so it always matches what the customer designed.
const BouquetThumb = {
    props: { c: { type: Object, required: true } },
    computed: {
        b() { return (this.c && this.c.bouquet) || {}; },
        label() {
            return 'Custom bouquet - ' + (this.c.wrapperColor || '') + ' wrapper, ' +
                (this.c.ribbonColor || '') + ' ribbon';
        },
        wrapperSrc() {
            return BOUQUET_ASSET_DIR + '/wrappers/linewrap_' + (this.b.wrapper || 'rose-pink') + ASSET_EXT;
        },
        bowSrc() {
            return BOUQUET_ASSET_DIR + '/bows/ribbonbow_' + (this.b.ribbon || 'white-satin') + ASSET_EXT;
        },
        flowers() {
            const out = [];
            PREVIEW_HOLES.forEach((h, i) => {
                const f = (this.b.flowers || [])[i];
                if (!f) return;
                out.push({
                    src: BOUQUET_ASSET_DIR + '/flowers/' + f.type + '__' + f.color + ASSET_EXT,
                    style: {
                        left: (h.x / PREVIEW_CANVAS * 100) + '%',
                        top: (h.y / PREVIEW_CANVAS * 100) + '%',
                        width: (h.d / PREVIEW_CANVAS * 100) + '%'
                    }
                });
            });
            return out;
        }
    },
    template:
        '<div class="bouquet-thumb" role="img" :aria-label="label">' +
            '<div class="bouquet-flower bouquet-thumb-flower" v-for="(f, i) in flowers" :key="i"' +
                ' :style="[f.style, { backgroundImage: \'url(\' + f.src + \')\' }]"></div>' +
            '<img class="bouquet-layer" :src="wrapperSrc" alt="">' +
            '<img class="bouquet-layer" :src="bowSrc" alt="">' +
        '</div>'
};

createApp({
    setup() {
        // --- Navigation & Auth State ---
        const activeScreen = getScreenFromPath();
        const currentScreen = ref(activeScreen);
        const activeModal = ref(null);
        // Order shown in the admin "creation details" popup
        const viewOrder = ref(null);
        
        // Session state persistence across pages
        const storedAuth = safeGetItem(sessionStorage, 'blooms_logged_in') === 'true' || safeGetItem(localStorage, 'blooms_logged_in') === 'true';
        const isLoggedIn = ref(storedAuth);
        const isMobileMenuOpen = ref(false);

        // Placeholder shown before sign-in. Deliberately generic — it must not
        // carry anyone's real identity, and role must stay 'customer' so an
        // anonymous visitor is never mistaken for the owner (isAdminRole also
        // requires isLoggedIn, but belt and braces).
        const defaultUser = { name: 'Guest', role: 'customer', shop: 'Blooms by Jen' };
        const storedUser = safeGetJSON(sessionStorage, 'blooms_user') || safeGetJSON(localStorage, 'blooms_user');
        const currentUser = ref(storedUser || defaultUser);

        // Login Form
        const loginForm = ref({
            email: '',
            password: '',
            showPassword: false,
            error: ''
        });

        // Toast Notification
        const toast = ref({
            show: false,
            message: '',
            type: 'success'
        });

        const showToast = (message, type = 'success') => {
            toast.value = { show: true, message, type };
            setTimeout(() => {
                toast.value.show = false;
            }, 3000);
        };

        // showToast dies with the page on a full-page redirect, so park the
        // message in sessionStorage and let the destination page replay it.
        const flashToast = (message, type = 'success') => {
            safeSetItem(sessionStorage, 'blooms_flash_toast', JSON.stringify({ message, type }));
        };

        const replayFlashToast = () => {
            const flash = safeGetJSON(sessionStorage, 'blooms_flash_toast', null);
            if (flash && flash.message) {
                safeRemoveItem(sessionStorage, 'blooms_flash_toast');
                showToast(flash.message, flash.type || 'success');
            }
        };

        // --- Initial Fallback Repositories ---
        const initialOrders = [
            {
                id: 'ORD-101',
                customerName: 'Ma. Theresa Santos',
                bouquetType: 'Graduation Sunflower & Rose Bouquet',
                quantity: 1,
                wrappingColor: 'Pastel Yellow & Cream',
                ribbonColor: 'Golden Satin',
                price: 1850,
                status: 'Pending',
                statusHistory: [{ status: 'Pending', at: '2026-08-08T09:15:00.000Z' }],
                paymentMethod: 'COD',
                paymentStatus: 'Unpaid',
                deliveryAddress: '123 Sampaguita St, Barangay Malaya, Quezon City',
                contactNumber: '09171234567',
                date: '2026-08-08',
                customMessage: 'Congratulations on your Graduation, Sarah! Love, Mom.'
            },
            {
                id: 'ORD-102',
                customerName: 'Jerome Ramirez',
                bouquetType: 'Anniversary 12 Red Roses Arrangement',
                quantity: 1,
                wrappingColor: 'Soft Blush Pink',
                ribbonColor: 'Burgundy Ribbon',
                price: 2400,
                status: 'Processing',
                statusHistory: [
                    { status: 'Pending', at: '2026-08-08T08:00:00.000Z' },
                    { status: 'Processing', at: '2026-08-08T10:30:00.000Z' }
                ],
                paymentMethod: 'GCash',
                paymentStatus: 'Paid',
                deliveryAddress: '45 Ilang-Ilang Ave, Barangay Rosas, Marikina City',
                contactNumber: '09182345678',
                date: '2026-08-08',
                customMessage: 'Happy 5th Anniversary my love!'
            },
            {
                id: 'ORD-103',
                customerName: 'Clarissa Reyes',
                bouquetType: 'Pastel Baby Pink Carnation Bouquet',
                quantity: 1,
                wrappingColor: 'White Lace Wrap',
                ribbonColor: 'Light Pink Satin',
                price: 1500,
                status: 'Shipped',
                statusHistory: [
                    { status: 'Pending', at: '2026-08-07T07:45:00.000Z' },
                    { status: 'Processing', at: '2026-08-07T09:10:00.000Z' },
                    { status: 'Shipped', at: '2026-08-07T14:20:00.000Z' }
                ],
                paymentMethod: 'GCash',
                paymentStatus: 'Paid',
                deliveryAddress: '78 Sampaguita Rd, Barangay Sto. Nino, Pasig City',
                contactNumber: '09193456789',
                date: '2026-08-07',
                customMessage: 'Get well soon Dearest Grandma!'
            },
            {
                id: 'ORD-104',
                customerName: 'Kenneth Dela Cruz',
                bouquetType: 'Elegant White Lily & Eucalyptus Bouquet',
                quantity: 1,
                wrappingColor: 'Matte Charcoal Grey',
                ribbonColor: 'Silver Metallic',
                price: 2900,
                status: 'Completed',
                statusHistory: [
                    { status: 'Pending', at: '2026-08-06T08:00:00.000Z' },
                    { status: 'Processing', at: '2026-08-06T10:00:00.000Z' },
                    { status: 'Shipped', at: '2026-08-06T13:30:00.000Z' },
                    { status: 'Completed', at: '2026-08-06T17:45:00.000Z' }
                ],
                paymentMethod: 'COD',
                paymentStatus: 'Paid',
                deliveryAddress: '900 Acacia Lane, Barangay Poblacion, Makati City',
                contactNumber: '09204567890',
                date: '2026-08-06',
                customMessage: 'To the best bride on her special day.'
            }
        ];

        const initialInventory = [
            { id: 'INV-001', itemName: 'Violet Dream (Purple Tulip)', category: 'Single Stems', stock: 25, unitPrice: 79 },
            { id: 'INV-002', itemName: 'Crimson Flame (Red Lily)', category: 'Single Stems', stock: 30, unitPrice: 69 },
            { id: 'INV-003', itemName: 'Azure Whisper (Blue Lily)', category: 'Single Stems', stock: 20, unitPrice: 69 },
            { id: 'INV-004', itemName: 'Golden Cheer (Sunflower Bouquet)', category: 'Mini Bouquets', stock: 15, unitPrice: 249 },
            { id: 'INV-005', itemName: 'Blush Bloom (Pink Cluster)', category: 'Mini Bouquets', stock: 12, unitPrice: 249 },
            { id: 'INV-006', itemName: 'Scarlet Passion (Red Lily Bouquet)', category: 'Mini Bouquets', stock: 10, unitPrice: 249 },
            { id: 'INV-007', itemName: 'Trio Delight (Mixed Bouquets - 3pcs)', category: 'Bundle Deals', stock: 18, unitPrice: 499 },
            { id: 'INV-008', itemName: 'Royal Romance (Red Velvet Lilies)', category: 'Premium Bouquets', stock: 14, unitPrice: 449 },
            { id: 'INV-009', itemName: 'Mystic Violet (Purple Daisies)', category: 'Premium Bouquets', stock: 16, unitPrice: 399 },
            { id: 'INV-010', itemName: 'Tulip Fantasy (Tulip Combo Box)', category: 'Premium Bouquets', stock: 15, unitPrice: 349 },
            { id: 'INV-011', itemName: 'Sunny Friends (Mini Potted Sunflowers)', category: 'Potted Arrangements', stock: 35, unitPrice: 149 },
            { id: 'INV-012', itemName: 'Garden Party (Mixed Daisies Pot)', category: 'Potted Arrangements', stock: 40, unitPrice: 149 },
            { id: 'INV-013', itemName: 'Eternal Grace (Blue/Red Lilies Box)', category: 'Potted Arrangements', stock: 10, unitPrice: 159 },
            { id: 'INV-014', itemName: 'Cascade Garland (Flower Chain)', category: 'Specialty Items', stock: 22, unitPrice: 99 },
            { id: 'INV-015', itemName: 'Bold Sunshine (Single Sunflower)', category: 'Specialty Items', stock: 28, unitPrice: 79 }
        ];

        // Product photos (handmade pipe-cleaner flowers) — filename inside /Flower_images/
        const PRODUCT_IMAGES = {
            'INV-001': 'cfa9694d-5510-4e58-974e-d1d09cf6771e.jpg',
            'INV-002': '4beb38a3-9e73-4902-87ce-106e7e7de94f.jpg',
            'INV-003': '3ed3a1ea-f5a9-44ce-8bc0-504f550573f1.jpg',
            'INV-004': 'b3c2ca22-12ad-4c62-a7c5-14eee15f202c.jpg',
            'INV-005': 'd2e78128-fe9d-48cf-ab30-95043c305c6e.jpg',
            'INV-006': '2a923ca5-e35b-42f7-a323-c1b2c9fc27fa.jpg',
            'INV-007': 'a4a1a5bc-337b-443d-8a7c-2a54d9801cab.jpg',
            'INV-008': '324b0cac-b74d-4cdf-a75c-c3a444af26e6.jpg',
            'INV-009': 'a386d043-ad53-4014-a5b7-8557a9cb9d1a.jpg',
            'INV-010': 'dbd57672-c807-4dbf-8dff-ca3483db5b32.jpg',
            'INV-011': '9a1aa70e-128a-475a-b899-8ee1bfdb533a.jpg',
            'INV-012': 'a06ef2c9-aa47-4a16-82e3-97190bde4df8.jpg',
            'INV-013': 'adef515e-7776-436c-a08a-40ad173dda38.jpg',
            'INV-014': 'c3697426-81a4-46ff-b877-e78d78d1dc0e.jpg',
            'INV-015': 'f82143bd-1d0d-4ed0-943a-420cc3c720c9.jpg'
        };

        const initialSales = [
            { id: 'SAL-501', orderId: 'ORD-104', customerName: 'Kenneth Dela Cruz', amount: 2900, paymentMethod: 'GCash', date: '2026-08-06', notes: 'Full payment via GCash QR' },
            { id: 'SAL-502', orderId: 'ORD-103', customerName: 'Clarissa Reyes', amount: 1500, paymentMethod: 'Cash', date: '2026-08-07', notes: 'Picked up in shop' },
            { id: 'SAL-503', orderId: 'ORD-100', customerName: 'Andrea Gomez', amount: 1250, paymentMethod: 'GCash', date: '2026-08-08', notes: 'GCash online transfer' }
        ];

        // Load or initialize reactive state
        const orders = ref(safeGetJSON(localStorage, 'blooms_orders', initialOrders));
        const inventory = ref(safeGetJSON(localStorage, 'blooms_inventory', initialInventory));
        const sales = ref(safeGetJSON(localStorage, 'blooms_sales', initialSales));

        // Collision-free record IDs. Never derive an ID from array length
        // (deletions shrink it, so IDs get handed out twice) or bare randomness
        // (only 900 possible values). Scans the records for the highest suffix
        // in use and continues from there.
        const nextRecordId = (prefix, records, startAt, pad = 0) => {
            let max = startAt - 1;
            records.forEach((rec) => {
                const match = String(rec.id || '').match(new RegExp('^' + prefix + '-(\\d+)$'));
                if (match) max = Math.max(max, Number(match[1]));
            });
            return prefix + '-' + String(max + 1).padStart(pad, '0');
        };

        // Sales records track product revenue only — the delivery fee the
        // customer pays on top never counts as a sale.
        const orderSaleAmount = (orderLike) => {
            const price = Number(orderLike && orderLike.price) || 0;
            const fee = Number(orderLike && orderLike.deliveryFee) || 0;
            return Math.max(0, price - fee);
        };

        // Backfill product photos onto inventory records saved before images existed.
        // Only fills records with NO image field — a deliberately cleared photo ('')
        // is preserved.
        inventory.value.forEach((entry) => {
            if (entry.image === undefined && PRODUCT_IMAGES[entry.id]) entry.image = PRODUCT_IMAGES[entry.id];
        });

        // One-time price sync: refresh seed prices on devices that still hold the old list.
        // Runs only once (flag), so admin price edits made later are never overwritten.
        if (!safeGetJSON(localStorage, 'blooms_price_list_v2', false)) {
            inventory.value.forEach((entry) => {
                const seed = initialInventory.find((s) => s.id === entry.id);
                if (seed) entry.unitPrice = seed.unitPrice;
            });
            safeSetItem(localStorage, 'blooms_price_list_v2', JSON.stringify(true));
        }

        // Sync with LocalStorage as backup
        watch(orders, (newVal) => safeSetItem(localStorage, 'blooms_orders', JSON.stringify(newVal)), { deep: true });
        watch(inventory, (newVal) => {
            if (!safeSetItem(localStorage, 'blooms_inventory', JSON.stringify(newVal))) {
                showToast('Could not save inventory — browser storage is full. Changes may be lost on reload.', 'error');
            }
        }, { deep: true });
        watch(sales, (newVal) => safeSetItem(localStorage, 'blooms_sales', JSON.stringify(newVal)), { deep: true });

        // --- Back-to-top button ---
        // Built in JS and appended to <body> so all 16 screens share one
        // implementation instead of repeating markup in every page. It floats
        // above the cart dock/stock blocker whenever those bars are showing.
        const mountBackToTop = () => {
            if (document.querySelector('.back-to-top')) return;
            // Customize already keeps the bouquet pinned and the price bar docked
            // at the bottom on phones, so a floating scroll-top button would only
            // crowd the screen there.
            if ((window.location.pathname || '').toLowerCase().includes('customize')) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'back-to-top';
            btn.setAttribute('aria-label', 'Back to top');
            btn.setAttribute('title', 'Back to top');
            btn.innerHTML = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';
            document.body.appendChild(btn);

            const reduceMotion = !!(window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches);

            btn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
            });

            // Bottom-fixed bars would sit under the button, so park it just
            // above the tallest one instead of a hardcoded offset.
            const parkAboveBars = () => {
                let top = null;
                document.querySelectorAll('.cart-dock, .cart-stock-blocker').forEach((el) => {
                    const r = el.getBoundingClientRect();
                    if (r.height > 0 && (top === null || r.top < top)) top = r.top;
                });
                btn.style.bottom = top === null
                    ? ''
                    : Math.round(window.innerHeight - top) + 14 + 'px';
            };

            // Deliberately synchronous: a requestAnimationFrame gate would stay
            // latched shut whenever rAF is starved (background tab, headless),
            // and the button would never appear. Browsers coalesce scroll
            // events to one per frame anyway.
            const sync = () => {
                const y = window.scrollY || document.documentElement.scrollTop || 0;
                parkAboveBars();
                btn.classList.toggle('is-visible', y > 260);
            };

            window.addEventListener('scroll', sync, { passive: true });
            window.addEventListener('resize', sync, { passive: true });
            sync();
        };

        onMounted(() => {
            // Hide loading spinner
            const loader = document.getElementById('app-loading');
            if (loader) loader.style.display = 'none';

            // Scroll-to-top affordance, present on every screen
            mountBackToTop();

            // Warm the cache for the likely next pages while the user reads this one
            prefetchScreens();

            // Seed the demo owner account + sample tables on first load
            seedDemoState();

            // Prefill checkout from the customer's registration/profile data.
            // Existing draft values always win so in-progress typing is never lost.
            if (currentScreen.value === 'checkout' && isLoggedIn.value) {
                const account = findCurrentUserRecord();
                if (account) {
                    checkoutDestinationProvince.value = account.province || '';
                    if (!checkoutForm.value.contactNumber) {
                        if (account.phone) {
                            checkoutForm.value.contactNumber = account.phone;
                        } else {
                            // Legacy accounts without a stored phone: use their last order's contact
                            const lastOrder = orders.value.find(o =>
                                o.customerName === currentUser.value.name && o.contactNumber
                            );
                            if (lastOrder) checkoutForm.value.contactNumber = lastOrder.contactNumber;
                        }
                    }
                    if (!checkoutForm.value.deliveryAddress) {
                        const parts = [account.apartment, account.street, account.barangay, account.city, account.province]
                            .map(p => (p || '').trim())
                            .filter(Boolean);
                        if (parts.length) checkoutForm.value.deliveryAddress = parts.join(', ');
                    }
                }
            }

            // Payment step: destination fallback + GCash details from the profile
            if (currentScreen.value === 'payment' && isLoggedIn.value) {
                const account = findCurrentUserRecord();
                if (account) {
                    checkoutDestinationProvince.value = account.province || '';
                    if (!paymentForm.value.gcashNumber && account.phone) {
                        // Digits only, so a profile number typed with spaces
                        // still passes the 11-digit check
                        paymentForm.value.gcashNumber = String(account.phone).replace(/\D/g, '').slice(0, 11);
                    }
                }
                // Demo reference is generated for the customer (still editable)
                if (!paymentForm.value.gcashReference) {
                    paymentForm.value.gcashReference = generateGcashReference();
                }
            }

            // Admin-only screens (customers cannot access)
            // NB: 'orders' is the order-management table — it is admin
            // only and must be listed here or the role check below
            // never applies to it and customers could open it.
            const adminScreens = ['dashboard', 'orders', 'inventory', 'sales', 'reports'];
            if (adminScreens.includes(currentScreen.value) && !isLoggedIn.value) {
                flashToast('Please log in to access this page', 'info');
                hardNavigate(getCurrentDir() + 'login.html');
                return;
            }

            // Customer-only screens (require login)
            const customerOnlyScreens = ['checkout', 'payment', 'myorders', 'profile'];
            if (customerOnlyScreens.includes(currentScreen.value) && !isLoggedIn.value) {
                flashToast('Please log in to access this page', 'info');
                hardNavigate(getCurrentDir() + 'login.html');
                return;
            }

            // Track was removed from the customer side — redirect anyone landing on it
            if (currentScreen.value === 'track') {
                hardNavigate(getCurrentDir() + (isLoggedIn.value ? 'myorders.html' : 'shop.html'));
                return;
            }

            // A notification click parks the target order id here — open it once
            if (currentScreen.value === 'myorders') {
                const openOrderId = safeGetItem(sessionStorage, 'blooms_open_order');
                if (openOrderId) {
                    safeRemoveItem(sessionStorage, 'blooms_open_order');
                    const targetOrder = myOrders.value.find(o => o.id === openOrderId);
                    if (targetOrder) viewOrderDetails(targetOrder);
                }
            }

            // Admin notification clicks land on the Orders page instead
            if (currentScreen.value === 'orders') {
                const openOrderId = safeGetItem(sessionStorage, 'blooms_open_order');
                if (openOrderId) {
                    safeRemoveItem(sessionStorage, 'blooms_open_order');
                    const targetOrder = orders.value.find(o => o.id === openOrderId);
                    if (targetOrder) openModal('addEditOrder', targetOrder);
                }
            }

            // Surface any already-low stock when an admin loads a page
            if (isAdminRole.value) {
                inventory.value.forEach(maybeNotifyLowStock);
            }

            // Checkout and payment are meaningless with an empty cart — a user
            // landing here directly (bookmark/back button) gets sent to the shop.
            if ((currentScreen.value === 'checkout' || currentScreen.value === 'payment') && cart.value.length === 0) {
                flashToast('Your cart is empty', 'info');
                hardNavigate(getCurrentDir() + 'shop.html');
                return;
            }

            // Returning to the cart re-opens selection from scratch, so a stale
            // "buy only these lines" list can never outlive the screen that set it.
            if (currentScreen.value === 'cart') {
                safeSetItem(sessionStorage, 'blooms_checkout_lines', '[]');
            }

            // Admin pages: only the admin role is allowed in
            if (adminScreens.includes(currentScreen.value) && isLoggedIn.value && !isAdminRole.value) {
                flashToast('Access denied. Only the admin can access this page.', 'error');
                hardNavigate(getCurrentDir() + 'shop.html');
                return;
            }

            replayFlashToast();
        });

        // --- Filter & Search States ---
        const orderSearch = ref('');
        const orderStatusFilter = ref('All');

        const inventorySearch = ref('');
        const inventoryCategoryFilter = ref('All');

        const salesSearch = ref('');
        const salesDateFilter = ref('All');

        // --- Validation Errors ---
        const loginErrors = ref({ general: '' });
        const orderErrors = ref({});
        const itemErrors = ref({});
        const saleErrors = ref({});

        const clearLoginErrors = () => { loginErrors.value = { general: '' }; };
        const clearOrderErrors = () => { orderErrors.value = {}; };
        const clearItemErrors = () => { itemErrors.value = {}; };
        const clearSaleErrors = () => { saleErrors.value = {}; };

        // --- Confirm Modal ---
        // Shared by destructive actions (delete) and by logout, so the
        // button label/icon are part of the state rather than hardcoded.
        const confirmModal = ref({
            show: false,
            title: '',
            message: '',
            onConfirm: () => {},
            confirmLabel: 'Confirm Delete',
            confirmIcon: 'fa-trash',
            // 'danger' = red destructive action, 'primary' = brand gradient (e.g. status updates),
            // 'brand' = the Blooms by Jen logo look (logout)
            confirmTone: 'danger',
            logoIcon: 'fa-triangle-exclamation'
        });

        const showConfirm = (title, message, onConfirm, confirmLabel = 'Confirm Delete', confirmIcon = 'fa-trash', confirmTone = 'danger', logoIcon = null) => {
            confirmModal.value = {
                show: true,
                title,
                message,
                onConfirm,
                confirmLabel,
                confirmIcon,
                confirmTone,
                // Logo badge icon: callers can override it, otherwise danger keeps
                // the warning triangle and other tones mirror their action icon.
                logoIcon: logoIcon || (confirmTone === 'danger' ? 'fa-triangle-exclamation' : confirmIcon)
            };
        };

        // --- Form Models for Modals ---
        const isEditingOrder = ref(false);
        const originalOrderState = ref(null);
        const orderForm = ref({
            id: '',
            customerName: '',
            items: [],
            deliveryFee: 0,
            wrappingColor: 'Soft Blush Pink',
            ribbonColor: 'Golden Satin',
            status: 'Pending',
            date: todayLocal(),
            customMessage: ''
        });

        const isEditingItem = ref(false);
        const itemForm = ref({
            id: '',
            itemName: '',
            category: 'Single Stems',
            stock: 20,
            unitPrice: 100,
            supplier: 'Baguio Fresh Flora'
        });

        const isEditingSale = ref(false);
        const saleForm = ref({
            id: '',
            orderId: nextRecordId('ORD', orders.value, 105),
            customerName: '',
            amount: 1500,
            paymentMethod: 'GCash',
            date: todayLocal(),
            notes: 'Handcrafted bouquet transaction'
        });

        // --- Customer Side State ---
        const customerSearch = ref('');
        const customerCategoryFilter = ref('All');
        const isCustomerMenuOpen = ref(false);

        const customerOrderForm = ref({
            customerName: '',
            contactNumber: '',
            bouquetType: '',
            quantity: 1,
            wrappingColor: 'Soft Blush Pink',
            ribbonColor: 'Golden Satin',
            customMessage: '',
            paymentMethod: 'Cash'
        });

        const customerOrderErrors = ref({});
        const customerOrderPlaced = ref(false);
        const placedOrderId = ref('');

        const trackSearchId = ref('');
        const trackedOrder = ref(null);
        const trackNotFound = ref(false);

        // --- My Orders (Customer) State ---
        const selectedOrder = ref(null);

        // --- Cart State ---
        const cart = ref(safeGetJSON(localStorage, 'blooms_cart', []));
        const cartOpen = ref(false);

        watch(cart, (newVal) => safeSetItem(localStorage, 'blooms_cart', JSON.stringify(newVal)), { deep: true });

        // --- Registration State ---
        const registerForm = ref({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            street: '',
            apartment: '',
            barangay: '',
            province: '',
            city: '',
            password: '',
            confirmPassword: '',
            terms: false,
            showPassword: false
        });

        const registerErrors = ref({});
        const registerSubmitting = ref(false);
        const registrationSuccess = ref(false);
        // Demo email verification result: shown instead of jumping straight to login
        const emailVerified = ref(false);
        const registerRateLimited = ref(false);
        const registerRateLimitSeconds = ref(0);
        let registerRateTimer = null;

        // --- Terms of Service / Privacy Policy modal (registration) ---
        const legalModal = ref({ show: false, type: 'terms' });
        let legalModalKeyHandler = null;

        const closeLegalModal = () => {
            legalModal.value.show = false;
            if (legalModalKeyHandler) {
                document.removeEventListener('keydown', legalModalKeyHandler);
                legalModalKeyHandler = null;
            }
        };

        const openLegalModal = (type) => {
            legalModal.value = { show: true, type: type === 'privacy' ? 'privacy' : 'terms' };
            legalModalKeyHandler = (event) => {
                if (event.key === 'Escape') closeLegalModal();
            };
            document.addEventListener('keydown', legalModalKeyHandler);
        };

        // --- Profile State (customer) ---
        // Same fields the customer filled in at registration; stored values are
        // read-only (fullname, role, country, created_at) and shown as info.
        const profileForm = ref({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            street: '',
            barangay: '',
            apartment: '',
            province: '',
            city: ''
        });
        const profileErrors = ref({});
        const profileSaving = ref(false);
        const profileMeta = ref({
            id: '',
            role: 'customer',
            country: 'PH',
            created_at: '',
            isVerified: false
        });
        const profileLoaded = ref(false);
        const pwChangeForm = ref({ current: '', next: '', confirm: '' });
        const pwChangeErrors = ref({});
        const pwChanging = ref(false);

        // --- Page Navigation Function ---
        // --- Page navigation feel ---
        // navigateTo() is a real page load, so paint something the instant the
        // user clicks instead of freezing on the old screen while the new page
        // downloads and mounts.
        const PAGE_LOADER_ID = 'blooms-page-loader';

        const showPageLoader = () => {
            if (document.getElementById(PAGE_LOADER_ID)) return;
            const loader = document.createElement('div');
            loader.id = PAGE_LOADER_ID;
            loader.setAttribute('aria-hidden', 'true');
            loader.innerHTML = '<div class="page-loader-bar"></div>';
            document.body.appendChild(loader);
        };

        // Single funnel for every full page navigation (nav links, guards, logout)
        const hardNavigate = (url) => {
            showPageLoader();
            window.location.href = url;
        };

        // Warm the HTTP cache for the screens this user is likely to open next
        const prefetchScreens = () => {
            const conn = navigator.connection;
            if (conn && (conn.saveData || /^(slow-2g|2g)$/.test(conn.effectiveType || ''))) return;
            const adminList = ['dashboard.html', 'inventory.html', 'order.html', 'sales.html', 'report.html'];
            const customerList = ['shop.html', 'cart.html', 'myorders.html', 'profile.html', 'customize.html', 'checkout.html', 'payment.html'];
            const pages = isAdminRole.value ? adminList : customerList;
            const run = () => pages.forEach((file) => {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.as = 'document';
                link.href = getCurrentDir() + file;
                document.head.appendChild(link);
            });
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(run, { timeout: 3000 });
            } else {
                setTimeout(run, 1500);
            }
        };

        const navigateTo = (screen) => {
            isMobileMenuOpen.value = false;

            // Track was removed from the customer side — send visitors to My Orders (or the shop)
            if (screen === 'track') {
                hardNavigate(getCurrentDir() + (isLoggedIn.value ? 'myorders.html' : 'shop.html'));
                return;
            }

            // Admin-only screens
            const adminScreens = ['dashboard', 'orders', 'inventory', 'sales', 'reports'];

            // Customer-only screens (require login)
            const customerOnlyScreens = ['checkout', 'payment', 'myorders', 'profile'];

            // Redirect to login if not logged in
            if ((adminScreens.includes(screen) || customerOnlyScreens.includes(screen)) && !isLoggedIn.value) {
                flashToast('Please log in to access this page', 'info');
                hardNavigate(getCurrentDir() + 'login.html');
                return;
            }

            // Admin pages: only the admin role is allowed in
            if (adminScreens.includes(screen) && isLoggedIn.value && !isAdminRole.value) {
                flashToast('Access denied. Only the admin can access this page.', 'error');
                hardNavigate(getCurrentDir() + 'shop.html');
                return;
            }

            const pageFile = pageMap[screen] || 'landingpage.html';
            const targetUrl = getCurrentDir() + pageFile;

            if (getScreenFromPath() === screen) {
                currentScreen.value = screen;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                hardNavigate(targetUrl);
            }
        };

        const toggleMobileMenu = () => {
            isMobileMenuOpen.value = !isMobileMenuOpen.value;
        };

        // --- Auth Logic ---
        const handleLogin = () => {
            clearLoginErrors();
            let hasError = false;

            if (!loginForm.value.email) {
                loginErrors.value.email = 'Email is required';
                hasError = true;
            } else if (!/\S+@\S+\.\S+/.test(loginForm.value.email)) {
                loginErrors.value.email = 'Invalid email';
                hasError = true;
            }

            if (!loginForm.value.password) {
                loginErrors.value.password = 'Password is required';
                hasError = true;
            }

            if (hasError) return;

            // Rate limiting check
            if (isLoginRateLimited()) {
                const remaining = getLoginLockRemaining();
                loginErrors.value.general = `Too many login attempts. Please wait ${remaining} seconds before trying again.`;
                return;
            }

            const email = loginForm.value.email.trim().toLowerCase();
            const password = loginForm.value.password;

            // Only registered users can log in
            const users = getUsers();
            const registeredUser = users.find(u => u.email === email);

            if (!registeredUser) {
                // No matching account: flag the email field
                loginErrors.value.email = 'Invalid email';
                recordLoginAttempt();
                return;
            }

            // Check if email is verified
            if (!registeredUser.isVerified) {
                loginErrors.value.email = 'Please verify your email address before logging in.';
                recordLoginAttempt();
                return;
            }

            // Verify password
            hashPassword(password).then(hash => {
                // hash is null on a non-secure origin, and an account
                // seeded there would hold an empty hash — neither may
                // ever authenticate, so require a non-empty hash on
                // both sides of the comparison.
                if (hash && hash === registeredUser.passwordHash) {
                    // Success - route by role
                    isLoggedIn.value = true;
                    currentUser.value = { name: registeredUser.name, role: registeredUser.role, shop: 'Blooms by Jen', email: registeredUser.email };
                    safeSetItem(sessionStorage, 'blooms_logged_in', 'true');
                    safeSetItem(sessionStorage, 'blooms_user', JSON.stringify(currentUser.value));
                    resetLoginAttempts();
                    flashToast(`Welcome back, ${registeredUser.name}!`, 'success');
                    if (registeredUser.role === 'admin') {
                        navigateTo('dashboard');
                    } else {
                        navigateTo('shop');
                    }
                } else {
                    loginErrors.value.password = 'Invalid password';
                    recordLoginAttempt();
                }
            });
        };

        // Demo helper: drop the seeded owner credentials into the login
        // form so they are never typed live during a presentation.
        // Simulated auth - the account itself lives in localStorage.
        const fillDemoCredentials = () => {
            loginForm.value.email = DEMO_OWNER_EMAIL;
            loginForm.value.password = DEMO_OWNER_PASSWORD;
            loginForm.value.showPassword = true;
            clearLoginErrors();
        };

        // Signs the user out. Never called directly from the templates —
        // always routed through the confirmation modal below.
        const performLogout = () => {
            isLoggedIn.value = false;
            isMobileMenuOpen.value = false;
            // Drop the cached identity too, otherwise the nav keeps showing
            // the signed-in name after the session keys are cleared.
            currentUser.value = defaultUser;
            safeRemoveItem(sessionStorage, 'blooms_logged_in');
            safeRemoveItem(sessionStorage, 'blooms_user');
            safeRemoveItem(localStorage, 'blooms_logged_in');
            safeRemoveItem(localStorage, 'blooms_user');
            flashToast('Logged out successfully.', 'success');
            navigateTo('landing');
        };

        // Clicking the power icon asks for confirmation first, so nobody
        // gets signed out by an accidental tap. Cancel just closes the modal.
        const handleLogout = () => {
            showConfirm(
                'Log Out',
                'Are you sure you want to log out of your account?',
                performLogout,
                'Log Out',
                'fa-right-from-bracket',
                'brand',
                'fa-spa'
            );
        };

        // --- Modals Controller ---
        const openModal = (modalName, data = null) => {
            isMobileMenuOpen.value = false;
            activeModal.value = modalName;
            if (modalName === 'orderView') {
                viewOrder.value = data;
            }
            if (modalName === 'addEditOrder') {
                if (data) {
                    isEditingOrder.value = true;
                    originalOrderState.value = JSON.parse(JSON.stringify(data));
                    // Migrate legacy single-item order to new items[] format
                    let items = data.items || [];
                    if (items.length === 0 && data.bouquetType) {
                        const invItem = inventory.value.find(i => i.itemName === data.bouquetType);
                        items = [{
                            itemId: invItem ? invItem.id : '',
                            itemName: data.bouquetType,
                            unitPrice: Number(data.price) || 0,
                            quantity: Number(data.quantity) || 1,
                            lineTotal: (Number(data.price) || 0) * (Number(data.quantity) || 1),
                            wrappingColor: data.wrappingColor || '',
                            ribbonColor: data.ribbonColor || ''
                        }];
                    }
                    orderForm.value = {
                        id: data.id,
                        customerName: data.customerName || '',
                        items: items,
                        deliveryFee: Number(data.deliveryFee) || 0,
                        wrappingColor: data.wrappingColor || 'Soft Blush Pink',
                        ribbonColor: data.ribbonColor || 'Golden Satin',
                        status: data.status || 'Pending',
                        date: data.date || todayLocal(),
                        customMessage: data.customMessage || ''
                    };
                    recalcOrderTotals();
                } else {
                    isEditingOrder.value = false;
                    originalOrderState.value = null;
                    const firstInv = inventory.value[0];
                    orderForm.value = {
                        id: nextRecordId('ORD', orders.value, 105),
                        customerName: '',
                        items: [],
                        deliveryFee: 0,
                        wrappingColor: 'Soft Blush Pink',
                        ribbonColor: 'Golden Satin',
                        status: 'Pending',
                        date: todayLocal(),
                        customMessage: ''
                    };
                    addOrderLine(firstInv);
                }
            } else if (modalName === 'addEditItem') {
                if (data) {
                    isEditingItem.value = true;
                    itemForm.value = { ...data };
                    // Editing must never drop the photo: if the record somehow has no
                    // image field, fall back to the seed photo for this item.
                    if (itemForm.value.image === undefined || itemForm.value.image === null) {
                        itemForm.value.image = PRODUCT_IMAGES[data.id] || '';
                    }
                    // Allow a previously failed photo load to retry
                    if (itemForm.value.id) delete imageLoadErrors.value[itemForm.value.id];
                } else {
                    isEditingItem.value = false;
                    itemForm.value = {
                        id: nextRecordId('INV', inventory.value, 1, 3),
                        itemName: '',
                        category: 'Single Stems',
                        stock: 25,
                        unitPrice: 69,
                        supplier: 'Benguet Valley Farm',
                        image: ''
                    };
                }
            } else if (modalName === 'addEditSale') {
                if (data) {
                    isEditingSale.value = true;
                    saleForm.value = { ...data };
                } else {
                    isEditingSale.value = false;
                    saleForm.value = {
                        id: nextRecordId('SAL', sales.value, 501),
                        orderId: nextRecordId('ORD', orders.value, 105),
                        customerName: '',
                        amount: 1800,
                        paymentMethod: 'GCash',
                        date: todayLocal(),
                        notes: 'Over-the-counter sale'
                    };
                }
            }
        };

const firstLineItem = computed(() => {
            const lines = orderForm.value.items || [];
            if (lines.length === 0) return null;
            return inventory.value.find(i => i.id === lines[0].itemId) || null;
        });

        const recalcOrderTotals = () => {
            const lines = orderForm.value.items || [];
            let subtotal = 0;
            let totalQty = 0;
            for (const line of lines) {
                const qty = Number(line.quantity) || 1;
                const unitPrice = Number(line.unitPrice) || 0;
                line.lineTotal = qty * unitPrice;
                subtotal += line.lineTotal;
                totalQty += qty;
            }
            const fee = Number(orderForm.value.deliveryFee) || 0;
            orderForm.value.subtotal = subtotal;
            orderForm.value.price = subtotal + fee;
            orderForm.value.quantity = totalQty;
            orderForm.value.bouquetType = lines.map(l => l.itemName).join(', ');
        };

        // A custom bouquet is assembled to order, so the shop bouquet the
        // customizer happens to match by name has nothing to do with it:
        // neither its stock pool nor its price applies to those lines.
        const CUSTOM_BOUQUET_PRICE = 399;
        const MADE_TO_ORDER_MAX = 99;
        const isMadeToOrder = (line) => !!(line &&
            ((line.customizations && line.customizations.bouquet) || line.madeToOrder));

        const getLineMaxStock = (line) => {
            if (isMadeToOrder(line)) return MADE_TO_ORDER_MAX;
            const inv = inventory.value.find(i => i.id === line.itemId);
            if (!inv) return 999;
            let stock = Number(inv.stock) || 0;
            if (isEditingOrder.value && originalOrderState.value) {
                const oldLine = (originalOrderState.value.items || []).find(l => l.itemId === line.itemId);
                if (oldLine) {
                    stock += Number(oldLine.quantity) || 0;
                }
            }
            return Math.max(1, stock);
        };

        const addOrderLine = (item = null) => {
            const lines = orderForm.value.items || [];
            if (item) {
                lines.push({
                    itemId: item.id,
                    itemName: item.itemName,
                    unitPrice: Number(item.unitPrice) || 0,
                    quantity: 1,
                    lineTotal: Number(item.unitPrice) || 0,
                    wrappingColor: '',
                    ribbonColor: ''
                });
            } else {
                const firstInv = inventory.value[0];
                if (firstInv) {
                    lines.push({
                        itemId: firstInv.id,
                        itemName: firstInv.itemName,
                        unitPrice: Number(firstInv.unitPrice) || 0,
                        quantity: 1,
                        lineTotal: Number(firstInv.unitPrice) || 0,
                        wrappingColor: '',
                        ribbonColor: ''
                    });
                }
            }
            orderForm.value.items = lines;
            recalcOrderTotals();
        };

        const removeOrderLine = (index) => {
            const lines = orderForm.value.items || [];
            lines.splice(index, 1);
            orderForm.value.items = lines;
            recalcOrderTotals();
        };

const updateOrderCalculatedPrice = () => {
            recalcOrderTotals();
        };

        const closeModal = () => {
            activeModal.value = null;
            viewOrder.value = null;
        };

        // --- Orders Actions ---
const saveOrder = () => {
            clearOrderErrors();
            let hasError = false;

            if (!orderForm.value.customerName || orderForm.value.customerName.trim().length < 2) {
                orderErrors.value.customerName = 'Customer name must be at least 2 characters';
                hasError = true;
            }

            const lines = orderForm.value.items || [];
            if (lines.length === 0) {
                orderErrors.value.items = 'At least one order line is required';
                hasError = true;
            } else {
                for (let i = 0; i < lines.length; i++) {
                    if (!lines[i].itemId) {
                        orderErrors.value['item_' + i] = 'Line ' + (i + 1) + ': item is required';
                        hasError = true;
                    }
                    if (!lines[i].quantity || lines[i].quantity < 1) {
                        orderErrors.value['qty_' + i] = 'Line ' + (i + 1) + ': quantity must be at least 1';
                        hasError = true;
                    }
                }
            }

            if (!isEditingOrder.value) {
                const exists = orders.value.some(o => o.id === orderForm.value.id);
                if (exists) {
                    orderErrors.value.id = 'Order ID already exists';
                    hasError = true;
                }
            }

            if (hasError) return;

            if (isEditingOrder.value) {
                const oldOrder = originalOrderState.value || orders.value.find(o => o.id === orderForm.value.id);

                // Restore stock from old order lines
                const oldLines = oldOrder?.items || [];
                if (oldLines.length === 0 && oldOrder?.bouquetType) {
                    // Legacy single-item order
                    const oldItem = inventory.value.find(i => i.itemName === oldOrder.bouquetType);
                    if (oldItem) {
                        oldItem.stock = Number(oldItem.stock) + (Number(oldOrder.quantity) || 1);
                        maybeNotifyLowStock(oldItem);
                    }
                } else {
                    for (const oldLine of oldLines) {
                        if (isMadeToOrder(oldLine)) continue;
                        const inv = inventory.value.find(i => i.id === oldLine.itemId);
                        if (inv) {
                            inv.stock = Number(inv.stock) + (Number(oldLine.quantity) || 0);
                            maybeNotifyLowStock(inv);
                        }
                    }
                }

                // Deduct stock for new order lines
                for (const line of lines) {
                    if (isMadeToOrder(line)) continue;
                    const inv = inventory.value.find(i => i.id === line.itemId);
                    if (inv) {
                        const qty = Number(line.quantity) || 1;
                        if (qty > inv.stock) {
                            showToast(`Cannot save: ${line.itemName} requested ${qty} but only ${inv.stock} in stock!`, 'error');
                            return;
                        }
                        inv.stock = Math.max(0, inv.stock - qty);
                        maybeNotifyLowStock(inv);
                    }
                }

                const index = orders.value.findIndex(o => o.id === orderForm.value.id);
                if (index !== -1) {
                    const saved = { ...orderForm.value };
                    const statusChanged = oldOrder && oldOrder.status !== saved.status;
                    if (!Array.isArray(saved.statusHistory)) {
                        saved.statusHistory = oldOrder && Array.isArray(oldOrder.statusHistory)
                            ? [...oldOrder.statusHistory]
                            : [{ status: oldOrder ? oldOrder.status : saved.status, at: new Date().toISOString() }];
                    }
                    if (statusChanged) {
                        saved.statusHistory.push({ status: saved.status, at: new Date().toISOString() });
                        if (saved.status === 'Completed' && ['COD', 'Cash'].includes(saved.paymentMethod)) {
                            saved.paymentStatus = 'Paid';
                        }
                    }
                    orders.value[index] = saved;
                    if (statusChanged) notifyStatusChange(saved);
                }

                showToast(`Order ${orderForm.value.id} updated! Stock adjusted.`);
            } else {
                // Validate stock for all lines before committing
                for (const line of lines) {
                    if (isMadeToOrder(line)) continue;
                    const inv = inventory.value.find(i => i.id === line.itemId);
                    if (inv) {
                        const qty = Number(line.quantity) || 1;
                        if (qty > inv.stock) {
                            showToast(`Cannot place order: ${line.itemName} quantity (${qty}) exceeds stock (${inv.stock})!`, 'error');
                            return;
                        }
                    }
                }

                // Deduct stock
                for (const line of lines) {
                    if (isMadeToOrder(line)) continue;
                    const inv = inventory.value.find(i => i.id === line.itemId);
                    if (inv) {
                        const qty = Number(line.quantity) || 1;
                        inv.stock = Math.max(0, inv.stock - qty);
                        maybeNotifyLowStock(inv);
                    }
                }

                const created = { ...orderForm.value };
                if (!Array.isArray(created.statusHistory)) {
                    created.statusHistory = [{ status: created.status || 'Pending', at: new Date().toISOString() }];
                }
                if (!created.paymentStatus) created.paymentStatus = 'Unpaid';
                orders.value.unshift(created);
                addNotification(created.id, `Order ${created.id} has been placed successfully.`, 'order', created.customerName || '');

                showToast(`New Order ${orderForm.value.id} added & stock depleted!`);
            }
            closeModal();
        };

        const updateOrderStatus = (order, newStatus) => {
            if (order.status === newStatus) return;
            const wasCompleted = order.status === 'Completed';
            order.status = newStatus;
            // Append to status history so the customer sees a real timeline
            if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
            order.statusHistory.push({ status: newStatus, at: new Date().toISOString() });
            // A completed COD order has been paid on receipt
            if (newStatus === 'Completed' && ['COD', 'Cash'].includes(order.paymentMethod)) {
                order.paymentStatus = 'Paid';
            }
            // Create sale record when order reaches Completed (not before)
            if (!wasCompleted && newStatus === 'Completed') {
                const saleIdx = sales.value.findIndex(s => s.orderId === order.id);
                if (saleIdx === -1) {
                    sales.value.unshift({
                        id: nextRecordId('SAL', sales.value, 501),
                        orderId: order.id,
                        customerName: order.customerName,
                        amount: orderSaleAmount(order),
                        paymentMethod: order.paymentMethod || 'GCash',
                        date: order.date || todayLocal(),
                        notes: order.paymentMethod === 'GCash' ? `GCash ref: ${order.gcashReference || ''}` : 'Cash on delivery'
                    });
                }
            }
            // Write a notification row at the same moment
            notifyStatusChange(order);
            showToast(`Order ${order.id} status changed to ${newStatus}`);
        };

        // A status change is permanent and notifies the customer — confirm first
        const requestStatusChange = (order, newStatus) => {
            if (!order || order.status === newStatus) return;
            showConfirm(
                'Change Order Status',
                `Move ${order.id} from "${order.status}" to "${newStatus}"? The customer will be notified.`,
                () => updateOrderStatus(order, newStatus),
                'Change Status',
                'fa-arrows-rotate',
                'primary'
            );
        };

        const deleteOrder = (id) => {
            showConfirm('Delete Order', `Are you sure you want to delete order ${id}?`, () => {
                const orderToDelete = orders.value.find(o => o.id === id);
                let restored = false;
                if (orderToDelete) {
                    // Multi-item admin order (new format)
                    if (Array.isArray(orderToDelete.items) && orderToDelete.items.length > 0) {
                        for (const line of orderToDelete.items) {
                            if (isMadeToOrder(line)) continue;
                            const inv = inventory.value.find(i => i.id === line.itemId);
                            if (inv) {
                                inv.stock = Number(inv.stock) + (Number(line.quantity) || 0);
                                maybeNotifyLowStock(inv);
                                restored = true;
                            }
                        }
                    } else if (Array.isArray(orderToDelete.cartItems) && orderToDelete.cartItems.length > 0) {
                        // Customer cart order: restore each line item by its inventory ID
                        for (const line of orderToDelete.cartItems) {
                            if (isMadeToOrder(line)) continue;
                            const inv = inventory.value.find(i => i.id === line.itemId);
                            if (inv) {
                                inv.stock = Number(inv.stock) + (Number(line.quantity) || 0);
                                maybeNotifyLowStock(inv);
                                restored = true;
                            }
                        }
                    } else {
                        // Legacy admin-created order: bouquetType is a single inventory item name
                        const qtyToRestore = Number(orderToDelete.quantity) || 1;
                        const item = inventory.value.find(i => i.itemName === orderToDelete.bouquetType);
                        if (item) {
                            item.stock = Number(item.stock) + qtyToRestore;
                            maybeNotifyLowStock(item);
                            restored = true;
                        }
                    }
                }
                orders.value = orders.value.filter(o => o.id !== id);
                sales.value = sales.value.filter(s => s.orderId !== id);
                showToast(restored
                    ? `Order ${id} deleted, stock restored & sale record removed`
                    : `Order ${id} deleted & sale record removed`);
            });
        };

        // --- Inventory Actions ---
        // --- Product Photo Upload (inventory add/edit) ---
        const ITEM_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
        const ITEM_IMAGE_MAX_DIM = 600;

        const onItemImageSelected = (event) => {
            const file = event.target.files && event.target.files[0];
            if (file) {
                if (!/^image\/(png|jpe?g|webp|gif|avif)$/i.test(file.type)) {
                    itemErrors.value.image = 'Please choose a JPG, PNG, or WebP image';
                    return;
                }
                if (file.size > ITEM_IMAGE_MAX_BYTES) {
                    itemErrors.value.image = 'Image must be 5MB or smaller';
                    return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                    const img = new Image();
                    img.onload = () => {
                        // Downscale so the photo fits comfortably in Local Storage
                        const scale = Math.min(1, ITEM_IMAGE_MAX_DIM / Math.max(img.width, img.height));
                        const width = Math.max(1, Math.round(img.width * scale));
                        const height = Math.max(1, Math.round(img.height * scale));
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                        itemForm.value.image = canvas.toDataURL('image/jpeg', 0.82);
                        delete itemErrors.value.image;
                        // Reset any prior load failure so the new photo renders
                        if (itemForm.value.id) delete imageLoadErrors.value[itemForm.value.id];
                    };
                    img.onerror = () => { itemErrors.value.image = 'Could not read that image file'; };
                    img.src = reader.result;
                };
                reader.onerror = () => { itemErrors.value.image = 'Could not read that image file'; };
                reader.readAsDataURL(file);
            }
            // Allow re-selecting the same file later
            event.target.value = '';
        };

        const removeItemFormImage = () => {
            itemForm.value.image = '';
            delete itemErrors.value.image;
            if (itemForm.value.id) delete imageLoadErrors.value[itemForm.value.id];
        };

        const saveItem = () => {
            clearItemErrors();
            let hasError = false;

            if (!itemForm.value.itemName || itemForm.value.itemName.trim().length < 2) {
                itemErrors.value.itemName = 'Item name must be at least 2 characters';
                hasError = true;
            }

            if (Number(itemForm.value.stock) < 0) {
                itemErrors.value.stock = 'Stock cannot be negative';
                hasError = true;
            }

            if (Number(itemForm.value.unitPrice) <= 0) {
                itemErrors.value.unitPrice = 'Price must be greater than 0';
                hasError = true;
            }

            if (!isEditingItem.value) {
                const exists = inventory.value.some(i => i.id === itemForm.value.id);
                if (exists) {
                    itemErrors.value.id = 'Item ID already exists';
                    hasError = true;
                }
            }

            if (hasError) return;

            if (isEditingItem.value) {
                const index = inventory.value.findIndex(i => i.id === itemForm.value.id);
                if (index !== -1) {
                    const existing = inventory.value[index];
                    const record = { ...itemForm.value };
                    // Safety net: if the form lost the photo (e.g. only the price was
                    // changed and image came through undefined), keep the stored photo.
                    // An explicit '' from the Remove button is respected.
                    if ((record.image === undefined || record.image === null) &&
                        existing.image !== undefined && existing.image !== null) {
                        record.image = existing.image;
                    }
                    inventory.value[index] = record;
                    // Retry the photo in case its previous load had failed
                    delete imageLoadErrors.value[record.id];
                    maybeNotifyLowStock(inventory.value[index]);
                }
                showToast(`Item ${itemForm.value.itemName} updated!`);
            } else {
                inventory.value.unshift({ ...itemForm.value });
                if (itemForm.value.id) delete imageLoadErrors.value[itemForm.value.id];
                maybeNotifyLowStock(inventory.value[0]);
                showToast(`Item ${itemForm.value.itemName} added to stock!`);
            }
            closeModal();
        };

        const deleteItem = (id) => {
            showConfirm('Delete Item', `Delete item ${id} from inventory?`, () => {
                inventory.value = inventory.value.filter(i => i.id !== id);
                showToast(`Item ${id} removed`);
            });
        };

        // --- Sales Actions ---
        const saveSale = () => {
            clearSaleErrors();
            let hasError = false;

            if (!saleForm.value.customerName || saleForm.value.customerName.trim().length < 2) {
                saleErrors.value.customerName = 'Customer name must be at least 2 characters';
                hasError = true;
            }

            if (!saleForm.value.amount || Number(saleForm.value.amount) <= 0) {
                saleErrors.value.amount = 'Amount must be greater than 0';
                hasError = true;
            }

            if (!isEditingSale.value) {
                const exists = sales.value.some(s => s.id === saleForm.value.id);
                if (exists) {
                    saleErrors.value.id = 'Transaction ID already exists';
                    hasError = true;
                }
            }

            if (hasError) return;

            if (isEditingSale.value) {
                const index = sales.value.findIndex(s => s.id === saleForm.value.id);
                if (index !== -1) sales.value[index] = { ...saleForm.value };
                showToast(`Sale ${saleForm.value.id} updated!`);
            } else {
                sales.value.unshift({ ...saleForm.value });
                showToast(`Transaction ${saleForm.value.id} logged!`);
            }
            closeModal();
        };

        const deleteSale = (id) => {
            showConfirm('Delete Sale', `Delete sale transaction ${id}?`, () => {
                sales.value = sales.value.filter(s => s.id !== id);
                showToast(`Sale transaction ${id} deleted`);
            });
        };

        // --- Export Feature ---
        // Guard against CSV formula injection (a.k.a. CSV injection,
        // CWE-1236). Spreadsheet apps treat a cell that starts with
        // =, +, -, @ or a tab/CR as a formula, so a customer or item
        // name like "=1+1" or "=HYPERLINK(...)" would be evaluated
        // when the owner opens this report. Prefixing such a value
        // with an apostrophe and always quoting the cell keeps the
        // original text literal and protects embedded quotes,
        // commas and line breaks.
        const csvEscape = (value) => {
            let str = (value === null || value === undefined) ? '' : String(value);
            if (/^[=+\-@\t\r]/.test(str)) str = "'" + str;
            return '"' + str.replace(/"/g, '""') + '"';
        };

        const exportReportCSV = () => {
            const rows = [];
            rows.push(['Blooms by Jen - Sales and Inventory Summary Report']);
            rows.push([]);
            rows.push(['SALES TRANSACTIONS']);
            rows.push(['Transaction ID', 'Order ID', 'Customer', 'Amount (PHP)', 'Payment Method', 'Date', 'Notes']);
            sales.value.forEach(s => rows.push([
                s.id, s.orderId, s.customerName, s.amount, s.paymentMethod, s.date, s.notes
            ]));

            rows.push([]);
            rows.push(['INVENTORY STOCK MONITORING']);
            rows.push(['Item ID', 'Item Name', 'Category', 'Stock Level', 'Unit Price (PHP)']);
            inventory.value.forEach(i => rows.push([
                i.id, i.itemName, i.category, i.stock, i.unitPrice
            ]));

            // CRLF line endings keep Excel/LibreOffice happy, and the
            // BOM keeps non-ASCII (e.g. peso amounts) decoding correctly.
            const csvContent = rows.map(r => r.map(csvEscape).join(',')).join('\r\n');
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Blooms_by_Jen_Report_${todayLocal()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast("Report exported successfully as CSV!");
        };

        // --- Customer Side Functions ---
        const clearCustomerOrderErrors = () => { customerOrderErrors.value = {}; };

        const toggleCustomerMenu = () => {
            isCustomerMenuOpen.value = !isCustomerMenuOpen.value;
        };

        const filteredCustomerInventory = computed(() => {
            return inventory.value.filter(i => {
                const matchesSearch = i.itemName.toLowerCase().includes(customerSearch.value.toLowerCase());
                const matchesCategory = customerCategoryFilter.value === 'All' || i.category === customerCategoryFilter.value;
                return matchesSearch && matchesCategory && Number(i.stock) > 0;
            });
        });

        // --- Shop card stats: units sold + star rating per product ---
        // Both are derived from real orders/reviews so the shop never shows
        // numbers that the data can't back up.
        const orderLineHits = (order) => {
            const hits = [];
            const push = (arr) => {
                if (!Array.isArray(arr)) return;
                arr.forEach((l) => {
                    if (l && l.itemId) hits.push({ id: l.itemId, qty: Number(l.quantity) || 0 });
                });
            };
            push(order.items);
            push(order.cartItems);
            // Legacy orders only stored a product name and a single quantity
            if (hits.length === 0 && typeof order.bouquetType === 'string' && order.bouquetType) {
                inventory.value.forEach((it) => {
                    if (order.bouquetType.indexOf(it.itemName) !== -1) {
                        hits.push({ id: it.id, qty: Number(order.quantity) || 0 });
                    }
                });
            }
            return hits;
        };

        const shopStats = computed(() => {
            const stats = {};
            inventory.value.forEach((it) => {
                stats[it.id] = { sold: 0, ratingSum: 0, ratingCount: 0 };
            });
            orders.value.forEach((order) => {
                const hits = orderLineHits(order).filter((h) => stats[h.id]);
                hits.forEach((h) => { stats[h.id].sold += h.qty; });
                const rating = Number(order.review && order.review.rating) || 0;
                if (rating > 0 && hits.length > 0) {
                    hits.forEach((h) => {
                        stats[h.id].ratingSum += rating;
                        stats[h.id].ratingCount += 1;
                    });
                }
            });
            Object.keys(stats).forEach((id) => {
                const s = stats[id];
                s.avg = s.ratingCount > 0 ? s.ratingSum / s.ratingCount : 0;
            });
            return stats;
        });

        // Per-card lookup used by the template; a brand-new product has no
        // orders yet, so it falls back to a zeroed entry.
        const shopStat = (item) => shopStats.value[item.id] ||
            { sold: 0, avg: 0, ratingCount: 0 };

        const customerSelectedBouquet = computed(() => {
            return inventory.value.find(i => i.itemName === customerOrderForm.value.bouquetType) || null;
        });

        const customerMaxQuantity = computed(() => {
            if (customerSelectedBouquet.value) {
                return Math.max(1, Number(customerSelectedBouquet.value.stock) || 0);
            }
            return 999;
        });

        const customerTotalPrice = computed(() => {
            const item = customerSelectedBouquet.value;
            const qty = Number(customerOrderForm.value.quantity) || 1;
            if (item) {
                return qty * Number(item.unitPrice || 0);
            }
            return 0;
        });

        const selectCustomerBouquet = (item) => {
            customerOrderForm.value.bouquetType = item.itemName;
            customerOrderForm.value.quantity = 1;
            const modal = document.getElementById('customer-order-modal');
            if (modal) modal.scrollIntoView({ behavior: 'smooth' });
        };

        const updateCustomerQuantity = () => {
            let qty = Number(customerOrderForm.value.quantity) || 1;
            if (qty < 1) qty = 1;
            const max = customerMaxQuantity.value;
            if (qty > max) {
                qty = max;
                showToast(`Quantity limited to available stock (${max})`, 'warning');
            }
            customerOrderForm.value.quantity = qty;
        };

        const clearCustomerOrderForm = () => {
            customerOrderForm.value = {
                customerName: '',
                contactNumber: '',
                bouquetType: '',
                quantity: 1,
                wrappingColor: 'Soft Blush Pink',
                ribbonColor: 'Golden Satin',
                customMessage: '',
                paymentMethod: 'Cash'
            };
            clearCustomerOrderErrors();
        };

        const placeCustomerOrder = () => {
            clearCustomerOrderErrors();
            let hasError = false;

            if (!customerOrderForm.value.customerName || customerOrderForm.value.customerName.trim().length < 2) {
                customerOrderErrors.value.customerName = 'Please enter your full name (at least 2 characters)';
                hasError = true;
            }

            if (!customerOrderForm.value.contactNumber || customerOrderForm.value.contactNumber.trim().length < 7) {
                customerOrderErrors.value.contactNumber = 'Please enter a valid contact number';
                hasError = true;
            }

            if (!customerOrderForm.value.bouquetType) {
                customerOrderErrors.value.bouquetType = 'Please select a bouquet';
                hasError = true;
            }

            if (!customerOrderForm.value.quantity || customerOrderForm.value.quantity < 1) {
                customerOrderErrors.value.quantity = 'Quantity must be at least 1';
                hasError = true;
            }

            if (hasError) return;

            const item = customerSelectedBouquet.value;
            const qty = Number(customerOrderForm.value.quantity) || 1;

            if (item) {
                const stock = Number(item.stock) || 0;
                if (qty > stock) {
                    customerOrderErrors.value.quantity = `Only ${stock} items available in stock`;
                    return;
                }
                item.stock = Math.max(0, stock - qty);
                maybeNotifyLowStock(item);
            }

            const newOrderId = nextRecordId('ORD', orders.value, 105);
            const orderData = {
                id: newOrderId,
                customerName: customerOrderForm.value.customerName.trim(),
                contactNumber: customerOrderForm.value.contactNumber.trim(),
                bouquetType: customerOrderForm.value.bouquetType,
                quantity: qty,
                wrappingColor: customerOrderForm.value.wrappingColor || 'Standard Wrap',
                ribbonColor: customerOrderForm.value.ribbonColor || 'Standard Ribbon',
                price: customerTotalPrice.value,
                status: 'Pending',
                date: todayLocal(),
                customMessage: customerOrderForm.value.customMessage || '',
                paymentMethod: customerOrderForm.value.paymentMethod || 'Cash',
                isCustomerOrder: true
            };

            orders.value.unshift({ ...orderData });

            addNotification(newOrderId, `Order ${newOrderId} has been placed successfully.`, 'order', orderData.customerName);
            addNotification(newOrderId, `New order ${newOrderId} from ${orderData.customerName} — ₱${Number(orderData.price) || 0} via ${orderData.paymentMethod}`, 'order', ADMIN_NOTIFICATION_OWNER);

            placedOrderId.value = newOrderId;
            customerOrderPlaced.value = true;
            clearCustomerOrderForm();
            showToast(`Order ${newOrderId} placed successfully!`);
        };

        const resetCustomerOrderPlaced = () => {
            customerOrderPlaced.value = false;
            placedOrderId.value = '';
        };

        const trackCustomerOrder = () => {
            trackNotFound.value = false;
            trackedOrder.value = null;

            const searchId = trackSearchId.value.trim().toUpperCase();
            if (!searchId) {
                trackNotFound.value = true;
                return;
            }

            const found = orders.value.find(o => o.id.toUpperCase() === searchId);
            if (found) {
                trackedOrder.value = found;
            } else {
                trackNotFound.value = true;
            }
        };

        const getStatusStepClass = (order, step) => {
            const steps = ['Pending', 'Processing', 'Shipped', 'Completed'];
            const currentIdx = steps.indexOf(order.status);
            const stepIdx = steps.indexOf(step);
            if (stepIdx <= currentIdx) return 'step-active';
            return 'step-inactive';
        };

        // Live stock lookup (recalculated, never trusts the cart snapshot)
        const getLiveStock = (itemId) => {
            const inv = inventory.value.find(i => i.id === itemId);
            return inv ? Number(inv.stock) : 0;
        };

        // Stock available for one cart line. A custom bouquet draws from no
        // catalog pool, so it reports the safe per-order maximum instead of a
        // shop product's number.
        const cartLineStock = (line) =>
            isMadeToOrder(line) ? MADE_TO_ORDER_MAX : getLiveStock(line.itemId);

        // Live price lookup. The cart stores a price snapshot, so the
        // cart/checkout/payment screens and the charged order total must
        // all read the current inventory price — otherwise an admin
        // price edit while an item sits in a cart makes the confirmed
        // total differ from the amount actually charged.
        const getLivePrice = (cartItem) => {
            // Custom bouquets are flat-priced and never read the catalog price
            if (isMadeToOrder(cartItem)) return CUSTOM_BOUQUET_PRICE;
            const inv = inventory.value.find(i => i.id === (cartItem && cartItem.itemId));
            if (inv) return Number(inv.unitPrice) || 0;
            return Number(cartItem && cartItem.unitPrice) || 0;
        };

        // Product photo lookup — accepts an item object or an itemId string.
        // Uploaded photos are stored as data:/https URLs; seed photos are filenames
        // inside /Flower_images/. Falls back to the PRODUCT_IMAGES map when the
        // record has no image field at all.
        const getProductImage = (itemOrId) => {
            const id = typeof itemOrId === 'string' ? itemOrId : (itemOrId ? itemOrId.id : '');
            if (!id && !(itemOrId && itemOrId.image)) return '';
            const toUrl = (file) => {
                if (!file) return '';
                if (/^(data:|https?:|blob:)/i.test(file)) return file;
                // Bundled photos are stored as WebP (same base name)
                const webp = file.replace(/\.(png|jpe?g)$/i, ASSET_EXT);
                return '../Flower_images/' + webp;
            };
            // Prefer an explicit image on the passed object (e.g. the edit form preview)
            if (typeof itemOrId === 'object' && itemOrId && itemOrId.image) return toUrl(itemOrId.image);
            const record = inventory.value.find(i => i.id === id);
            if (record) {
                if (record.image !== undefined && record.image !== null) return toUrl(record.image);
                return toUrl(PRODUCT_IMAGES[id] || '');
            }
            return toUrl(PRODUCT_IMAGES[id] || '');
        };

        // Records image load failures so templates can fall back to the icon placeholder
        const imageLoadErrors = ref({});

        // --- Order line items -------------------------------------------------
        // Every order exposes its lines in one shape regardless of how it was
        // created: an explicit `items` array (multi-item admin order), the
        // customer's `cartItems` from checkout, or a legacy single-item order
        // that only stores bouquetType + quantity.
        const orderItems = (order) => {
            if (!order) return [];
            if (Array.isArray(order.items) && order.items.length > 0) return order.items;
            if (Array.isArray(order.cartItems) && order.cartItems.length > 0) return order.cartItems;
            if (order.bouquetType) {
                return [{
                    itemId: '',
                    itemName: order.bouquetType,
                    unitPrice: Number(order.price) || 0,
                    quantity: Number(order.quantity) || 1
                }];
            }
            return [];
        };

        // --- Custom bouquet creation details (customer popup + admin view) ---
        const cap = (s) => {
            const v = String(s || '');
            return v.charAt(0).toUpperCase() + v.slice(1);
        };
        const slugLabel = (s) => String(s || '').split('-').filter(Boolean).map(cap).join(' ');
        const flowerCounts = (labels) => {
            const counts = {};
            (labels || []).filter(Boolean).forEach((label) => {
                counts[label] = (counts[label] || 0) + 1;
            });
            return Object.keys(counts).map((label) => ({ label: label, n: counts[label] }));
        };
        const designFlowerLabels = (cus) => {
            if (!cus) return [];
            if (Array.isArray(cus.bouquetFlowers) && cus.bouquetFlowers.some(Boolean)) {
                return cus.bouquetFlowers.filter(Boolean);
            }
            return ((cus.bouquet && cus.bouquet.flowers) || [])
                .map((f) => cap(f.type) + ' — ' + cap(f.color));
        };

        // One entry per customized line: exactly what the customer designed.
        // Feeds both the customer's details popup and the admin's view popup
        // (flower names live here, not on the table rows).
        const orderDesigns = (order) => {
            if (!order) return [];
            const out = [];
            (order.cartItems || []).forEach((ci, idx) => {
                const cus = ci.customizations;
                if (!cus || (!cus.bouquet && !cus.bouquetFlowers)) return;
                const b = cus.bouquet || {};
                out.push({
                    key: (ci.lineId || ci.itemId || 'line') + '-' + idx,
                    itemName: ci.itemName || 'Custom Bouquet',
                    quantity: Number(ci.quantity) || 1,
                    wrapperColor: cus.wrapperColor || slugLabel(b.wrapper) || order.wrappingColor || '',
                    ribbonColor: cus.ribbonColor || slugLabel(b.ribbon) || order.ribbonColor || '',
                    flowers: flowerCounts(designFlowerLabels(cus)),
                    message: cus.message || '',
                    c: {
                        bouquet: b,
                        wrapperColor: cus.wrapperColor || slugLabel(b.wrapper),
                        ribbonColor: cus.ribbonColor || slugLabel(b.ribbon)
                    }
                });
            });
            // Legacy orders only kept the composed bouquet itself
            if (out.length === 0) {
                (order.bouquets || []).forEach((bq, idx) => {
                    const b = (bq && bq.bouquet) || {};
                    const inv = inventory.value.find((i) => i.id === bq.itemId);
                    out.push({
                        key: 'bq-' + idx,
                        itemName: inv ? inv.itemName : 'Custom Bouquet',
                        quantity: Number(order.quantity) || 1,
                        wrapperColor: slugLabel(b.wrapper) || order.wrappingColor || '',
                        ribbonColor: slugLabel(b.ribbon) || order.ribbonColor || '',
                        flowers: flowerCounts(((b.flowers) || []).map((f) => cap(f.type) + ' — ' + cap(f.color))),
                        message: '',
                        c: {
                            bouquet: b,
                            wrapperColor: slugLabel(b.wrapper),
                            ribbonColor: slugLabel(b.ribbon)
                        }
                    });
                });
            }
            return out;
        };

        // Plain catalogue lines on the same order (custom lines are already
        // described by orderDesigns).
        const nonDesignItems = (order) => {
            if (!order) return [];
            const designs = orderDesigns(order);
            return orderItems(order).filter((li) => {
                if (li.madeToOrder) return false;
                if (li.customizations && (li.customizations.bouquet || li.customizations.bouquetFlowers)) return false;
                if (designs.length > 0 && !li.itemId) return false;
                return true;
            });
        };

        // Every flower used on the whole order, with its stem count
        const orderFlowersTotal = (order) => {
            const labels = [];
            orderDesigns(order).forEach((d) => {
                d.flowers.forEach((f) => {
                    for (let i = 0; i < f.n; i++) labels.push(f.label);
                });
            });
            return flowerCounts(labels);
        };

        // Checkout bakes the quantity into bouquetType ("Roses x2"). The My
        // Orders row shows the name without that tail and puts the quantity in
        // the blue badge instead, so every quantity looks the same.
        const bouquetLabel = (order) => {
            if (!order) return '';
            const type = String(order.bouquetType || '').trim();
            const qty = Number(order.quantity) || 1;
            const m = /^(.*?)\s+x(\d+)$/i.exec(type);
            if (m && Number(m[2]) === qty) return m[1].trim();
            return type;
        };

        // Photo for a single line item. Prefers the inventory id, then falls
        // back to matching by name for orders recorded before ids existed.
        const lineItemImage = (line) => {
            if (!line) return '';
            if (line.itemId) {
                const byId = getProductImage(line.itemId);
                if (byId) return byId;
            }
            if (line.itemName) {
                const inv = inventory.value.find(i => i.itemName === line.itemName);
                if (inv) {
                    const byName = getProductImage(inv.id);
                    if (byName) return byName;
                }
            }
            return '';
        };

        // Per-src load-failure flags for order thumbnails
        const orderImageFailures = ref({});

        // Does the cart still fit inside current stock?
        const cartStockIssues = computed(() => {
            return cart.value.filter(c => !isMadeToOrder(c) && c.quantity > getLiveStock(c.itemId));
        });

        // Estimated delivery: order date + 3 days
        const getEstimatedDelivery = (order) => {
            if (!order) return '';
            if (order.status === 'Completed') return 'Delivered';
            const d = new Date(order.date + 'T00:00:00');
            d.setDate(d.getDate() + 3);
            return d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
        };

        // Timestamp when the order last entered a given status
        const getStatusTimestamp = (order, status) => {
            if (!order || !Array.isArray(order.statusHistory)) return '';
            const entry = order.statusHistory.filter(h => h.status === status).pop();
            if (!entry) return '';
            return new Date(entry.at).toLocaleString('en-PH', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
            });
        };

        const isCustomerScreen = computed(() => {
            return ['shop', 'track', 'myorders', 'cart', 'checkout', 'payment', 'profile'].includes(currentScreen.value);
        });

        // Customer's own orders (filtered by current user name)
        const myOrders = computed(() => {
            const userName = currentUser.value ? currentUser.value.name : '';
            return orders.value.filter(o => o.customerName === userName);
        });

        // Same kind of flowers bought more than once collapses into ONE
        // row: a single thumbnail with a blue "x N" count badge hanging on
        // its left edge. Every merged order stays reachable through the
        // clickable ID chips in the first column.
        const groupImageErrors = ref({});

        const groupedMyOrders = computed(() => {
            const groups = [];
            const byKind = {};
            myOrders.value.forEach((order) => {
                const name = ((order.bouquetType || '').trim()) || 'Custom Bouquet';
                const key = name.toLowerCase();
                if (!byKind[key]) {
                    byKind[key] = {
                        key: key,
                        name: name,
                        image: lineItemImage({ itemId: '', itemName: name }),
                        orders: []
                    };
                    groups.push(byKind[key]);
                }
                byKind[key].orders.push(order);
            });
            return groups.map((g) => {
                const newest = g.orders[0];
                const messages = [];
                g.orders.forEach((o) => {
                    if (o.customMessage && messages.indexOf(o.customMessage) === -1) {
                        messages.push(o.customMessage);
                    }
                });
                return {
                    key: g.key,
                    name: g.name,
                    image: g.image,
                    orders: g.orders,
                    count: g.orders.length,
                    newest: newest,
                    date: newest.date,
                    total: g.orders.reduce((sum, o) => sum + (Number(o.price) || 0), 0),
                    messages: messages
                };
            });
        });

        const orderStatusBadgeClass = (status) => ({
            'badge-pending': status === 'Pending',
            'badge-in-progress': status === 'Processing',
            'badge-completed': status === 'Shipped',
            'badge-delivered': status === 'Completed'
        });

        const viewOrderDetails = (order) => {
            selectedOrder.value = order;
        };

        // --- Customer-facing fulfillment stages ---
        // Derived from the admin-managed status (+ payment), so the shop owner
        // only ever touches the existing status controls.
        const ORDER_STAGES = ['To Pay', 'To Ship', 'To Receive', 'To Review'];
        const STAGE_ICONS = {
            'To Pay': 'fa-credit-card',
            'To Ship': 'fa-box-open',
            'To Receive': 'fa-truck-fast',
            'To Review': 'fa-star'
        };
        const getOrderStage = (order) => {
            if (!order) return '';
            if (order.status === 'Completed') return 'To Review';
            if (order.status === 'Shipped') return 'To Receive';
            if (order.paymentStatus !== 'Paid') return 'To Pay';
            return 'To Ship';
        };
        const getOrderStageIndex = (order) => ORDER_STAGES.indexOf(getOrderStage(order));

        // Status changes always notify the buyer, naming the stage they're in
        const notifyStatusChange = (order) => {
            addNotification(
                order.id,
                `Order ${order.id} is now ${order.status} — you're on the "${getOrderStage(order)}" step.`,
                'status',
                order.customerName || ''
            );
        };

        // --- Order review (unlocks once an order reaches "To Review") ---
        const reviewRating = ref(0);
        const reviewText = ref('');
        const reviewErrors = ref({});
        const setReviewRating = (star) => {
            reviewRating.value = star;
            if (reviewErrors.value.rating) delete reviewErrors.value.rating;
        };
        const submitReview = (order) => {
            const errors = {};
            if (!reviewRating.value) errors.rating = 'Please choose a star rating';
            const comment = (reviewText.value || '').trim();
            if (comment && comment.length < 3) errors.comment = 'Comment is too short (minimum 3 characters)';
            reviewErrors.value = errors;
            if (Object.keys(errors).length) return;
            order.review = {
                rating: reviewRating.value,
                comment,
                reviewer: currentUser.value ? currentUser.value.name : '',
                at: new Date().toISOString()
            };
            reviewRating.value = 0;
            reviewText.value = '';
            showToast('Thanks for your review!', 'success');
        };

        // --- Cart Functions ---
        const cartCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0));
        const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + getLivePrice(item) * item.quantity, 0));

        // Brief animation whenever an item lands in the cart
        const cartPulse = ref(false);
        let cartPulseTimer = null;
        const pulseCartBadge = () => {
            cartPulse.value = false;
            clearTimeout(cartPulseTimer);
            requestAnimationFrame(() => { cartPulse.value = true; });
            cartPulseTimer = setTimeout(() => { cartPulse.value = false; }, 700);
        };

        const addToCart = (item, customizations, qty) => {
            // Custom bouquets are made to order: no stock pool applies, so the
            // catalog item only supplies an identity and the flat price.
            const madeToOrder = !!(customizations && customizations.bouquet);
            const addQty = Math.max(1, Number(qty) || 1);
            const liveStock = madeToOrder ? MADE_TO_ORDER_MAX : getLiveStock(item.id);
            if (!madeToOrder && liveStock <= 0) {
                showToast(`${item.itemName} is out of stock`, 'error');
                return;
            }
            // Both sides must serialize the same way, otherwise a plain add never
            // matches the stored line (JSON.stringify(null) is "null", not null)
            // and the same product ends up as several single-unit lines.
            const sig = JSON.stringify(customizations || null);
            const existing = cart.value.find(c =>
                c.itemId === item.id && JSON.stringify(c.customizations || null) === sig
            );
            if (existing) {
                if (!madeToOrder && existing.quantity + addQty > liveStock) {
                    showToast(`Cannot add more. Only ${liveStock} in stock.`, 'error');
                    return;
                }
                existing.quantity += addQty;
            } else {
                const entry = {
                    lineId: item.id + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                    itemId: item.id,
                    itemName: item.itemName,
                    unitPrice: madeToOrder ? CUSTOM_BOUQUET_PRICE : (Number(item.unitPrice) || 0),
                    quantity: addQty,
                    stock: liveStock
                };
                if (customizations) entry.customizations = customizations;
                cart.value.push(entry);
            }
            pulseCartBadge();
            showToast(customizations
                ? `${item.itemName} (${customizations.wrapperColor} wrap, ${customizations.ribbonColor || 'standard'} ribbon) added to cart!`
                : `${item.itemName} added to cart!`);
        };

        const updateCartQuantity = (cartItem, newQty) => {
            const madeToOrder = isMadeToOrder(cartItem);
            const invItem = madeToOrder ? null : inventory.value.find(i => i.id === cartItem.itemId);
            const maxStock = madeToOrder
                ? MADE_TO_ORDER_MAX
                : (invItem ? Number(invItem.stock) : Number(cartItem.stock) || 0);
            let qty = Number(newQty);
            if (!Number.isFinite(qty) || qty < 1) qty = 1;
            // Only clamp down when the item is actually buyable. If stock is 0 we
            // keep qty >= 1 so the row still trips the cartStockIssues check —
            // clamping to 0 would silently let a zero-quantity line reach checkout.
            if (maxStock >= 1 && qty > maxStock) {
                qty = maxStock;
                showToast(madeToOrder
                    ? `Maximum ${MADE_TO_ORDER_MAX} custom bouquets per order`
                    : `Only ${maxStock} in stock`, 'warning');
            }
            cartItem.quantity = qty;
        };

        const removeFromCart = (key) => {
            // Prefer exact line match (customized lines share the same itemId)
            let idx = cart.value.findIndex(c => c.lineId === key);
            if (idx === -1) idx = cart.value.findIndex(c => c.itemId === key);
            if (idx !== -1) {
                const name = cart.value[idx].itemName;
                cart.value.splice(idx, 1);
                showToast(`${name} removed from cart`);
            }
        };

        const clearCart = () => {
            if (cart.value.length === 0) return;
            cart.value = [];
            showToast('Cart cleared');
        };

        const isInCart = (itemId) => {
            return cart.value.some(c => c.itemId === itemId);
        };

        // --- Cart selection (mobile-first sticky bar) ---
        // Ticking rows on the cart screen decides exactly what checkout buys.
        const cartSelected = ref([]);

        const cartLineKey = (item) => item.lineId || item.itemId;

        const isCartSelected = (key) => cartSelected.value.includes(key);

        const toggleCartSelected = (item) => {
            const key = cartLineKey(item);
            const i = cartSelected.value.indexOf(key);
            if (i === -1) cartSelected.value.push(key);
            else cartSelected.value.splice(i, 1);
        };

        const cartAllSelected = computed(() =>
            cart.value.length > 0 && cartSelected.value.length === cart.value.length
        );

        const toggleSelectAllCart = () => {
            cartSelected.value = cartAllSelected.value
                ? []
                : cart.value.map(cartLineKey);
        };

        // Drop keys whose cart lines are gone (deleted / cleared)
        watch(cart, (lines) => {
            const keys = new Set(lines.map(cartLineKey));
            cartSelected.value = cartSelected.value.filter(k => keys.has(k));
        }, { deep: true });

        const cartSelectedItems = computed(() =>
            cart.value.filter(c => cartSelected.value.includes(cartLineKey(c)))
        );

        const cartSelectedCount = computed(() =>
            cartSelectedItems.value.reduce((sum, item) => sum + item.quantity, 0)
        );

        const cartSelectedTotal = computed(() =>
            cartSelectedItems.value.reduce((sum, item) => sum + getLivePrice(item) * item.quantity, 0)
        );

        // Anything in the selection that breaks the stock rule blocks checkout
        const cartSelectedIssues = computed(() =>
            cartSelectedItems.value.filter(c => !isMadeToOrder(c) && c.quantity > getLiveStock(c.itemId))
        );

        const checkoutSelected = () => {
            if (cartSelectedItems.value.length === 0) {
                showToast('Tick at least one item to check out', 'warning');
                return;
            }
            if (cartSelectedIssues.value.length > 0) {
                showToast('Adjust the quantities that exceed stock first', 'error');
                return;
            }
            safeSetItem(sessionStorage, 'blooms_checkout_lines',
                JSON.stringify(cartSelected.value));
            navigateTo('checkout');
        };

        // The lines the checkout/payment flow actually acts on. When nothing was
        // ticked (bookmark, back button, direct link) every line is bought.
        const checkoutLines = () => {
            const ids = safeGetJSON(sessionStorage, 'blooms_checkout_lines', []);
            const picked = ids.length
                ? cart.value.filter(c => ids.includes(c.lineId || c.itemId))
                : cart.value;
            return picked.length ? picked : cart.value;
        };

        // Reactive views of the same list, for the checkout/payment summaries
        const checkoutCart = computed(() => checkoutLines());
        const checkoutCount = computed(() =>
            checkoutCart.value.reduce((sum, item) => sum + item.quantity, 0)
        );
        const checkoutSubtotal = computed(() =>
            checkoutCart.value.reduce((sum, item) => sum + getLivePrice(item) * item.quantity, 0)
        );

        // --- Swipe-to-delete on touch devices ---
        // Only the row moves. `touch-action: pan-y` in CSS keeps the browser from
        // scrolling the page sideways while the finger drags.
        const SWIPE_REVEAL = 104;
        const swipeKey = ref(null);
        const swipeDx = ref(0);
        let swipeOriginX = 0;
        let swipeOriginY = 0;
        let swipeAxis = null;

        const closeCartSwipe = () => {
            swipeKey.value = null;
            swipeDx.value = 0;
        };

        const swipeStart = (e, item) => {
            const t = e.touches && e.touches[0];
            if (!t) return;
            swipeKey.value = cartLineKey(item);
            swipeOriginX = t.clientX;
            swipeOriginY = t.clientY;
            swipeAxis = null;
            swipeDx.value = 0;
        };

        const swipeMove = (e, item) => {
            if (swipeKey.value !== cartLineKey(item)) return;
            const t = e.touches && e.touches[0];
            if (!t) return;
            const dx = t.clientX - swipeOriginX;
            const dy = t.clientY - swipeOriginY;

            // Decide once which direction owns the gesture — a vertical drag is
            // the user scrolling, so the row stays put.
            if (swipeAxis === null) {
                if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
                swipeAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
                if (swipeAxis === 'y') return;
            }
            if (swipeAxis !== 'x') return;
            if (e.cancelable) e.preventDefault();
            swipeDx.value = Math.max(-SWIPE_REVEAL, Math.min(0, dx));
        };

        const swipeEnd = (e, item) => {
            if (swipeKey.value !== cartLineKey(item)) return;
            if (swipeAxis === 'x') {
                // Past half the reveal distance, keep the delete button open
                swipeDx.value = swipeDx.value <= -SWIPE_REVEAL / 2 ? -SWIPE_REVEAL : 0;
                if (swipeDx.value === 0) swipeKey.value = null;
            } else {
                closeCartSwipe();
            }
            swipeAxis = null;
        };

        // --- Bouquet Customization (customer side) ---
        // Pick a flower, choose a wrapper color, and write a message letter.
        // Customization is free of charge — it never changes the product price.
        const WRAPPER_OPTIONS = [
            { name: 'Rose Pink', hex: '#f8a5c2' },
            { name: 'Classic White', hex: '#f1f5f9' },
            { name: 'Scarlet Red', hex: '#e11d48' },
            { name: 'Mint Green', hex: '#a7f3d0' },
            { name: 'Sky Blue', hex: '#7dd3fc' },
            { name: 'Sunset Orange', hex: '#fdba74' },
            { name: 'Elegant Black', hex: '#1e293b' },
            { name: 'Royal Purple', hex: '#c4b5fd' }
        ];

        const RIBBON_OPTIONS = [
            { name: 'White Satin', hex: '#f8fafc' },
            { name: 'Red Satin', hex: '#ef4444' },
            { name: 'Blush Pink', hex: '#fbcfe8' },
            { name: 'Gold', hex: '#fbbf24' },
            { name: 'Royal Purple', hex: '#a78bfa' },
            { name: 'Sky Blue', hex: '#38bdf8' },
            { name: 'Chocolate Brown', hex: '#92400e' },
            { name: 'Black', hex: '#111827' }
        ];

        const customForm = ref({
            wrapperColor: '',
            ribbonColor: '',
            message: '',
            quantity: 1
        });
        const customErrors = ref({});

        const selectedCustomFlower = computed(() => {
            // Price/stock come from the inventory item matching the first
            // chosen flower kind; fall back to the first catalog item.
            const first = bouquetSlots.value.find(Boolean);
            const stem = first
                ? (FLOWER_TYPE_STEMS.find(([type]) => type === first.type) || [null, first.type])[1]
                : null;
            const hit = stem && inventory.value.find(i =>
                (i.itemName || '').toLowerCase().includes(stem));
            return hit || inventory.value[0] || null;
        });

        const customizerPrice = computed(() => {
            const qty = Math.max(1, Number(customForm.value.quantity) || 1);
            return CUSTOM_BOUQUET_PRICE * qty;
        });

        const setWrapper = (name) => {
            customForm.value.wrapperColor = name;
            if (customErrors.value.wrapperColor) delete customErrors.value.wrapperColor;
        };

        const setRibbon = (name) => {
            customForm.value.ribbonColor = name;
            if (customErrors.value.ribbonColor) delete customErrors.value.ribbonColor;
        };

        // --- Bouquet live preview state (paths/geometry live at module scope) ---
        const FLOWER_TYPE_STEMS = [
            ['rose', 'rose'], ['tulip', 'tulip'], ['lily', 'lil'], ['daisy', 'dais'],
            ['sunflower', 'sunflower'], ['orchid', 'orchid'], ['peony', 'peon'],
            ['carnation', 'carnation'], ['anemone', 'anemone'], ['dahlia', 'dahlia'],
            ['ranunculus', 'ranunculus'], ['zinnia', 'zinnia']
        ];
        const FLOWER_COLOR_WORDS = [
            ['purple', ['purple', 'violet']],
            ['red', ['red', 'scarlet', 'crimson']],
            ['blue', ['blue', 'azure']],
            ['pink', ['pink', 'blush']],
            ['yellow', ['yellow', 'golden', 'sunny']],
            ['white', ['white', 'ivory']]
        ];
        const previewSlug = (name) => String(name || '').trim().toLowerCase().replace(/\s+/g, '-');

        // --- 6 flower slots (gallery picker) ---
        const FLOWER_TYPE_LIST = [
            'rose', 'tulip', 'lily', 'daisy', 'sunflower', 'orchid',
            'peony', 'carnation', 'anemone', 'dahlia', 'ranunculus', 'zinnia'
        ];
        const FLOWER_COLOR_LIST = [
            { name: 'Red', key: 'red', hex: '#e11d48' },
            { name: 'Pink', key: 'pink', hex: '#f8a5c2' },
            { name: 'Purple', key: 'purple', hex: '#a855f7' },
            { name: 'Blue', key: 'blue', hex: '#38bdf8' },
            { name: 'Yellow', key: 'yellow', hex: '#fbbf24' },
            { name: 'White', key: 'white', hex: '#f1f5f9' }
        ];
        const flowerAssetSrc = (type, color) =>
            BOUQUET_ASSET_DIR + '/flowers/' + type + '__' + color + ASSET_EXT;
        const flowerThumb = (type, color) => flowerAssetSrc(type, color);

        const bouquetSlots = ref([null, null, null, null, null, null]);
        const activeSlot = ref(0);
        const flowerBrush = ref({ type: 'rose', color: 'red' });

        const filledSlots = computed(() => bouquetSlots.value.filter(Boolean).length);
        const slotFlowerSrc = (i) => {
            const s = bouquetSlots.value[i];
            return s ? flowerAssetSrc(s.type, s.color) : '';
        };
        // Short confirmation shown under the flower picker so the customer
        // knows the tap registered and where the next flower will land.
        const flowerStatusMsg = ref('');
        let flowerStatusTimer = null;
        const flashFlowerStatus = (msg) => {
            flowerStatusMsg.value = msg;
            if (flowerStatusTimer) clearTimeout(flowerStatusTimer);
            flowerStatusTimer = setTimeout(() => { flowerStatusMsg.value = ''; }, 3000);
        };

        const placeInSlot = (i) => {
            bouquetSlots.value[i] = { type: flowerBrush.value.type, color: flowerBrush.value.color };
            if (customErrors.value.slots) delete customErrors.value.slots;
            // auto-advance to the next empty slot for fast building
            const next = bouquetSlots.value.findIndex((s, idx) => idx !== i && !s);
            activeSlot.value = next >= 0 ? next : i;
            flashFlowerStatus(next >= 0
                ? 'Flower added! Next slot selected.'
                : 'All 6 flowers selected!');
        };
        const clearSlot = (i) => {
            bouquetSlots.value[i] = null;
            activeSlot.value = i;
            flowerStatusMsg.value = '';
        };
        const clearSlots = () => {
            bouquetSlots.value = [null, null, null, null, null, null];
            activeSlot.value = 0;
            flowerStatusMsg.value = '';
        };
        const fillEmptySlots = () => {
            bouquetSlots.value = bouquetSlots.value.map((s) =>
                s || { type: flowerBrush.value.type, color: flowerBrush.value.color });
            if (customErrors.value.slots) delete customErrors.value.slots;
            activeSlot.value = bouquetSlots.value.findIndex((s) => !s);
            if (activeSlot.value < 0) activeSlot.value = 5;
            flashFlowerStatus('All 6 flowers selected!');
        };
        const slotLabel = (s) => s
            ? s.type.charAt(0).toUpperCase() + s.type.slice(1) + ' — ' +
              s.color.charAt(0).toUpperCase() + s.color.slice(1)
            : '';
        const bouquetFlowerSummary = computed(() => {
            const counts = {};
            bouquetSlots.value.forEach((s) => {
                if (!s) return;
                const k = s.type.charAt(0).toUpperCase() + s.type.slice(1);
                counts[k] = (counts[k] || 0) + 1;
            });
            return Object.entries(counts).map(([k, n]) => n + '× ' + k).join(', ');
        });
        const canAddCustom = computed(() =>
            filledSlots.value === 6 &&
            !!customForm.value.wrapperColor &&
            !!customForm.value.ribbonColor &&
            !!selectedCustomFlower.value);

        const bouquetPreview = computed(() => ({
            // preview falls back to a default look until the customer picks one
            wrapperSrc: BOUQUET_ASSET_DIR + '/wrappers/linewrap_' +
                previewSlug(customForm.value.wrapperColor || 'Rose Pink') + ASSET_EXT,
            bowSrc: BOUQUET_ASSET_DIR + '/bows/ribbonbow_' +
                previewSlug(customForm.value.ribbonColor || 'White Satin') + ASSET_EXT
        }));
        const previewHoleStyle = (hole) => ({
            left: (hole.x / PREVIEW_CANVAS * 100) + '%',
            top: (hole.y / PREVIEW_CANVAS * 100) + '%',
            width: (hole.d / PREVIEW_CANVAS * 100) + '%'
        });
        const previewLayerError = ref({});
        const markPreviewError = (layer) => {
            previewLayerError.value[layer] = true;
        };

        const addCustomToCart = () => {
            const form = customForm.value;
            const errors = {};
            const filled = bouquetSlots.value.filter(Boolean).length;
            if (filled !== 6) {
                errors.slots = `A bouquet needs exactly 6 flowers — you have chosen ${filled}/6`;
            }
            const flower = selectedCustomFlower.value;
            if (!flower) {
                errors.itemId = 'No matching flower item in inventory';
            }
            // Stock never applies here: a custom bouquet is assembled to order.
            if (!form.wrapperColor) errors.wrapperColor = 'Please choose a wrapper color';
            if (!form.ribbonColor) errors.ribbonColor = 'Please choose a ribbon color';
            if ((form.message || '').length > 200) errors.message = 'Message must be 200 characters or less';
            customErrors.value = errors;
            if (Object.keys(errors).length > 0) return;
            if (!canAddCustom.value) return;

            addToCart(flower, {
                wrapperColor: form.wrapperColor,
                ribbonColor: form.ribbonColor,
                message: (form.message || '').trim(),
                bouquetFlowers: bouquetSlots.value.map(slotLabel),
                // Structured composition so cart/checkout/payment/order pages can
                // re-render the customer's exact bouquet as a thumbnail.
                bouquet: {
                    wrapper: previewSlug(form.wrapperColor),
                    ribbon: previewSlug(form.ribbonColor),
                    flowers: bouquetSlots.value.filter(Boolean).map((s) => ({ type: s.type, color: s.color }))
                }
            }, form.quantity);

            // Reset the bouquet + letter + quantity, then head to the cart
            clearSlots();
            customForm.value.message = '';
            customForm.value.quantity = 1;
            customErrors.value = {};
            navigateTo('cart');
        };

        // --- Checkout State ---
        // Persisted to sessionStorage: the GCash flow navigates to a separate
        // payment page, and the delivery details must survive that reload.
        const checkoutForm = ref(safeGetJSON(sessionStorage, 'blooms_checkout', {
            deliveryAddress: '',
            contactNumber: '',
            paymentMethod: 'COD',
            notes: '',
            csrfToken: ''
        }));
        watch(checkoutForm, (newVal) => safeSetItem(sessionStorage, 'blooms_checkout', JSON.stringify(newVal)), { deep: true });
        const checkoutErrors = ref({});
        const checkoutSubmitting = ref(false);
        const orderConfirmOpen = ref(false);

        // --- Payment State ---
        const paymentForm = ref({
            gcashNumber: '',
            gcashReference: ''
        });
        const paymentErrors = ref({});
        const paymentSubmitting = ref(false);
        const pendingOrderId = ref('');

        // Demo GCash reference: GC + 9 digits. The real code comes from the
        // GCash receipt, but this keeps the flow testable end to end.
        const generateGcashReference = () => {
            const arr = new Uint32Array(1);
            crypto.getRandomValues(arr);
            return 'GC' + String((arr[0] % 900000000) + 100000000);
        };

        // --- Notifications ---
        // Each notification carries the owner it belongs to. The bell only ever
        // shows entries the logged-in user may see: admins get their own
        // "new order" alerts, customers see only their own orders. Without
        // this, every customer would see every other customer's updates.
        const ADMIN_NOTIFICATION_OWNER = 'admin';
        const notifications = ref(safeGetJSON(localStorage, 'blooms_notifications', []));
        const notificationsOpen = ref(false);
        watch(notifications, (newVal) => safeSetItem(localStorage, 'blooms_notifications', JSON.stringify(newVal)), { deep: true });

        // Admin visibility — mirrors the page access rules (customers are the
        // only role blocked from admin screens), so nav links and guards agree.
        const isAdminRole = computed(() => {
            if (!isLoggedIn.value || !currentUser.value) return false;
            const role = currentUser.value.role;
            return role === 'admin' || role === 'Owner & Teacher';
        });

        const visibleNotifications = computed(() => {
            if (isAdminRole.value) return notifications.value.filter(n => n.owner === ADMIN_NOTIFICATION_OWNER);
            const me = currentUser.value ? currentUser.value.name : '';
            return notifications.value.filter(n => n.owner === me);
        });

        const unreadNotifications = computed(() => visibleNotifications.value.filter(n => !n.read).length);

        const addNotification = (orderId, message, type, owner = '') => {
            notifications.value.unshift({
                id: 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                orderId,
                message,
                type,
                owner,
                read: false,
                createdAt: new Date().toISOString()
            });
        };

        // Low stock alert: at most one bell entry per item per "low episode"
        // so repeated sales while still below the threshold do not spam.
        const LOW_STOCK_THRESHOLD = 10;
        const maybeNotifyLowStock = (item) => {
            if (!item) return;
            const stock = Number(item.stock) || 0;
            if (stock < LOW_STOCK_THRESHOLD) {
                if (item.lowStockNotified) return;
                item.lowStockNotified = true;
                addNotification(item.id, `Low stock: ${item.itemName} has only ${stock} left.`, 'stock', ADMIN_NOTIFICATION_OWNER);
            } else {
                item.lowStockNotified = false;
            }
        };

        const markNotificationsRead = () => {
            const visibleIds = new Set(visibleNotifications.value.map(n => n.id));
            notifications.value.forEach(n => { if (visibleIds.has(n.id)) n.read = true; });
        };

        // Clicking a notification jumps straight to that order's status view
        const openNotification = (notif) => {
            if (!notif) return;
            notif.read = true;
            notificationsOpen.value = false;
            if (notif.orderId && orders.value.some(o => o.id === notif.orderId)) {
                safeSetItem(sessionStorage, 'blooms_open_order', notif.orderId);
                navigateTo(isAdminRole.value ? 'orders' : 'myorders');
            }
        };

        // --- Checkout Functions ---
        const generateCSRFTokens = () => {
            const arr = new Uint8Array(16);
            crypto.getRandomValues(arr);
            return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
        };

        const validateCheckout = () => {
            checkoutErrors.value = {};
            let hasError = false;
            const form = checkoutForm.value;

            if (!form.deliveryAddress || form.deliveryAddress.trim().length < 5) {
                checkoutErrors.value.deliveryAddress = 'Please enter a complete delivery address (at least 5 characters)';
                hasError = true;
            }

            if (!form.contactNumber || form.contactNumber.trim().length < 7) {
                checkoutErrors.value.contactNumber = 'Please enter a valid contact number';
                hasError = true;
            }

            if (!form.paymentMethod) {
                checkoutErrors.value.paymentMethod = 'Please select a payment method';
                hasError = true;
            }

            return !hasError;
        };

        const clearCheckoutError = (field) => {
            if (checkoutErrors.value[field]) delete checkoutErrors.value[field];
        };

        const goToPayment = () => {
            const lines = checkoutLines();
            if (lines.length === 0) {
                flashToast('Your cart is empty', 'error');
                navigateTo('shop');
                return;
            }

            if (!validateCheckout()) return;

            // Validate stock one more time before payment — only for the lines
            // being bought, and grouped by product so custom lines sharing one
            // stock pool are checked together (same rule placeOrder enforces).
            // Custom bouquets are made to order and never pass through here.
            const requested = {};
            for (const line of lines) {
                if (isMadeToOrder(line)) continue;
                const qty = Number(line.quantity);
                const live = getLiveStock(line.itemId);
                if (!Number.isFinite(qty) || qty < 1 || qty > live) {
                    showToast(`Not enough stock for ${line.itemName}`, 'error');
                    return;
                }
                requested[line.itemId] = (requested[line.itemId] || 0) + qty;
            }
            for (const itemId of Object.keys(requested)) {
                if (requested[itemId] > getLiveStock(itemId)) {
                    const inv = inventory.value.find(i => i.id === itemId);
                    showToast(`Not enough stock for ${inv ? inv.itemName : itemId}`, 'error');
                    return;
                }
            }

            // Set CSRF token
            checkoutForm.value.csrfToken = generateCSRFTokens();

            // Ask for confirmation before writing the order
            orderConfirmOpen.value = true;
        };

        const confirmOrder = () => {
            orderConfirmOpen.value = false;
            // If COD, skip payment page
            if (checkoutForm.value.paymentMethod === 'COD') {
                placeOrder('COD');
            } else {
                // GCash - go to payment page
                navigateTo('payment');
            }
        };

        const cancelOrderConfirm = () => {
            orderConfirmOpen.value = false;
        };

        // --- Cross-tab sync ---
        // The storage event fires in every OTHER tab when localStorage changes,
        // so this tab re-reads the shared records. Assign only when the data
        // really differs, so a persist-watcher write-back can't echo between tabs.
        window.addEventListener('storage', (event) => {
            if (!event.key) return;
            const resync = (target, fallback) => {
                const next = safeGetJSON(localStorage, event.key, fallback);
                if (JSON.stringify(target.value) !== JSON.stringify(next)) {
                    target.value = next;
                }
            };
            if (event.key === 'blooms_orders') resync(orders, initialOrders);
            else if (event.key === 'blooms_inventory') resync(inventory, initialInventory);
            else if (event.key === 'blooms_sales') resync(sales, initialSales);
            else if (event.key === 'blooms_cart') resync(cart, []);
            else if (event.key === 'blooms_notifications') resync(notifications, []);
            else if (event.key === 'blooms_user') {
                currentUser.value = safeGetJSON(localStorage, 'blooms_user', null) || defaultUser;
            } else if (event.key === 'blooms_logged_in') {
                isLoggedIn.value = safeGetItem(localStorage, 'blooms_logged_in') === 'true';
            }
        });

        // --- Escape closes the topmost open dialog ---
        const onEscapeKey = (event) => {
            if (event.key !== 'Escape' || event.defaultPrevented) return;
            if (confirmModal.value.show) {
                confirmModal.value.show = false;
            } else if (orderConfirmOpen.value) {
                cancelOrderConfirm();
            } else if (activeModal.value) {
                closeModal();
            } else if (customerOrderForm.value.bouquetType) {
                // The shop's quick-order form is inline, not an overlay:
                // don't wipe it while the user is typing or using a dropdown.
                const tag = document.activeElement ? document.activeElement.tagName : '';
                if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
                    clearCustomerOrderForm();
                }
            }
        };
        window.addEventListener('keydown', onEscapeKey);

        const validatePayment = () => {
            paymentErrors.value = {};
            let hasError = false;

            if (!paymentForm.value.gcashNumber || paymentForm.value.gcashNumber.trim().length < 11) {
                paymentErrors.value.gcashNumber = 'Please enter a valid GCash number (11 digits)';
                hasError = true;
            }

            if (!paymentForm.value.gcashReference || paymentForm.value.gcashReference.trim().length < 4) {
                paymentErrors.value.gcashReference = 'Please enter the GCash reference code';
                hasError = true;
            }

            return !hasError;
        };

        const clearPaymentError = (field) => {
            if (paymentErrors.value[field]) delete paymentErrors.value[field];
        };

        // Shop GCash wallet shown to customers
        const GCASH_NUMBER = '0917 890 1234';

        const copyGcashNumber = async () => {
            try {
                await navigator.clipboard.writeText(GCASH_NUMBER.replace(/\s/g, ''));
                showToast('GCash number copied to clipboard');
            } catch (e) {
                showToast('Could not copy — please copy manually: ' + GCASH_NUMBER, 'error');
            }
        };

        // Payment is "verifying" for a moment before the order write happens
        const paymentVerifying = ref(false);

        const processPayment = () => {
            if (paymentSubmitting.value) return;
            if (!validatePayment()) return;
            paymentSubmitting.value = true;
            paymentVerifying.value = true;
            // Simulate a gateway round-trip so the user sees real feedback
            setTimeout(() => {
                paymentVerifying.value = false;
                placeOrder('GCash');
            }, 1200);
        };

        // Place order: validate → save order → deduct stock → save items → clear cart → notify
        const placeOrder = (method) => {
            const userName = currentUser.value ? currentUser.value.name : '';
            if (!userName) {
                flashToast('Please log in first', 'error');
                navigateTo('login');
                return;
            }

            // Validate cart not empty
            if (cart.value.length === 0) {
                flashToast('Your cart is empty', 'error');
                navigateTo('shop');
                return;
            }

            // Only the lines ticked on the cart screen are purchased. Falling back
            // to the whole cart keeps direct /checkout links working.
            const buyLines = checkoutLines();
            if (buyLines.length === 0) {
                flashToast('No items selected for checkout', 'error');
                navigateTo('cart');
                return;
            }

            // Validate stock (recalculate on "server"). Custom bouquets are made
            // to order, so they are excluded from every stock check.
            const requestedByItem = {};
            for (const cartItem of buyLines) {
                if (isMadeToOrder(cartItem)) continue;
                const invItem = inventory.value.find(i => i.id === cartItem.itemId);
                const qty = Number(cartItem.quantity);
                if (!invItem || !Number.isFinite(qty) || qty < 1 || qty > Number(invItem.stock)) {
                    flashToast(`Not enough stock for ${cartItem.itemName}. Please adjust your cart.`, 'error');
                    navigateTo('cart');
                    return;
                }
                requestedByItem[cartItem.itemId] = (requestedByItem[cartItem.itemId] || 0) + qty;
            }

            // Customized lines of one product share a single stock pool, so the
            // combined quantity has to fit as well
            for (const itemId of Object.keys(requestedByItem)) {
                const invItem = inventory.value.find(i => i.id === itemId);
                if (invItem && requestedByItem[itemId] > Number(invItem.stock)) {
                    flashToast(`Not enough stock for ${invItem.itemName}. Please adjust your cart.`, 'error');
                    navigateTo('cart');
                    return;
                }
            }

            // Recalculate total on "server" (never trust browser)
            let serverTotal = 0;
            for (const cartItem of buyLines) {
                if (isMadeToOrder(cartItem)) {
                    serverTotal += CUSTOM_BOUQUET_PRICE * (Number(cartItem.quantity) || 1);
                    continue;
                }
                const invItem = inventory.value.find(i => i.id === cartItem.itemId);
                if (invItem) {
                    serverTotal += Number(invItem.unitPrice) * cartItem.quantity;
                }
            }

            // Distance-based delivery fee, recomputed from the destination address
            const serverDeliveryFee = DELIVERY_FEE_TIERS[getDeliveryZone(deliveryProvince.value)];
            serverTotal += serverDeliveryFee;

            checkoutSubmitting.value = true;

            // --- Transactional save (all or nothing) ---
            try {
                const newOrderId = nextRecordId('ORD', orders.value, 105);
                const today = todayLocal();

                // Wrapper & ribbon colors chosen in the bouquet customizer (per cart line)
                const chosenWrappers = [...new Set(
                    buyLines
                        .map(c => (c.customizations && c.customizations.wrapperColor) || null)
                        .filter(Boolean)
                )];
                const chosenRibbons = [...new Set(
                    buyLines
                        .map(c => (c.customizations && c.customizations.ribbonColor) || null)
                        .filter(Boolean)
                )];

                // 1. Create order record
                const orderItems = buyLines.map(c => {
                    const unit = isMadeToOrder(c) ? CUSTOM_BOUQUET_PRICE : (Number(c.unitPrice) || 0);
                    const qty = Number(c.quantity) || 1;
                    return {
                        itemId: c.itemId,
                        itemName: c.itemName,
                        unitPrice: unit,
                        quantity: qty,
                        lineTotal: unit * qty,
                        wrappingColor: (c.customizations && c.customizations.wrapperColor) || '',
                        ribbonColor: (c.customizations && c.customizations.ribbonColor) || '',
                        madeToOrder: isMadeToOrder(c)
                    };
                });

                // Preserve bouquet composition for custom lines so admin can render the preview
                const orderBouquets = buyLines
                    .filter(c => c.customizations && c.customizations.bouquet)
                    .map(c => ({
                        itemId: c.itemId,
                        bouquet: c.customizations.bouquet
                    }));

                const orderData = {
                    id: newOrderId,
                    customerName: userName,
                    contactNumber: checkoutForm.value.contactNumber.trim(),
                    deliveryAddress: checkoutForm.value.deliveryAddress.trim(),
                    items: orderItems,
                    bouquets: orderBouquets,
                    bouquetType: buyLines.map(c => `${c.itemName} x${c.quantity}`).join(', '),
                    quantity: buyLines.reduce((s, c) => s + c.quantity, 0),
                    wrappingColor: chosenWrappers.length > 0 ? chosenWrappers.join(', ') : 'Standard Wrap',
                    ribbonColor: chosenRibbons.length > 0 ? chosenRibbons.join(', ') : 'Standard Ribbon',
                    price: serverTotal,
                    subtotal: serverTotal - serverDeliveryFee,
                    deliveryFee: serverDeliveryFee,
                    status: 'Pending',
                    statusHistory: [{ status: 'Pending', at: new Date().toISOString() }],
                    paymentStatus: method === 'COD' ? 'Unpaid' : 'Paid',
                    paymentMethod: method,
                    gcashNumber: method === 'GCash' ? paymentForm.value.gcashNumber.trim() : '',
                    gcashReference: method === 'GCash' ? paymentForm.value.gcashReference.trim() : '',
                    date: today,
                    customMessage: checkoutForm.value.notes || '',
                    isCustomerOrder: true,
                    csrfToken: checkoutForm.value.csrfToken,
                    cartItems: JSON.parse(JSON.stringify(buyLines))
                };
                orders.value.unshift({ ...orderData });

                // 2. Create item records (one per product)
                // (tracked via cartItems in order)

                // 3. Deduct stock (made-to-order lines have no stock pool to draw from)
                for (const cartItem of buyLines) {
                    if (isMadeToOrder(cartItem)) continue;
                    const invItem = inventory.value.find(i => i.id === cartItem.itemId);
                    if (invItem) {
                        invItem.stock = Math.max(0, Number(invItem.stock) - cartItem.quantity);
                        maybeNotifyLowStock(invItem);
                    }
                }

                // 5. Clear only the lines that were just purchased
                const boughtKeys = new Set(buyLines.map(c => c.lineId || c.itemId));
                cart.value = cart.value.filter(c => !boughtKeys.has(c.lineId || c.itemId));
                safeSetItem(sessionStorage, 'blooms_checkout_lines', '[]');

                // 6. Write notification
                addNotification(newOrderId, `Order ${newOrderId} has been placed successfully.`, 'order', userName);
                addNotification(newOrderId, `New order ${newOrderId} from ${userName} — ₱${Number(orderData.price) || 0} via ${method}`, 'order', ADMIN_NOTIFICATION_OWNER);

                // 7. Reset forms
                checkoutForm.value = { deliveryAddress: '', contactNumber: '', paymentMethod: 'COD', notes: '', csrfToken: '' };
                paymentForm.value = { gcashNumber: '', gcashReference: '' };
                safeRemoveItem(sessionStorage, 'blooms_checkout');

                // 8. Redirect to My Orders (Track was removed from the customer side)
                pendingOrderId.value = newOrderId;
                flashToast(`Order ${newOrderId} placed successfully!`, 'success');
                navigateTo('myorders');

            } catch (e) {
                showToast('Failed to place order. Please try again.', 'error');
            } finally {
                checkoutSubmitting.value = false;
                paymentSubmitting.value = false;
            }
        };

        // --- Registration & Security Functions ---
        // Users "table" in localStorage with unique email index simulation
        // In production: use a real database with UNIQUE index on email
        const getUsers = () => safeGetJSON(localStorage, 'blooms_users', []);

        const saveUsers = (users) => safeSetItem(localStorage, 'blooms_users', JSON.stringify(users));

        // Password hashing simulation
        // In production: use Argon2id on the server (NEVER hash on client)
        // This is a demo-only SHA-256 via Web Crypto API
        const hashPassword = async (password) => {
            // Password hashing needs SubtleCrypto, which browsers only expose in a
            // secure context (https:// or localhost). Fail loudly instead of
            // throwing an opaque TypeError on a plain-http host. Returns null
            // (never '') so a failed hash can never match a stored hash —
            // an empty-string hash would authenticate with ANY password.
            if (!window.crypto || !window.crypto.subtle) {
                flashToast('Secure connection required. Please open this site with https://', 'error');
                return null;
            }
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        };

        // Demo state seeding (runs once on first load).
        //
        // Jobs:
        //   1. Keep any owner account that is already present verified.
        //   2. Make sure the demo owner below exists on this browser -
        //      fresh profile or one that already holds another admin - so
        //      the autofilled demo credentials always log in, and so the
        //      first-registrant-becomes-admin fallback in handleRegister
        //      can never fire while that account exists.
        //   3. Write the sample orders, inventory and sales to storage the
        //      first time they are missing.
        //
        // This is simulated auth: the account is written straight into
        // this browser's localStorage on first load. There is no server.
        const DEMO_OWNER_EMAIL = 'admin@bloomsbyjen.demo';
        const DEMO_OWNER_PASSWORD = 'BloomsAdmin123!';

        const buildDemoOwner = async () => {
            const createdAt = new Date().toISOString();
            return {
                id: 'USR-000',
                fullname: 'Jen',
                role: 'admin',
                country: 'PH',
                created_at: createdAt,
                firstName: 'Jen',
                lastName: '',
                name: 'Jen',
                email: DEMO_OWNER_EMAIL,
                phone: '09171234567',
                street: '123 Rose Street',
                apartment: '',
                barangay: 'Poblacion',
                province: 'Bulacan',
                city: 'City of Baliwag',
                // null when the page is not a secure context (hashPassword
                // refuses there) — never store an owner that cannot log in.
                passwordHash: await hashPassword(DEMO_OWNER_PASSWORD),
                isVerified: true,
                verificationToken: '',
                verificationTokenExpires: 0,
                csrfToken: '',
                createdAt: createdAt,
                isDemoOwner: true
            };
        };

        const seedDemoState = async () => {
            const users = getUsers();
            let changed = false;
            users.forEach((u) => {
                if (u.role === 'admin' && !u.isVerified) {
                    u.isVerified = true;
                    changed = true;
                }
            });
            // The demo owner must exist on EVERY browser, even one that
            // already holds another admin (e.g. the owner's own laptop).
            // Otherwise the autofilled demo credentials match no account
            // and login flags the email field as "Invalid email".
            const demoIdx = users.findIndex((u) => u.email === DEMO_OWNER_EMAIL);
            if (demoIdx === -1) {
                const owner = await buildDemoOwner();
                if (owner.passwordHash) {
                    users.push(owner);
                    changed = true;
                }
            } else if (users[demoIdx].isDemoOwner && window.crypto && window.crypto.subtle) {
                // Self-heal: keep the seeded owner in step with the demo
                // credentials and display name in case storage still holds
                // an older copy of this account.
                const expectedHash = await hashPassword(DEMO_OWNER_PASSWORD);
                if (expectedHash && expectedHash !== users[demoIdx].passwordHash) {
                    users[demoIdx].passwordHash = expectedHash;
                    users[demoIdx].isVerified = true;
                    changed = true;
                }
                if (users[demoIdx].name !== 'Jen' || users[demoIdx].fullname !== 'Jen' || users[demoIdx].lastName !== '') {
                    users[demoIdx].fullname = 'Jen';
                    users[demoIdx].name = 'Jen';
                    users[demoIdx].firstName = 'Jen';
                    users[demoIdx].lastName = '';
                    changed = true;
                }
            }
            if (changed) saveUsers(users);

            // Sample data: a fresh demo browser must open with the demo
            // orders, inventory and sales already in storage, not only in
            // memory. Only keys that are completely missing are filled, so
            // whatever the demo adds or edits is never overwritten.
            [['blooms_orders', initialOrders],
             ['blooms_inventory', initialInventory],
             ['blooms_sales', initialSales]].forEach(([key, initial]) => {
                if (safeGetJSON(localStorage, key, null) === null) {
                    safeSetItem(localStorage, key, JSON.stringify(initial));
                }
            });
        };

        // Rate limiting (simulated client-side)
        // In production: use server-side rate limiting (e.g. express-rate-limit)
        const MAX_REGISTER_ATTEMPTS = 5;
        const REGISTER_LOCK_SECONDS = 60;

        const getRegisterAttempts = () => safeGetJSON(localStorage, 'blooms_register_attempts', { count: 0, lockUntil: 0 });

        const checkRegisterRateLimit = () => {
            const attempts = getRegisterAttempts();
            const now = Date.now();
            if (attempts.lockUntil && now < attempts.lockUntil) {
                registerRateLimited.value = true;
                registerRateLimitSeconds.value = Math.ceil((attempts.lockUntil - now) / 1000);
                startRateLimitTimer(attempts.lockUntil);
                return false;
            }
            return true;
        };

        const recordRegisterAttempt = () => {
            const attempts = getRegisterAttempts();
            attempts.count = (attempts.count || 0) + 1;
            if (attempts.count >= MAX_REGISTER_ATTEMPTS) {
                attempts.lockUntil = Date.now() + (REGISTER_LOCK_SECONDS * 1000);
                attempts.count = 0;
                registerRateLimited.value = true;
                registerRateLimitSeconds.value = REGISTER_LOCK_SECONDS;
                startRateLimitTimer(attempts.lockUntil);
            }
            safeSetItem(localStorage, 'blooms_register_attempts', JSON.stringify(attempts));
        };

        const resetRegisterAttempts = () => {
            safeSetItem(localStorage, 'blooms_register_attempts', JSON.stringify({ count: 0, lockUntil: 0 }));
            registerRateLimited.value = false;
            registerRateLimitSeconds.value = 0;
            if (registerRateTimer) clearInterval(registerRateTimer);
        };

        const startRateLimitTimer = (lockUntil) => {
            if (registerRateTimer) clearInterval(registerRateTimer);
            registerRateTimer = setInterval(() => {
                const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
                if (remaining <= 0) {
                    registerRateLimited.value = false;
                    registerRateLimitSeconds.value = 0;
                    resetRegisterAttempts();
                    clearInterval(registerRateTimer);
                } else {
                    registerRateLimitSeconds.value = remaining;
                }
            }, 1000);
        };

        // Password requirements (spec: 8+ characters, 1 uppercase, 1 lowercase, 1 number)
        const pwChecks = computed(() => {
            const pw = registerForm.value.password || '';
            return {
                length: pw.length >= 8,
                upper: /[A-Z]/.test(pw),
                lower: /[a-z]/.test(pw),
                number: /[0-9]/.test(pw)
            };
        });

        const pwRequirementsMet = computed(() => {
            const checks = pwChecks.value;
            return checks.length && checks.upper && checks.lower && checks.number;
        });

        const pwMissingRequirements = () => {
            const checks = pwChecks.value;
            const missing = [];
            if (!checks.length) missing.push('at least 8 characters');
            if (!checks.upper) missing.push('an uppercase letter');
            if (!checks.lower) missing.push('a lowercase letter');
            if (!checks.number) missing.push('a number');
            return missing;
        };

        const isValidEmail = (email) => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        };

        // Letters-only name rule (spaces, hyphens, apostrophes, periods allowed as separators)
        const NAME_PATTERN = /^[A-Za-zÀ-ÿ]+(?:[ '\-\.][A-Za-zÀ-ÿ]+)*$/;

        // PH mobile format: 09XXXXXXXXX
        const PH_MOBILE_PATTERN = /^09\d{9}$/;

        const clearRegisterError = (field) => {
            if (registerErrors.value[field]) {
                delete registerErrors.value[field];
            }
            if (registerErrors.value.general) {
                delete registerErrors.value.general;
            }
        };

        const clearProfileError = (field) => {
            if (profileErrors.value[field]) {
                delete profileErrors.value[field];
            }
            if (profileErrors.value.general) {
                delete profileErrors.value.general;
            }
        };

        const clearPwChangeError = (field) => {
            if (pwChangeErrors.value[field]) {
                delete pwChangeErrors.value[field];
            }
            if (pwChangeErrors.value.general) {
                delete pwChangeErrors.value.general;
            }
        };

        const onPasswordInput = () => {
            clearRegisterError('password');
            if (registerForm.value.confirmPassword && registerForm.value.confirmPassword !== registerForm.value.password) {
                registerErrors.value.confirmPassword = 'Passwords do not match';
            } else {
                clearRegisterError('confirmPassword');
            }
        };

        // CSRF token (simulated)
        // In production: generate server-side, embed in form, validate on submit
        const generateCSRFToken = () => {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
        };

        // --- PH location data (PSGC): region > province > cities/municipalities ---
        // Loaded from ../JS/ph-locations.js so dropdowns only contain real LGUs
        // and the city list is always filtered by the selected province.
        const PH_LOCATION_DATA = (typeof window !== 'undefined' && window.PH_LOCATIONS) ? window.PH_LOCATIONS : {};
        const PROVINCE_INDEX = {};
        Object.keys(PH_LOCATION_DATA).forEach((regionName) => {
            Object.keys(PH_LOCATION_DATA[regionName]).forEach((provName) => {
                PROVINCE_INDEX[provName] = PH_LOCATION_DATA[regionName][provName];
            });
        });

        // Province -> region lookup (drives the distance-based delivery zones)
        const regionOfProvince = {};
        Object.keys(PH_LOCATION_DATA).forEach((regionName) => {
            Object.keys(PH_LOCATION_DATA[regionName]).forEach((provName) => {
                regionOfProvince[provName] = regionName;
            });
        });

        // --- Distance-based delivery fee (origin: Baliwag, Bulacan) ---
        // J&T-inspired zones for a standard bouquet box; adjust these amounts here.
        const DELIVERY_FEE_TIERS = {
            nearby: 160,    // Intra-Bulacan / Nearby NCR: base range 130-190
            luzon: 230,     // Rest of Luzon: base range 200-260
            visayas: 345,   // Visayas (inter-island): base range 310-380
            mindanao: 415   // Mindanao (inter-island): base range 380-450
        };
        const DELIVERY_ZONE_LABELS = {
            nearby: 'Bulacan / NCR',
            luzon: 'Rest of Luzon',
            visayas: 'Visayas',
            mindanao: 'Mindanao'
        };

        // Which province is the order going to? Read it from the typed address.
        // Philippine addresses are written least-specific last
        // ("..., City, Province"), so the place whose name ends LAST wins; ties
        // go to the longer, more specific name. Matches must sit on a word
        // boundary so short names can't hit inside longer words ("Bato" in
        // "Cotabato") and barangay names don't hijack other provinces.
        const detectDestinationProvince = (text) => {
            const addr = (text || '').toLowerCase();
            if (!addr.trim()) return '';
            let bestProvince = '';
            let bestEnd = -1;
            let bestLen = 0;
            const consider = (name, prov) => {
                const idx = addr.lastIndexOf(name);
                if (idx < 0) return;
                const before = idx === 0 ? '' : addr[idx - 1];
                const after = idx + name.length >= addr.length ? '' : addr[idx + name.length];
                if (before && /[a-z]/.test(before)) return;
                if (after && /[a-z]/.test(after)) return;
                const end = idx + name.length;
                if (end > bestEnd || (end === bestEnd && name.length > bestLen)) {
                    bestEnd = end;
                    bestLen = name.length;
                    bestProvince = prov;
                }
            };
            Object.keys(PROVINCE_INDEX).forEach((prov) => {
                consider(prov.toLowerCase(), prov);
                PROVINCE_INDEX[prov].forEach((city) => {
                    const cityLower = city.toLowerCase();
                    consider(cityLower, prov);
                    // The dataset lists component cities as "City of X",
                    // but people type the address as just "X".
                    if (cityLower.startsWith('city of ')) {
                        consider(cityLower.slice(8), prov);
                    }
                });
            });
            return bestProvince;
        };

        const getDeliveryZone = (province) => {
            if (!province) return 'nearby';
            if (province === 'Bulacan') return 'nearby';
            const region = regionOfProvince[province] || '';
            if (region.includes('National Capital Region')) return 'nearby';
            if (region.includes('Visayas')) return 'visayas';
            if (/Mindanao|Zamboanga|Davao|SOCCSKSARGEN|Caraga|Bangsamoro/.test(region)) return 'mindanao';
            return 'luzon';
        };

        // Fallback province recorded at page load from the customer's profile
        const checkoutDestinationProvince = ref('');

        const deliveryProvince = computed(() => {
            return detectDestinationProvince(checkoutForm.value.deliveryAddress) || checkoutDestinationProvince.value;
        });
        const deliveryZone = computed(() => getDeliveryZone(deliveryProvince.value));
        const deliveryFee = computed(() => DELIVERY_FEE_TIERS[deliveryZone.value]);
        const deliveryZoneLabel = computed(() => DELIVERY_ZONE_LABELS[deliveryZone.value]);
        const checkoutTotal = computed(() => checkoutSubtotal.value + deliveryFee.value);

        const provinceGroups = computed(() => Object.keys(PH_LOCATION_DATA).map((regionName) => ({
            region: regionName,
            provinces: Object.keys(PH_LOCATION_DATA[regionName])
        })));

        const cityOptions = computed(() => PROVINCE_INDEX[registerForm.value.province] || []);

        // --- Autocomplete (autosuggest) for the location fields ---
        // One factory instance per form (register, profile) so each keeps its
        // own menus, highlights, and error clearing while sharing behavior.
        const allProvinces = Object.keys(PROVINCE_INDEX).sort((a, b) => a.localeCompare(b));

        const createLocationAutocomplete = (form, clearErr) => {
            const provinceMenuOpen = ref(false);
            const cityMenuOpen = ref(false);
            const provinceHighlight = ref(-1);
            const cityHighlight = ref(-1);

            const isProvinceValid = computed(() => !!PROVINCE_INDEX[form.value.province]);

            // Case-insensitive suggestions; empty query (or an exact selection) shows the full list
            const provinceSuggestions = computed(() => {
                const raw = (form.value.province || '').trim();
                if (!raw || PROVINCE_INDEX[raw]) return allProvinces;
                const q = raw.toLowerCase();
                return allProvinces.filter(p => p.toLowerCase().includes(q));
            });

            // City suggestions only exist for the selected province
            const citySuggestions = computed(() => {
                if (!isProvinceValid.value) return [];
                const raw = (form.value.city || '').trim();
                const list = PROVINCE_INDEX[form.value.province];
                if (!raw || list.includes(raw)) return list;
                const q = raw.toLowerCase();
                return list.filter(c => c.toLowerCase().includes(q));
            });

            const selectProvince = (prov) => {
                if ((form.value.province || '') !== prov) {
                    form.value.city = '';
                    clearErr('city');
                }
                form.value.province = prov;
                clearErr('province');
                provinceMenuOpen.value = false;
                provinceHighlight.value = -1;
            };

            const selectCity = (city) => {
                form.value.city = city;
                clearErr('city');
                cityMenuOpen.value = false;
                cityHighlight.value = -1;
            };

            // Editing province text invalidates the previously chosen city
            const onProvinceInput = () => {
                clearErr('province');
                form.value.city = '';
                clearErr('city');
                provinceHighlight.value = -1;
                provinceMenuOpen.value = true;
            };

            const onCityInput = () => {
                clearErr('city');
                cityHighlight.value = -1;
                cityMenuOpen.value = true;
            };

            // Arrow keys / Enter / Escape support for both fields
            const onKeydown = (event, field) => {
                const isProvince = field === 'province';
                const open = isProvince ? provinceMenuOpen : cityMenuOpen;
                const setOpen = (v) => { if (isProvince) provinceMenuOpen.value = v; else cityMenuOpen.value = v; };
                const list = isProvince ? provinceSuggestions.value : citySuggestions.value;
                const highlight = isProvince ? provinceHighlight : cityHighlight;
                const setHighlight = (v) => { if (isProvince) provinceHighlight.value = v; else cityHighlight.value = v; };

                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    if (!open.value) {
                        setOpen(true);
                        setHighlight(0);
                        return;
                    }
                    setHighlight(Math.min(highlight.value + 1, list.length - 1));
                } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    if (open.value) setHighlight(Math.max(highlight.value - 1, 0));
                } else if (event.key === 'Enter') {
                    if (open.value && list.length) {
                        event.preventDefault();
                        const pick = list[Math.max(highlight.value, 0)];
                        if (isProvince) selectProvince(pick); else selectCity(pick);
                    }
                } else if (event.key === 'Escape') {
                    if (open.value) {
                        // Dropdown open: close just it, not a dialog behind it
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    setOpen(false);
                    setHighlight(-1);
                }
            };

            return {
                provinceMenuOpen, cityMenuOpen, provinceHighlight, cityHighlight,
                isProvinceValid, provinceSuggestions, citySuggestions,
                selectProvince, selectCity, onProvinceInput, onCityInput, onKeydown
            };
        };

        // Registration instance — names kept identical so register.html is unchanged
        const regLoc = createLocationAutocomplete(registerForm, clearRegisterError);
        const provinceMenuOpen = regLoc.provinceMenuOpen;
        const cityMenuOpen = regLoc.cityMenuOpen;
        const provinceHighlight = regLoc.provinceHighlight;
        const cityHighlight = regLoc.cityHighlight;
        const isProvinceValid = regLoc.isProvinceValid;
        const provinceSuggestions = regLoc.provinceSuggestions;
        const citySuggestions = regLoc.citySuggestions;
        const selectProvince = regLoc.selectProvince;
        const selectCity = regLoc.selectCity;
        const onProvinceInput = regLoc.onProvinceInput;
        const onCityInput = regLoc.onCityInput;
        const onAutocompleteKeydown = regLoc.onKeydown;

        // Profile instance — bound to profileForm
        const profLoc = createLocationAutocomplete(profileForm, clearProfileError);
        const profileProvinceMenuOpen = profLoc.provinceMenuOpen;
        const profileCityMenuOpen = profLoc.cityMenuOpen;
        const profileProvinceHighlight = profLoc.provinceHighlight;
        const profileCityHighlight = profLoc.cityHighlight;
        const profileIsProvinceValid = profLoc.isProvinceValid;
        const profileProvinceSuggestions = profLoc.provinceSuggestions;
        const profileCitySuggestions = profLoc.citySuggestions;
        const selectProfileProvince = profLoc.selectProvince;
        const selectProfileCity = profLoc.selectCity;
        const onProfileProvinceInput = profLoc.onProvinceInput;
        const onProfileCityInput = profLoc.onCityInput;
        const onProfileAutocompleteKeydown = profLoc.onKeydown;

        // --- Profile logic (customer) ---
        // Resolve the stored account for the logged-in session.
        const findCurrentUserRecord = () => {
            const users = getUsers();
            const session = currentUser.value || {};
            let user = null;
            if (session.email) {
                user = users.find(u => u.email === session.email);
            }
            if (!user && session.name) {
                user = users.find(u => u.name === session.name);
                if (user) {
                    // Older sessions were saved without the account email — backfill it
                    currentUser.value = { ...session, email: user.email };
                    safeSetItem(sessionStorage, 'blooms_user', JSON.stringify(currentUser.value));
                }
            }
            return user || null;
        };

        const loadProfileForm = () => {
            const user = findCurrentUserRecord();
            if (!user) {
                flashToast('Profile data could not be found. Please log in again.', 'error');
                return;
            }
            const storedName = user.name || user.fullname || '';
            const nameParts = storedName.split(' ');
            profileForm.value = {
                firstName: user.firstName || nameParts[0] || '',
                lastName: user.lastName || nameParts.slice(1).join(' ') || '',
                email: user.email || '',
                phone: user.phone || '',
                street: user.street || '',
                barangay: user.barangay || '',
                apartment: user.apartment || '',
                province: user.province || '',
                city: user.city || ''
            };
            profileMeta.value = {
                id: user.id || '',
                role: user.role || 'customer',
                country: user.country || 'PH',
                created_at: user.created_at || user.createdAt || '',
                isVerified: !!user.isVerified
            };
            profileLoaded.value = true;
        };

        const profileRoleLabel = computed(() => {
            const role = profileMeta.value.role;
            if (role === 'customer') return 'Customer';
            if (role === 'admin') return 'Owner & Teacher';
            return role || 'Customer';
        });

        const profileFullname = computed(() => {
            return ((profileForm.value.firstName || '').trim() + ' ' + (profileForm.value.lastName || '').trim()).trim();
        });

        // Same rules as registration, except password/terms; email must be
        // unique across accounts (excluding this one).
        const validateProfileForm = () => {
            profileErrors.value = {};
            let hasError = false;
            const form = profileForm.value;

            const firstName = (form.firstName || '').trim();
            if (!firstName) {
                profileErrors.value.firstName = 'First name is required';
                hasError = true;
            } else if (!NAME_PATTERN.test(firstName)) {
                profileErrors.value.firstName = 'First name must contain letters only';
                hasError = true;
            } else if (firstName.length < 2 || firstName.length > 60) {
                profileErrors.value.firstName = 'First name must be 2 to 60 characters long';
                hasError = true;
            }

            const lastName = (form.lastName || '').trim();
            if (!lastName) {
                profileErrors.value.lastName = 'Last name is required';
                hasError = true;
            } else if (!NAME_PATTERN.test(lastName)) {
                profileErrors.value.lastName = 'Last name must contain letters only';
                hasError = true;
            } else if (lastName.length > 60) {
                profileErrors.value.lastName = 'Last name must be at most 60 characters long';
                hasError = true;
            }

            if (!form.email || !form.email.trim()) {
                profileErrors.value.email = 'Email address is required';
                hasError = true;
            } else if (!isValidEmail(form.email.trim())) {
                profileErrors.value.email = 'Please enter a valid email address';
                hasError = true;
            } else {
                const users = getUsers();
                const emailTaken = users.some(u =>
                    u.id !== profileMeta.value.id &&
                    (u.email || '').toLowerCase() === form.email.trim().toLowerCase()
                );
                if (emailTaken) {
                    profileErrors.value.email = 'An account with this email already exists';
                    hasError = true;
                }
            }

            const phone = (form.phone || '').trim();
            if (!phone) {
                profileErrors.value.phone = 'Phone number is required';
                hasError = true;
            } else if (!PH_MOBILE_PATTERN.test(phone)) {
                profileErrors.value.phone = 'Phone number must be in the format 09XXXXXXXXX';
                hasError = true;
            }

            if (!(form.street || '').trim()) {
                profileErrors.value.street = 'Street address is required';
                hasError = true;
            }

            // Barangay: required for delivery routing (same rule as registration)
            if (!(form.barangay || '').trim()) {
                profileErrors.value.barangay = 'Barangay is required';
                hasError = true;
            } else if ((form.barangay || '').trim().length > 80) {
                profileErrors.value.barangay = 'Barangay must be at most 80 characters long';
                hasError = true;
            }

            if (!form.province) {
                profileErrors.value.province = 'Please select your State/Province';
                hasError = true;
            } else if (!PROVINCE_INDEX[form.province]) {
                profileErrors.value.province = 'Please select a valid State/Province from the list';
                hasError = true;
            }

            if (!form.city) {
                profileErrors.value.city = 'Please select your City/Municipality';
                hasError = true;
            } else if (!(PROVINCE_INDEX[form.province] || []).includes(form.city)) {
                profileErrors.value.city = 'Please select a valid City/Municipality for the selected State/Province';
                hasError = true;
            }

            return !hasError;
        };

        const saveProfile = async () => {
            if (!validateProfileForm()) return;

            profileSaving.value = true;
            try {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 600));

                const users = getUsers();
                const idx = users.findIndex(u => u.id === profileMeta.value.id);
                if (idx === -1) {
                    profileErrors.value.general = 'Account not found. Please log in again.';
                    return;
                }

                const form = profileForm.value;
                const email = form.email.trim().toLowerCase();

                // Race-condition guard: re-check unique email
                if (users.some((u, i) => i !== idx && (u.email || '').toLowerCase() === email)) {
                    profileErrors.value.email = 'An account with this email already exists';
                    return;
                }

                const oldName = users[idx].name || users[idx].fullname || '';
                const newName = form.firstName.trim() + ' ' + form.lastName.trim();

                users[idx] = {
                    ...users[idx],
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    name: newName,
                    fullname: newName,
                    email: email,
                    phone: form.phone.trim(),
                    street: form.street.trim(),
                    barangay: (form.barangay || '').trim(),
                    apartment: (form.apartment || '').trim(),
                    province: form.province,
                    city: form.city,
                    updatedAt: new Date().toISOString()
                };
                saveUsers(users);

                // Keep this customer's orders and notifications linked after a name change
                if (oldName && oldName !== newName) {
                    orders.value.forEach(o => { if (o.customerName === oldName) o.customerName = newName; });
                    notifications.value.forEach(n => { if (n.owner === oldName) n.owner = newName; });
                }

                // Refresh the session so nav greeting and future orders use the new name
                currentUser.value = { ...(currentUser.value || {}), name: newName, email: email };
                safeSetItem(sessionStorage, 'blooms_user', JSON.stringify(currentUser.value));

                flashToast('Profile updated successfully', 'success');
            } finally {
                profileSaving.value = false;
            }
        };

        const changePassword = async () => {
            pwChangeErrors.value = {};
            const form = pwChangeForm.value;
            let hasError = false;

            if (!form.current) {
                pwChangeErrors.value.current = 'Current password is required';
                hasError = true;
            }
            if (!form.next) {
                pwChangeErrors.value.next = 'New password is required';
                hasError = true;
            } else if (form.next.length < 6) {
                pwChangeErrors.value.next = 'New password must be at least 6 characters';
                hasError = true;
            }
            if (!form.confirm) {
                pwChangeErrors.value.confirm = 'Please confirm your new password';
                hasError = true;
            } else if (form.confirm !== form.next) {
                pwChangeErrors.value.confirm = 'Passwords do not match';
                hasError = true;
            }
            if (hasError) return;

            pwChanging.value = true;
            try {
                const users = getUsers();
                const idx = users.findIndex(u => u.id === profileMeta.value.id);
                if (idx === -1) {
                    pwChangeErrors.value.general = 'Account not found. Please log in again.';
                    return;
                }

                const currentHash = await hashPassword(form.current);
                // A null hash means hashing was unavailable (non-secure
                // origin) — never treat that as a correct password.
                if (!currentHash) {
                    pwChangeErrors.value.general = 'Password change needs a secure connection. Please open this site with https://';
                    return;
                }
                if (currentHash !== users[idx].passwordHash) {
                    pwChangeErrors.value.current = 'Current password is incorrect';
                    return;
                }

                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 400));

                const nextHash = await hashPassword(form.next);
                if (!nextHash) {
                    pwChangeErrors.value.general = 'Password change needs a secure connection. Please open this site with https://';
                    return;
                }
                users[idx].passwordHash = nextHash;
                users[idx].passwordChangedAt = new Date().toISOString();
                saveUsers(users);

                pwChangeForm.value = { current: '', next: '', confirm: '' };
                flashToast('Password changed successfully', 'success');
            } finally {
                pwChanging.value = false;
            }
        };

        if (activeScreen === 'profile' && isLoggedIn.value) {
            loadProfileForm();
        }


        const validateRegisterForm = () => {
            registerErrors.value = {};
            let hasError = false;
            const form = registerForm.value;

            // First Name: required, letters only, 2-60 characters
            const firstName = (form.firstName || '').trim();
            if (!firstName) {
                registerErrors.value.firstName = 'First name is required';
                hasError = true;
            } else if (!NAME_PATTERN.test(firstName)) {
                registerErrors.value.firstName = 'First name must contain letters only';
                hasError = true;
            } else if (firstName.length < 2 || firstName.length > 60) {
                registerErrors.value.firstName = 'First name must be 2 to 60 characters long';
                hasError = true;
            }

            // Last Name: required, letters only
            const lastName = (form.lastName || '').trim();
            if (!lastName) {
                registerErrors.value.lastName = 'Last name is required';
                hasError = true;
            } else if (!NAME_PATTERN.test(lastName)) {
                registerErrors.value.lastName = 'Last name must contain letters only';
                hasError = true;
            } else if (lastName.length > 60) {
                registerErrors.value.lastName = 'Last name must be at most 60 characters long';
                hasError = true;
            }

            // Email Address: required, must be valid + unique
            if (!form.email || !form.email.trim()) {
                registerErrors.value.email = 'Email address is required';
                hasError = true;
            } else if (!isValidEmail(form.email.trim())) {
                registerErrors.value.email = 'Please enter a valid email address';
                hasError = true;
            } else {
                // Unique email check
                const users = getUsers();
                const emailExists = users.some(u => u.email.toLowerCase() === form.email.trim().toLowerCase());
                if (emailExists) {
                    registerErrors.value.email = 'An account with this email already exists';
                    hasError = true;
                }
            }

            // Phone Number: required, format 09XXXXXXXXX
            const phone = (form.phone || '').trim();
            if (!phone) {
                registerErrors.value.phone = 'Phone number is required';
                hasError = true;
            } else if (!PH_MOBILE_PATTERN.test(phone)) {
                registerErrors.value.phone = 'Phone number must be in the format 09XXXXXXXXX';
                hasError = true;
            }

            // Street Address: required
            if (!(form.street || '').trim()) {
                registerErrors.value.street = 'Street address is required';
                hasError = true;
            }

            // Barangay: required (used for actual delivery routing)
            if (!(form.barangay || '').trim()) {
                registerErrors.value.barangay = 'Barangay is required';
                hasError = true;
            } else if ((form.barangay || '').trim().length > 80) {
                registerErrors.value.barangay = 'Barangay must be at most 80 characters long';
                hasError = true;
            }

            // Apartment/Suite: optional (no validation)

            // Province: required, must be picked from the list
            if (!form.province) {
                registerErrors.value.province = 'Please select your Province';
                hasError = true;
            } else if (!PROVINCE_INDEX[form.province]) {
                registerErrors.value.province = 'Please select a valid Province from the list';
                hasError = true;
            }

            // City/Municipality: required, must exist within the selected province
            if (!form.city) {
                registerErrors.value.city = 'Please select your City/Municipality';
                hasError = true;
            } else if (!(PROVINCE_INDEX[form.province] || []).includes(form.city)) {
                registerErrors.value.city = 'Please select a valid City/Municipality for the selected Province';
                hasError = true;
            }

            // Password: required, 8+ characters with uppercase, lowercase and a number
            if (!form.password) {
                registerErrors.value.password = 'Password is required';
                hasError = true;
            } else if (!pwRequirementsMet.value) {
                registerErrors.value.password = 'Password must include ' + pwMissingRequirements().join(', ');
                hasError = true;
            } else if (form.password.length > 64) {
                registerErrors.value.password = 'Password must be at most 64 characters long';
                hasError = true;
            }

            // Confirm password validation
            if (!form.confirmPassword) {
                registerErrors.value.confirmPassword = 'Please confirm your password';
                hasError = true;
            } else if (form.password !== form.confirmPassword) {
                registerErrors.value.confirmPassword = 'Passwords do not match';
                hasError = true;
            }

            // Terms validation
            if (!form.terms) {
                registerErrors.value.terms = 'You must agree to the Terms of Service and Privacy Policy';
                hasError = true;
            }

            return !hasError;
        };

        // A failed submit that only paints red text halfway down the page reads
        // as "the button does nothing". Send the customer to the exact field
        // that failed and put the caret in it.
        const focusFirstInvalidField = async () => {
            await nextTick();
            const scope = document.querySelector('form');
            if (!scope) return;
            const marker = scope.querySelector('.input-error') || scope.querySelector('.field-error');
            if (!marker) return;
            const group = marker.closest('.form-group') || marker.parentElement;
            const field = (marker.classList.contains('input-error') ? marker : null)
                || (group ? group.querySelector('input, select, textarea') : null)
                || marker;
            if (field && typeof field.focus === 'function') {
                field.focus({ preventScroll: true });
            }
            if (field && typeof field.scrollIntoView === 'function') {
                field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        const handleRegister = async () => {
            if (registerRateLimited.value) return;

            if (!validateRegisterForm()) {
                await focusFirstInvalidField();
                return;
            }

            registerSubmitting.value = true;

            try {
                // Rate limit check
                if (!checkRegisterRateLimit()) {
                    registerSubmitting.value = false;
                    return;
                }

                // CSRF token generation (simulated - validate server-side in production)
                const csrfToken = generateCSRFToken();

                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 800));

                const form = registerForm.value;
                const users = getUsers();

                // Double-check unique email (race condition guard)
                if (users.some(u => u.email.toLowerCase() === form.email.trim().toLowerCase())) {
                    registerErrors.value.email = 'An account with this email already exists';
                    registerSubmitting.value = false;
                    return;
                }

                // Hash password (simulated - use Argon2id on server in production)
                const passwordHash = await hashPassword(form.password);
                if (!passwordHash) {
                    registerErrors.value.general = 'Registration needs a secure connection. Please open this site with https://';
                    registerSubmitting.value = false;
                    return;
                }

                // Generate verification token
                const verificationToken = Array.from(crypto.getRandomValues(new Uint8Array(32)),
                    b => b.toString(16).padStart(2, '0')).join('');

                // Create user record
                // There is no shared user database (storage is
                // per-browser). The demo owner is seeded on first load
                // (see seedDemoState), so in practice every
                // registration is a customer. The admin slot is only
                // handed out when this browser somehow has no owner at
                // all AND this is the very first account — never to a
                // second registrant.
                const hasAdmin = users.some(u => u.role === 'admin');
                const isFirstUser = users.length === 0 && !hasAdmin;
                const firstName = form.firstName.trim();
                const lastName = form.lastName.trim();
                const createdAt = new Date().toISOString();
                const newUser = {
                    id: 'USR-' + String(users.length + 1).padStart(3, '0'),
                    // Stored automatically (no input fields for these)
                    fullname: firstName + ' ' + lastName,
                    role: isFirstUser ? 'admin' : 'customer',
                    country: 'PH',
                    created_at: createdAt,
                    // Registration fields
                    firstName: firstName,
                    lastName: lastName,
                    name: firstName + ' ' + lastName,
                    email: form.email.trim().toLowerCase(),
                    phone: form.phone.trim(),
                    street: form.street.trim(),
                    apartment: (form.apartment || '').trim(),
                    barangay: (form.barangay || '').trim(),
                    province: form.province,
                    city: form.city,
                    passwordHash: passwordHash,
                    isVerified: false,
                    verificationToken: verificationToken,
                    verificationTokenExpires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                    csrfToken: csrfToken,
                    createdAt: createdAt
                };

                // Save to users "table"
                users.push(newUser);
                saveUsers(users);

                // Reset rate limit on successful registration
                resetRegisterAttempts();

                // Store email for verification flow
                safeSetItem(sessionStorage, 'blooms_pending_verify_email', newUser.email);

                // Show success + email verification screen
                registrationSuccess.value = true;
                emailVerified.value = false;
                showToast('Account created! Please verify your email.');

            } catch (error) {
                registerErrors.value.general = 'An error occurred during registration. Please try again.';
            } finally {
                registerSubmitting.value = false;
            }
        };

        // Email verification (simulated)
        // In production: send email with verification link containing token
        const verifyEmail = () => {
            const pendingEmail = safeGetItem(sessionStorage, 'blooms_pending_verify_email');
            if (!pendingEmail) {
                showToast('No pending verification found', 'error');
                return;
            }

            const users = getUsers();
            const userIndex = users.findIndex(u => u.email === pendingEmail);
            if (userIndex === -1) {
                showToast('User not found', 'error');
                return;
            }

            if (users[userIndex].isVerified) {
                safeRemoveItem(sessionStorage, 'blooms_pending_verify_email');
                emailVerified.value = true;
                flashToast('Email already verified', 'info');
                return;
            }

            // Check token expiry
            if (users[userIndex].verificationTokenExpires < Date.now()) {
                showToast('Verification link expired. Please register again.', 'error');
                return;
            }

            // Mark as verified
            users[userIndex].isVerified = true;
            users[userIndex].verifiedAt = new Date().toISOString();
            saveUsers(users);

            safeRemoveItem(sessionStorage, 'blooms_pending_verify_email');
            emailVerified.value = true;
            flashToast('Account verified successfully! You may now log in.', 'success');
        };

        // Start a fresh registration (clears the demo verification result too)
        const registerAnother = () => {
            registrationSuccess.value = false;
            emailVerified.value = false;
            registerErrors.value = {};
            registerForm.value = {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                street: '',
                apartment: '',
                barangay: '',
                province: '',
                city: '',
                password: '',
                confirmPassword: '',
                terms: false,
                showPassword: false
            };
        };

        // Login rate limiting (simulated)
        const MAX_LOGIN_ATTEMPTS = 5;
        const LOGIN_LOCK_SECONDS = 60;

        const getLoginAttempts = () => safeGetJSON(localStorage, 'blooms_login_attempts', { count: 0, lockUntil: 0 });

        const isLoginRateLimited = () => {
            const attempts = getLoginAttempts();
            return attempts.lockUntil && Date.now() < attempts.lockUntil;
        };

        const getLoginLockRemaining = () => {
            const attempts = getLoginAttempts();
            if (!attempts.lockUntil) return 0;
            return Math.max(0, Math.ceil((attempts.lockUntil - Date.now()) / 1000));
        };

        const recordLoginAttempt = () => {
            const attempts = getLoginAttempts();
            attempts.count = (attempts.count || 0) + 1;
            if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
                attempts.lockUntil = Date.now() + (LOGIN_LOCK_SECONDS * 1000);
                attempts.count = 0;
            }
            safeSetItem(localStorage, 'blooms_login_attempts', JSON.stringify(attempts));
        };

        const resetLoginAttempts = () => {
            safeSetItem(localStorage, 'blooms_login_attempts', JSON.stringify({ count: 0, lockUntil: 0 }));
        };

        // --- Calculated Metrics ---
        const totalOrdersCount = computed(() => orders.value.length);
        const pendingOrdersCount = computed(() => orders.value.filter(o => o.status === 'Pending' || o.status === 'Processing').length);

        // COD orders awaiting payment (GCash orders are marked Paid at checkout)
        const unpaidOrdersCount = computed(() =>
            orders.value.filter(o => (o.paymentStatus || 'Unpaid') === 'Unpaid' && o.status !== 'Completed').length
        );
        const unpaidOrdersTotal = computed(() =>
            orders.value
                .filter(o => (o.paymentStatus || 'Unpaid') === 'Unpaid' && o.status !== 'Completed')
                .reduce((sum, o) => sum + (Number(o.price) || 0), 0)
        );
        const lowStockItems = computed(() => inventory.value.filter(i => Number(i.stock) < 10));
        const lowStockItemsCount = computed(() => lowStockItems.value.length);
        const totalSalesRevenue = computed(() => sales.value.reduce((sum, s) => sum + Number(s.amount), 0));
        const todaySalesRevenue = computed(() => {
            const todayStr = todayLocal();
            return sales.value
                .filter(s => s.date === todayStr)
                .reduce((sum, s) => sum + Number(s.amount), 0);
        });

        // Dynamic Reports Metrics
        const paymentMethodBreakdown = computed(() => {
            const totals = {};
            const counts = {};
            let totalAmount = 0;

            sales.value.forEach(s => {
                const amt = Number(s.amount) || 0;
                const raw = s.paymentMethod || 'Other';
                // COD is paid in cash on delivery — bucket it with
                // Cash so the report keeps its two real tenders.
                const method = raw.toLowerCase().includes('cod') ? 'Cash' : raw;
                if (method.toLowerCase().includes('bank')) return;
                totals[method] = (totals[method] || 0) + amt;
                counts[method] = (counts[method] || 0) + 1;
                totalAmount += amt;
            });

            const methodList = ['GCash', 'Cash'];
            Object.keys(totals).forEach(m => {
                if (!methodList.includes(m) && !m.toLowerCase().includes('bank')) methodList.push(m);
            });

            return methodList.map(method => {
                const amount = totals[method] || 0;
                const count = counts[method] || 0;
                const percentage = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;

                let label = method;
                let colorClass = 'text-sky-700';
                let iconClass = 'fa-solid fa-mobile-screen-button';

                if (method.toLowerCase().includes('gcash')) {
                    label = 'GCash QR Code Transfer';
                    colorClass = 'text-sky-700';
                    iconClass = 'fa-solid fa-qrcode';
                } else if (method.toLowerCase().includes('cash')) {
                    label = 'Cash Over-The-Counter';
                    colorClass = 'text-emerald-700';
                    iconClass = 'fa-solid fa-money-bill-wave';
                }

                return {
                    method,
                    label,
                    amount,
                    count,
                    percentage,
                    colorClass,
                    iconClass
                };
            });
        });

        const categoryBreakdown = computed(() => {
            const totalOrders = orders.value.length || 1;
            const counts = {};

            orders.value.forEach(o => {
                const category = o.bouquetType || 'Custom Bouquet';
                counts[category] = (counts[category] || 0) + 1;
            });

            const categories = Object.keys(counts).map(category => {
                const count = counts[category];
                const percentage = Math.round((count / totalOrders) * 100);
                return { category, count, percentage };
            });

            categories.sort((a, b) => b.count - a.count);
            return categories.slice(0, 3);
        });

        // Computed Lists
        const filteredOrders = computed(() => {
            return orders.value.filter(o => {
                const matchesSearch = o.customerName.toLowerCase().includes(orderSearch.value.toLowerCase()) ||
                                      o.bouquetType.toLowerCase().includes(orderSearch.value.toLowerCase()) ||
                                      o.id.toLowerCase().includes(orderSearch.value.toLowerCase());
                const matchesStatus = orderStatusFilter.value === 'All' || o.status === orderStatusFilter.value;
                return matchesSearch && matchesStatus;
            });
        });

        const filteredInventory = computed(() => {
            return inventory.value.filter(i => {
                const matchesSearch = i.itemName.toLowerCase().includes(inventorySearch.value.toLowerCase()) ||
                                      i.id.toLowerCase().includes(inventorySearch.value.toLowerCase());
                const matchesCategory = inventoryCategoryFilter.value === 'All' || i.category === inventoryCategoryFilter.value;
                return matchesSearch && matchesCategory;
            });
        });

        // Sale dates are YYYY-MM-DD strings; ranges compare against today
        const inSalesDateRange = (dateStr, range) => {
            if (range === 'All') return true;
            if (!dateStr) return false;
            const d = new Date(dateStr + 'T00:00:00');
            if (isNaN(d.getTime())) return false;
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (range === 'Today') return d >= today && d < new Date(today.getTime() + 86400000);
            if (range === 'Week') {
                const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
                return d >= monday && d < new Date(monday.getTime() + 7 * 86400000);
            }
            if (range === 'Month') return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
            if (range === 'Year') return d.getFullYear() === today.getFullYear();
            return true;
        };

        const filteredSales = computed(() => {
            return sales.value.filter(s => {
                const matchesSearch = s.customerName.toLowerCase().includes(salesSearch.value.toLowerCase()) ||
                                      s.id.toLowerCase().includes(salesSearch.value.toLowerCase()) ||
                                      s.paymentMethod.toLowerCase().includes(salesSearch.value.toLowerCase());
                return matchesSearch && inSalesDateRange(s.date, salesDateFilter.value);
            });
        });

        return {
            currentScreen,
            activeModal,
            viewOrder,
            isLoggedIn,
            isAdminRole,
            isMobileMenuOpen,
            toggleMobileMenu,
            currentUser,
            loginForm,
            loginErrors,
            clearLoginErrors,
            toast,
            showToast,
            orders,
            inventory,
            sales,
            orderSearch,
            orderStatusFilter,
            inventorySearch,
            inventoryCategoryFilter,
            salesSearch,
            salesDateFilter,
            orderErrors,
            itemErrors,
            saleErrors,
            clearOrderErrors,
            clearItemErrors,
            clearSaleErrors,
            confirmModal,
            showConfirm,
            isEditingOrder,
            orderForm,
            firstLineItem,
            recalcOrderTotals,
            getLineMaxStock,
            addOrderLine,
            removeOrderLine,
            updateOrderCalculatedPrice,
            isEditingItem,
            itemForm,
            isEditingSale,
            saleForm,
            navigateTo,
            handleLogin,
            fillDemoCredentials,
            handleLogout,
            openModal,
            closeModal,
            saveOrder,
            updateOrderStatus,
            requestStatusChange,
            deleteOrder,
            saveItem,
            onItemImageSelected,
            removeItemFormImage,
            deleteItem,
            saveSale,
            deleteSale,
            csvEscape,
            exportReportCSV,
            totalOrdersCount,
            pendingOrdersCount,
            unpaidOrdersCount,
            unpaidOrdersTotal,
            lowStockItems,
            lowStockItemsCount,
            totalSalesRevenue,
            todaySalesRevenue,
            paymentMethodBreakdown,
            categoryBreakdown,
            filteredOrders,
            filteredInventory,
            filteredSales,
            customerSearch,
            customerCategoryFilter,
            isCustomerMenuOpen,
            toggleCustomerMenu,
            customerOrderForm,
            customerOrderErrors,
            customerOrderPlaced,
            placedOrderId,
            clearCustomerOrderErrors,
            filteredCustomerInventory,
            shopStat,
            customerSelectedBouquet,
            customerMaxQuantity,
            customerTotalPrice,
            selectCustomerBouquet,
            updateCustomerQuantity,
            clearCustomerOrderForm,
            placeCustomerOrder,
            resetCustomerOrderPlaced,
            trackSearchId,
            trackedOrder,
            trackNotFound,
            trackCustomerOrder,
            getStatusStepClass,
            getLiveStock,
            getLivePrice,
            getProductImage,
            imageLoadErrors,
            orderItems,
            lineItemImage,
            bouquetLabel,
            orderDesigns,
            nonDesignItems,
            orderFlowersTotal,
            orderImageFailures,
            cartStockIssues,
            getEstimatedDelivery,
            getStatusTimestamp,
            isCustomerScreen,
            myOrders,
            groupedMyOrders,
            groupImageErrors,
            orderStatusBadgeClass,
            selectedOrder,
            viewOrderDetails,
            ORDER_STAGES,
            STAGE_ICONS,
            getOrderStage,
            getOrderStageIndex,
            reviewRating,
            reviewText,
            reviewErrors,
            setReviewRating,
            submitReview,
            cart,
            cartCount,
            cartTotal,
            cartPulse,
            cartSelected,
            isCartSelected,
            toggleCartSelected,
            cartAllSelected,
            toggleSelectAllCart,
            cartSelectedItems,
            cartSelectedCount,
            cartSelectedTotal,
            cartSelectedIssues,
            checkoutSelected,
            checkoutLines,
            checkoutCart,
            checkoutCount,
            checkoutSubtotal,
            swipeKey,
            swipeDx,
            swipeStart,
            swipeMove,
            swipeEnd,
            closeCartSwipe,
            addToCart,
            WRAPPER_OPTIONS,
            RIBBON_OPTIONS,
            customForm,
            customErrors,
            selectedCustomFlower,
            customizerPrice,
            CUSTOM_BOUQUET_PRICE,
            MADE_TO_ORDER_MAX,
            isMadeToOrder,
            cartLineStock,
            setWrapper,
            setRibbon,
            bouquetPreview,
            PREVIEW_HOLES,
            previewHoleStyle,
            previewLayerError,
            markPreviewError,
            FLOWER_TYPE_LIST,
            FLOWER_COLOR_LIST,
            flowerThumb,
            bouquetSlots,
            activeSlot,
            flowerBrush,
            filledSlots,
            slotFlowerSrc,
            placeInSlot,
            clearSlot,
            clearSlots,
            fillEmptySlots,
            flowerStatusMsg,
            bouquetFlowerSummary,
            canAddCustom,
            addCustomToCart,
            updateCartQuantity,
            removeFromCart,
            clearCart,
            isInCart,
            checkoutForm,
            checkoutErrors,
            checkoutSubmitting,
            clearCheckoutError,
            deliveryFee,
            deliveryZoneLabel,
            checkoutTotal,
            goToPayment,
            orderConfirmOpen,
            confirmOrder,
            cancelOrderConfirm,
            paymentForm,
            paymentErrors,
            paymentSubmitting,
            generateGcashReference,
            clearPaymentError,
            processPayment,
            GCASH_NUMBER,
            copyGcashNumber,
            paymentVerifying,
            pendingOrderId,
            notifications,
            visibleNotifications,
            notificationsOpen,
            unreadNotifications,
            markNotificationsRead,
            openNotification,
            addNotification,
            registerForm,
            registerErrors,
            registerSubmitting,
            registrationSuccess,
            emailVerified,
            registerRateLimited,
            registerRateLimitSeconds,
            pwChecks,
            pwRequirementsMet,
            clearRegisterError,
            onPasswordInput,
            provinceGroups,
            cityOptions,
            provinceSuggestions,
            citySuggestions,
            provinceMenuOpen,
            cityMenuOpen,
            provinceHighlight,
            cityHighlight,
            isProvinceValid,
            selectProvince,
            selectCity,
            onProvinceInput,
            onCityInput,
            onAutocompleteKeydown,
            profileForm,
            profileErrors,
            profileSaving,
            profileMeta,
            profileLoaded,
            profileRoleLabel,
            profileFullname,
            clearProfileError,
            saveProfile,
            profileProvinceMenuOpen,
            profileCityMenuOpen,
            profileProvinceHighlight,
            profileCityHighlight,
            profileProvinceSuggestions,
            profileCitySuggestions,
            profileIsProvinceValid,
            selectProfileProvince,
            selectProfileCity,
            onProfileProvinceInput,
            onProfileCityInput,
            onProfileAutocompleteKeydown,
            pwChangeForm,
            pwChangeErrors,
            pwChanging,
            clearPwChangeError,
            changePassword,
            handleRegister,
            verifyEmail,
            registerAnother,
            legalModal,
            openLegalModal,
            closeLegalModal
        };
    }
}).component('bouquet-thumb', BouquetThumb).mount('#app');
