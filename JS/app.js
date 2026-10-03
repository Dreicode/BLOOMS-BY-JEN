/* ==========================================================================
   Blooms by Jen - Vue 3 Multi-Page System
   ========================================================================== */

const { createApp, ref, computed, onMounted, watch } = Vue;

const getCurrentDir = () => {
    const path = window.location.pathname;
    const lastSlash = path.lastIndexOf('/');
    return lastSlash > 0 ? path.substring(0, lastSlash + 1) : '/';
};

// Set to false for production to hide demo credentials from the login form
const IS_DEMO = false;

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
    if (path.endsWith('order.html') || path.endsWith('orders.html')) return 'orders';
    if (path.endsWith('myorders.html')) return 'myorders';
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
            return BOUQUET_ASSET_DIR + '/wrappers/linewrap_' + (this.b.wrapper || 'rose-pink') + '.png';
        },
        bowSrc() {
            return BOUQUET_ASSET_DIR + '/bows/ribbonbow_' + (this.b.ribbon || 'white-satin') + '.png';
        },
        flowers() {
            const out = [];
            PREVIEW_HOLES.forEach((h, i) => {
                const f = (this.b.flowers || [])[i];
                if (!f) return;
                out.push({
                    src: BOUQUET_ASSET_DIR + '/flowers/' + f.type + '__' + f.color + '.png',
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
        
        // Session state persistence across pages
        const storedAuth = safeGetItem(sessionStorage, 'blooms_logged_in') === 'true' || safeGetItem(localStorage, 'blooms_logged_in') === 'true';
        const isLoggedIn = ref(storedAuth);
        const isMobileMenuOpen = ref(false);

        const defaultUser = { name: 'Jenelyn Ortiz', role: 'Owner & Teacher', shop: 'Blooms by Jen' };
        const storedUser = safeGetJSON(sessionStorage, 'blooms_user') || safeGetJSON(localStorage, 'blooms_user');
        const currentUser = ref(storedUser || defaultUser);

        // Login Form
        const loginForm = ref({
            email: IS_DEMO ? 'jenelyn.ortiz@bloomsbyjen.com' : '',
            password: IS_DEMO ? 'password123' : '',
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

        onMounted(() => {
            // Hide loading spinner
            const loader = document.getElementById('app-loading');
            if (loader) loader.style.display = 'none';

            // Warm the cache for the likely next pages while the user reads this one
            prefetchScreens();

            // Seed admin account on first load
            seedAdminAccount();

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
                        const parts = [account.apartment, account.street, account.city, account.province]
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
            const adminScreens = ['dashboard', 'inventory', 'sales', 'reports'];
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
        const confirmModal = ref({
            show: false,
            title: '',
            message: '',
            onConfirm: () => {}
        });

        const showConfirm = (title, message, onConfirm) => {
            confirmModal.value = { show: true, title, message, onConfirm };
        };

        // --- Form Models for Modals ---
        const isEditingOrder = ref(false);
        const originalOrderState = ref(null);
        const orderForm = ref({
            id: '',
            customerName: '',
            bouquetType: 'Custom Rose Arrangement',
            wrappingColor: 'Soft Blush Pink',
            ribbonColor: 'Golden Satin',
            price: 1500,
            status: 'Pending',
            date: new Date().toISOString().substr(0, 10),
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
            date: new Date().toISOString().substr(0, 10),
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
        const registerRateLimited = ref(false);
        const registerRateLimitSeconds = ref(0);
        let registerRateTimer = null;

        // --- Profile State (customer) ---
        // Same fields the customer filled in at registration; stored values are
        // read-only (fullname, role, country, created_at) and shown as info.
        const profileForm = ref({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            street: '',
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
            const adminScreens = ['dashboard', 'inventory', 'sales', 'reports'];

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
                loginErrors.value.email = 'Please enter a valid email';
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
                // Generic error - never reveal whether email exists
                loginErrors.value.general = 'Invalid email or password';
                recordLoginAttempt();
                return;
            }

            // Check if email is verified
            if (!registeredUser.isVerified) {
                loginErrors.value.general = 'Please verify your email address before logging in.';
                recordLoginAttempt();
                return;
            }

            // Verify password
            hashPassword(password).then(hash => {
                if (hash === registeredUser.passwordHash) {
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
                    loginErrors.value.general = 'Invalid email or password';
                    recordLoginAttempt();
                }
            });
        };

        const handleLogout = () => {
            isLoggedIn.value = false;
            isMobileMenuOpen.value = false;
            safeRemoveItem(sessionStorage, 'blooms_logged_in');
            safeRemoveItem(sessionStorage, 'blooms_user');
            safeRemoveItem(localStorage, 'blooms_logged_in');
            safeRemoveItem(localStorage, 'blooms_user');
            flashToast('Logged out successfully.', 'success');
            navigateTo('landing');
        };

        const fillDemoCredentials = () => {
            loginForm.value.email = 'jenelyn.ortiz@bloomsbyjen.com';
            loginForm.value.password = 'password123';
            showToast('Demo owner credentials populated');
        };

        // --- Modals Controller ---
        const openModal = (modalName, data = null) => {
            isMobileMenuOpen.value = false;
            activeModal.value = modalName;
            if (modalName === 'addEditOrder') {
                if (data) {
                    isEditingOrder.value = true;
                    originalOrderState.value = JSON.parse(JSON.stringify(data));
                    orderForm.value = { quantity: 1, ...data };
                } else {
                    isEditingOrder.value = false;
                    originalOrderState.value = null;
                    const defaultBouquet = inventory.value.length > 0 ? inventory.value[0].itemName : 'Custom Rose Arrangement';
                    const defaultPrice = inventory.value.length > 0 ? Number(inventory.value[0].unitPrice) : 1500;
                    orderForm.value = {
                        id: nextRecordId('ORD', orders.value, 105),
                        customerName: '',
                        bouquetType: defaultBouquet,
                        quantity: 1,
                        wrappingColor: 'Soft Blush Pink',
                        ribbonColor: 'Golden Satin',
                        price: defaultPrice,
                        status: 'Pending',
                        date: new Date().toISOString().substr(0, 10),
                        customMessage: ''
                    };
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
                        date: new Date().toISOString().substr(0, 10),
                        notes: 'Over-the-counter sale'
                    };
                }
            }
        };

        const selectedInventoryItem = computed(() => {
            return inventory.value.find(i => i.itemName === orderForm.value.bouquetType) || null;
        });

        const maxOrderQuantity = computed(() => {
            if (selectedInventoryItem.value) {
                let stock = Number(selectedInventoryItem.value.stock) || 0;
                if (isEditingOrder.value && originalOrderState.value && originalOrderState.value.bouquetType === orderForm.value.bouquetType) {
                    stock += Number(originalOrderState.value.quantity) || 1;
                }
                return Math.max(1, stock);
            }
            return 999;
        });

        const updateOrderCalculatedPrice = () => {
            const item = selectedInventoryItem.value;
            let qty = Number(orderForm.value.quantity) || 1;
            if (qty < 1) qty = 1;

            if (item) {
                const maxAllowed = maxOrderQuantity.value;
                if (qty > maxAllowed) {
                    qty = maxAllowed;
                    showToast(`Quantity set to available stock limit (${maxAllowed})`, 'warning');
                }
                orderForm.value.quantity = qty;
                // Keep the customer's delivery fee inside the recalculated total
                const fee = Number(orderForm.value.deliveryFee) || 0;
                orderForm.value.price = qty * Number(item.unitPrice || 0) + fee;
            } else {
                orderForm.value.quantity = qty;
            }
        };

        const onBouquetTypeChange = () => {
            const item = selectedInventoryItem.value;
            if (item) {
                orderForm.value.quantity = 1;
                const fee = Number(orderForm.value.deliveryFee) || 0;
                orderForm.value.price = Number(item.unitPrice || 0) + fee;
            }
        };

        const closeModal = () => {
            activeModal.value = null;
        };

        // --- Orders Actions ---
        const saveOrder = () => {
            clearOrderErrors();
            let hasError = false;

            if (!orderForm.value.customerName || orderForm.value.customerName.trim().length < 2) {
                orderErrors.value.customerName = 'Customer name must be at least 2 characters';
                hasError = true;
            }

            if (!orderForm.value.quantity || orderForm.value.quantity < 1) {
                orderErrors.value.quantity = 'Quantity must be at least 1';
                hasError = true;
            }

            if (!isEditingOrder.value) {
                const exists = orders.value.some(o => o.id === orderForm.value.id);
                if (exists) {
                    orderErrors.value.id = 'Order ID already exists';
                    hasError = true;
                }
            }

            if (hasError) return;

            const item = selectedInventoryItem.value;
            const newQty = Number(orderForm.value.quantity) || 1;

            if (isEditingOrder.value) {
                const oldOrder = originalOrderState.value || orders.value.find(o => o.id === orderForm.value.id);
                const oldBouquet = oldOrder ? oldOrder.bouquetType : orderForm.value.bouquetType;
                const oldQty = oldOrder ? (Number(oldOrder.quantity) || 1) : 1;

                if (oldBouquet === orderForm.value.bouquetType) {
                    const diff = newQty - oldQty;
                    if (item) {
                        if (diff > item.stock) {
                            showToast(`Cannot increase order quantity: requested ${diff} more units, but only ${item.stock} in stock!`, 'error');
                            return;
                        }
                        item.stock = Math.max(0, item.stock - diff);
                        maybeNotifyLowStock(item);
                    }
                } else {
                    const oldItem = inventory.value.find(i => i.itemName === oldBouquet);
                    if (oldItem) {
                        oldItem.stock += oldQty;
                        maybeNotifyLowStock(oldItem);
                    }
                    if (item) {
                        if (newQty > item.stock) {
                            showToast(`Cannot switch item: requested ${newQty} units exceeds stock (${item.stock})!`, 'error');
                            return;
                        }
                        item.stock = Math.max(0, item.stock - newQty);
                        maybeNotifyLowStock(item);
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

                // Update / sync corresponding sale record so Today's Sales reacts
                const saleIndex = sales.value.findIndex(s => s.orderId === orderForm.value.id);
                if (saleIndex !== -1) {
                    sales.value[saleIndex].amount = orderSaleAmount(orderForm.value);
                    sales.value[saleIndex].customerName = orderForm.value.customerName;
                    sales.value[saleIndex].date = orderForm.value.date;
                } else {
                    sales.value.unshift({
                        id: nextRecordId('SAL', sales.value, 501),
                        orderId: orderForm.value.id,
                        customerName: orderForm.value.customerName,
                        amount: orderSaleAmount(orderForm.value),
                        paymentMethod: 'GCash',
                        date: orderForm.value.date,
                        notes: 'Order transaction'
                    });
                }

                showToast(`Order ${orderForm.value.id} updated! Stock adjusted & Sales updated.`);
            } else {
                if (item) {
                    const stock = Number(item.stock) || 0;
                    if (newQty > stock) {
                        showToast(`Cannot place order: quantity (${newQty}) exceeds stock (${stock})!`, 'error');
                        return;
                    }
                    item.stock = Math.max(0, item.stock - newQty);
                    maybeNotifyLowStock(item);
                }

                const created = { ...orderForm.value };
                if (!Array.isArray(created.statusHistory)) {
                    created.statusHistory = [{ status: created.status || 'Pending', at: new Date().toISOString() }];
                }
                if (!created.paymentStatus) created.paymentStatus = 'Unpaid';
                orders.value.unshift(created);
                addNotification(created.id, `Order ${created.id} has been placed successfully.`, 'order', created.customerName || '');

                // Create corresponding sale record so Today's Sales reacts
                sales.value.unshift({
                    id: nextRecordId('SAL', sales.value, 501),
                    orderId: orderForm.value.id,
                    customerName: orderForm.value.customerName,
                    amount: orderSaleAmount(orderForm.value),
                    paymentMethod: 'GCash',
                    date: orderForm.value.date,
                    notes: 'Order transaction'
                });

                showToast(`New Order ${orderForm.value.id} added & stock depleted!`);
            }
            closeModal();
        };

        const updateOrderStatus = (order, newStatus) => {
            if (order.status === newStatus) return;
            order.status = newStatus;
            // Append to status history so the customer sees a real timeline
            if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
            order.statusHistory.push({ status: newStatus, at: new Date().toISOString() });
            // A completed COD order has been paid on receipt
            if (newStatus === 'Completed' && ['COD', 'Cash'].includes(order.paymentMethod)) {
                order.paymentStatus = 'Paid';
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
                () => updateOrderStatus(order, newStatus)
            );
        };

        const deleteOrder = (id) => {
            showConfirm('Delete Order', `Are you sure you want to delete order ${id}?`, () => {
                const orderToDelete = orders.value.find(o => o.id === id);
                let restored = false;
                if (orderToDelete) {
                    if (Array.isArray(orderToDelete.cartItems) && orderToDelete.cartItems.length > 0) {
                        // Customer cart order: restore each line item by its inventory ID
                        for (const line of orderToDelete.cartItems) {
                            const inv = inventory.value.find(i => i.id === line.itemId);
                            if (inv) {
                                inv.stock = Number(inv.stock) + (Number(line.quantity) || 0);
                                maybeNotifyLowStock(inv);
                                restored = true;
                            }
                        }
                    } else {
                        // Admin-created order: bouquetType is a single inventory item name
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
        const exportReportCSV = () => {
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Blooms by Jen - Sales and Inventory Summary Report\n\n";
            csvContent += "SALES TRANSACTIONS\n";
            csvContent += "Transaction ID,Order ID,Customer,Amount (PHP),Payment Method,Date,Notes\n";
            
            sales.value.forEach(s => {
                csvContent += `${s.id},${s.orderId},"${s.customerName}",${s.amount},${s.paymentMethod},${s.date},"${s.notes}"\n`;
            });

            csvContent += "\nINVENTORY STOCK MONITORING\n";
            csvContent += "Item ID,Item Name,Category,Stock Level,Unit Price (PHP)\n";
            inventory.value.forEach(i => {
                csvContent += `${i.id},"${i.itemName}",${i.category},${i.stock},${i.unitPrice}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Blooms_by_Jen_Report_${new Date().toISOString().substr(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

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
                date: new Date().toISOString().substr(0, 10),
                customMessage: customerOrderForm.value.customMessage || '',
                paymentMethod: customerOrderForm.value.paymentMethod || 'Cash',
                isCustomerOrder: true
            };

            orders.value.unshift({ ...orderData });
            sales.value.unshift({
                id: nextRecordId('SAL', sales.value, 501),
                orderId: newOrderId,
                customerName: orderData.customerName,
                amount: orderData.price,
                paymentMethod: orderData.paymentMethod,
                date: orderData.date,
                notes: 'Customer online order'
            });

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
                return '../Flower_images/' + file;
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

        // Does the cart still fit inside current stock?
        const cartStockIssues = computed(() => {
            return cart.value.filter(c => c.quantity > getLiveStock(c.itemId));
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
        const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0));

        // Brief animation whenever an item lands in the cart
        const cartPulse = ref(false);
        let cartPulseTimer = null;
        const pulseCartBadge = () => {
            cartPulse.value = false;
            clearTimeout(cartPulseTimer);
            requestAnimationFrame(() => { cartPulse.value = true; });
            cartPulseTimer = setTimeout(() => { cartPulse.value = false; }, 700);
        };

        const addToCart = (item, customizations) => {
            const liveStock = getLiveStock(item.id);
            if (liveStock <= 0) {
                showToast(`${item.itemName} is out of stock`, 'error');
                return;
            }
            const sig = customizations ? JSON.stringify(customizations) : null;
            const existing = cart.value.find(c =>
                c.itemId === item.id && JSON.stringify(c.customizations || null) === sig
            );
            if (existing) {
                if (existing.quantity >= liveStock) {
                    showToast(`Cannot add more. Only ${liveStock} in stock.`, 'error');
                    return;
                }
                existing.quantity += 1;
            } else {
                const entry = {
                    lineId: item.id + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                    itemId: item.id,
                    itemName: item.itemName,
                    unitPrice: Number(item.unitPrice) || 0,
                    quantity: 1,
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
            const invItem = inventory.value.find(i => i.id === cartItem.itemId);
            const maxStock = invItem ? Number(invItem.stock) : Number(cartItem.stock) || 0;
            let qty = Number(newQty);
            if (!Number.isFinite(qty) || qty < 1) qty = 1;
            // Only clamp down when the item is actually buyable. If stock is 0 we
            // keep qty >= 1 so the row still trips the cartStockIssues check —
            // clamping to 0 would silently let a zero-quantity line reach checkout.
            if (maxStock >= 1 && qty > maxStock) {
                qty = maxStock;
                showToast(`Only ${maxStock} in stock`, 'warning');
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
            const flower = selectedCustomFlower.value;
            if (!flower) return 0;
            const qty = Math.max(1, Number(customForm.value.quantity) || 1);
            return Number(flower.unitPrice) * qty;
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
            BOUQUET_ASSET_DIR + '/flowers/' + type + '__' + color + '.png';
        const flowerThumb = (type, color) => flowerAssetSrc(type, color);

        const bouquetSlots = ref([null, null, null, null, null, null]);
        const activeSlot = ref(0);
        const flowerBrush = ref({ type: 'rose', color: 'red' });

        const filledSlots = computed(() => bouquetSlots.value.filter(Boolean).length);
        const slotFlowerSrc = (i) => {
            const s = bouquetSlots.value[i];
            return s ? flowerAssetSrc(s.type, s.color) : '';
        };
        const placeInSlot = (i) => {
            bouquetSlots.value[i] = { type: flowerBrush.value.type, color: flowerBrush.value.color };
            if (customErrors.value.slots) delete customErrors.value.slots;
            // auto-advance to the next empty slot for fast building
            const next = bouquetSlots.value.findIndex((s, idx) => idx !== i && !s);
            activeSlot.value = next >= 0 ? next : i;
        };
        const clearSlot = (i) => {
            bouquetSlots.value[i] = null;
            activeSlot.value = i;
        };
        const clearSlots = () => {
            bouquetSlots.value = [null, null, null, null, null, null];
            activeSlot.value = 0;
        };
        const fillEmptySlots = () => {
            bouquetSlots.value = bouquetSlots.value.map((s) =>
                s || { type: flowerBrush.value.type, color: flowerBrush.value.color });
            if (customErrors.value.slots) delete customErrors.value.slots;
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
                previewSlug(customForm.value.wrapperColor || 'Rose Pink') + '.png',
            bowSrc: BOUQUET_ASSET_DIR + '/bows/ribbonbow_' +
                previewSlug(customForm.value.ribbonColor || 'White Satin') + '.png'
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
            if (flower) {
                const live = getLiveStock(flower.id);
                if (live <= 0) errors.itemId = `${flower.itemName} is out of stock`;
                else if (Number(form.quantity) > live) errors.quantity = `Only ${live} in stock`;
            } else {
                errors.itemId = 'No matching flower item in inventory';
            }
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
            });

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
            if (cart.value.length === 0) {
                flashToast('Your cart is empty', 'error');
                navigateTo('shop');
                return;
            }

            if (!validateCheckout()) return;

            // Validate stock one more time before payment.
            // Uses cartStockIssues so a deleted inventory item counts as a failure
            // too (a plain `if (invItem && ...)` would silently skip it).
            if (cartStockIssues.value.length > 0) {
                const names = cartStockIssues.value.map(c => c.itemName).join(', ');
                showToast(`Not enough stock for ${names}`, 'error');
                return;
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

            // Validate stock (recalculate on "server")
            for (const cartItem of cart.value) {
                const invItem = inventory.value.find(i => i.id === cartItem.itemId);
                const qty = Number(cartItem.quantity);
                if (!invItem || !Number.isFinite(qty) || qty < 1 || qty > Number(invItem.stock)) {
                    flashToast(`Not enough stock for ${cartItem.itemName}. Please adjust your cart.`, 'error');
                    navigateTo('cart');
                    return;
                }
            }

            // Recalculate total on "server" (never trust browser)
            let serverTotal = 0;
            for (const cartItem of cart.value) {
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
                const today = new Date().toISOString().substr(0, 10);

                // Wrapper & ribbon colors chosen in the bouquet customizer (per cart line)
                const chosenWrappers = [...new Set(
                    cart.value
                        .map(c => (c.customizations && c.customizations.wrapperColor) || null)
                        .filter(Boolean)
                )];
                const chosenRibbons = [...new Set(
                    cart.value
                        .map(c => (c.customizations && c.customizations.ribbonColor) || null)
                        .filter(Boolean)
                )];

                // 1. Create order record
                const orderData = {
                    id: newOrderId,
                    customerName: userName,
                    contactNumber: checkoutForm.value.contactNumber.trim(),
                    deliveryAddress: checkoutForm.value.deliveryAddress.trim(),
                    bouquetType: cart.value.map(c => `${c.itemName} x${c.quantity}`).join(', '),
                    quantity: cart.value.reduce((s, c) => s + c.quantity, 0),
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
                    cartItems: JSON.parse(JSON.stringify(cart.value))
                };
                orders.value.unshift({ ...orderData });

                // 2. Create item records (one per product)
                // (tracked via cartItems in order)

                // 3. Deduct stock
                for (const cartItem of cart.value) {
                    const invItem = inventory.value.find(i => i.id === cartItem.itemId);
                    if (invItem) {
                        invItem.stock = Math.max(0, Number(invItem.stock) - cartItem.quantity);
                        maybeNotifyLowStock(invItem);
                    }
                }

                // 4. Create sale record
                if (method === 'GCash') {
                    sales.value.unshift({
                        id: nextRecordId('SAL', sales.value, 501),
                        orderId: newOrderId,
                        customerName: userName,
                        amount: orderSaleAmount(orderData),
                        paymentMethod: 'GCash',
                        date: today,
                        notes: `GCash ref: ${paymentForm.value.gcashReference}`
                    });
                }

                // 5. Clear cart
                cart.value = [];

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
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        };

        // Seed admin account (runs once on first load)
        // In production: create admin via server-side seeder, never in browser
        const seedAdminAccount = async () => {
            const users = getUsers();
            const adminEmail = 'jenelyn.ortiz@bloomsbyjen.com';

            const existing = users.find(u => u.email.toLowerCase() === adminEmail);
            if (existing) {
                // Ensure the existing account has admin role
                if (existing.role !== 'admin') {
                    existing.role = 'admin';
                    existing.isVerified = true;
                    saveUsers(users);
                }
                return;
            }

            const passwordHash = await hashPassword('password123');
            users.push({
                id: 'USR-000',
                name: 'Jenelyn Ortiz',
                email: adminEmail,
                passwordHash: passwordHash,
                isVerified: true,
                verificationToken: '',
                verificationTokenExpires: 0,
                csrfToken: '',
                createdAt: new Date().toISOString(),
                role: 'admin'
            });
            saveUsers(users);
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

        // Password requirements checks (spec: minimum 6 characters)
        const pwChecks = computed(() => {
            const pw = registerForm.value.password || '';
            return {
                length: pw.length >= 6
            };
        });

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
        const checkoutTotal = computed(() => cartTotal.value + deliveryFee.value);

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
                if (currentHash !== users[idx].passwordHash) {
                    pwChangeErrors.value.current = 'Current password is incorrect';
                    return;
                }

                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 400));

                users[idx].passwordHash = await hashPassword(form.next);
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

            // Apartment/Suite: optional (no validation)

            // State/Province: required, must be picked from the list
            if (!form.province) {
                registerErrors.value.province = 'Please select your State/Province';
                hasError = true;
            } else if (!PROVINCE_INDEX[form.province]) {
                registerErrors.value.province = 'Please select a valid State/Province from the list';
                hasError = true;
            }

            // City/Municipality: required, must exist within the selected province
            if (!form.city) {
                registerErrors.value.city = 'Please select your City/Municipality';
                hasError = true;
            } else if (!(PROVINCE_INDEX[form.province] || []).includes(form.city)) {
                registerErrors.value.city = 'Please select a valid City/Municipality for the selected State/Province';
                hasError = true;
            }

            // Password: required, min 6 characters
            if (!form.password) {
                registerErrors.value.password = 'Password is required';
                hasError = true;
            } else if (form.password.length < 6) {
                registerErrors.value.password = 'Password must be at least 6 characters';
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

        const handleRegister = async () => {
            if (registerRateLimited.value) return;

            if (!validateRegisterForm()) return;

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

                // Generate verification token
                const verificationToken = Array.from(crypto.getRandomValues(new Uint8Array(32)),
                    b => b.toString(16).padStart(2, '0')).join('');

                // Create user record
                const firstName = form.firstName.trim();
                const lastName = form.lastName.trim();
                const createdAt = new Date().toISOString();
                const newUser = {
                    id: 'USR-' + String(users.length + 1).padStart(3, '0'),
                    // Stored automatically (no input fields for these)
                    fullname: firstName + ' ' + lastName,
                    role: 'customer',
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
                flashToast('Email already verified', 'info');
                navigateTo('login');
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
            flashToast('Email verified successfully! You can now log in.', 'success');
            navigateTo('login');
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
            const todayStr = new Date().toISOString().substr(0, 10);
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
                const method = s.paymentMethod || 'Other';
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

        const filteredSales = computed(() => {
            return sales.value.filter(s => {
                const matchesSearch = s.customerName.toLowerCase().includes(salesSearch.value.toLowerCase()) ||
                                      s.id.toLowerCase().includes(salesSearch.value.toLowerCase()) ||
                                      s.paymentMethod.toLowerCase().includes(salesSearch.value.toLowerCase());
                return matchesSearch;
            });
        });

        return {
            currentScreen,
            activeModal,
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
            selectedInventoryItem,
            maxOrderQuantity,
            updateOrderCalculatedPrice,
            onBouquetTypeChange,
            isEditingItem,
            itemForm,
            isEditingSale,
            saleForm,
            navigateTo,
            handleLogin,
            handleLogout,
            fillDemoCredentials,
            IS_DEMO,
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
            getProductImage,
            imageLoadErrors,
            cartStockIssues,
            getEstimatedDelivery,
            getStatusTimestamp,
            isCustomerScreen,
            myOrders,
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
            addToCart,
            WRAPPER_OPTIONS,
            RIBBON_OPTIONS,
            customForm,
            customErrors,
            selectedCustomFlower,
            customizerPrice,
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
            registerRateLimited,
            registerRateLimitSeconds,
            pwChecks,
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
            verifyEmail
        };
    }
}).component('bouquet-thumb', BouquetThumb).mount('#app');
