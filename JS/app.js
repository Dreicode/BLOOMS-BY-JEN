


const { createApp, ref, computed, onMounted, watch } = Vue;

const isInPagesDir = window.location.pathname.toLowerCase().includes('/pages/') || window.location.pathname.toLowerCase().includes('\\pages\\');

const pageMap = {
    'landing': 'landingpage.html',
    'login': 'login.html',
    'dashboard': 'dashboard.html',
    'orders': 'order.html',
    'inventory': 'inventory.html',
    'sales': 'sales.html',
    'reports': 'report.html',
    'register': 'register.html'
};

const getScreenFromPath = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith('landingpage.html') || path.endsWith('landing.html')) return 'landing';
    if (path.endsWith('login.html')) return 'login';
    if (path.endsWith('dashboard.html')) return 'dashboard';
    if (path.endsWith('order.html') || path.endsWith('orders.html')) return 'orders';
    if (path.endsWith('inventory.html')) return 'inventory';
    if (path.endsWith('sales.html')) return 'sales';
    if (path.endsWith('report.html') || path.endsWith('reports.html')) return 'reports';
    if (path.endsWith('register.html')) return 'register';
    return 'landing';
};

createApp({
    setup() {
        
        const activeScreen = getScreenFromPath();
        const currentScreen = ref(activeScreen);
        const activeModal = ref(null);
        
        
        const storedAuth = sessionStorage.getItem('blooms_logged_in') === 'true' || localStorage.getItem('blooms_logged_in') === 'true';
        const isLoggedIn = ref(storedAuth);
        const isMobileMenuOpen = ref(false);

        const storedUser = sessionStorage.getItem('blooms_user') || localStorage.getItem('blooms_user');
        const currentUser = ref(storedUser ? JSON.parse(storedUser) : { name: 'Jenelyn Ortiz', role: 'Owner & Teacher', shop: 'Blooms by Jen' });

        
        const loginForm = ref({
            email: 'jenelyn.ortiz@bloomsbyjen.com',
            password: 'password123',
            showPassword: false,
            error: ''
        });

        
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
                status: 'In Progress',
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
                status: 'Completed',
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
                status: 'Delivered',
                date: '2026-08-06',
                customMessage: 'To the best bride on her special day.'
            }
        ];

        const initialInventory = [
            { id: 'INV-001', itemName: 'Violet Dream (Purple Tulip)', category: 'Single Stems', stock: 25, unitPrice: 59 },
            { id: 'INV-002', itemName: 'Crimson Flame (Red Lily)', category: 'Single Stems', stock: 30, unitPrice: 50 },
            { id: 'INV-003', itemName: 'Azure Whisper (Blue Lily)', category: 'Single Stems', stock: 20, unitPrice: 50 },
            { id: 'INV-004', itemName: 'Golden Cheer (Sunflower Bouquet)', category: 'Mini Bouquets', stock: 15, unitPrice: 300 },
            { id: 'INV-005', itemName: 'Blush Bloom (Pink Cluster)', category: 'Mini Bouquets', stock: 12, unitPrice: 349 },
            { id: 'INV-006', itemName: 'Scarlet Passion (Red Lily Bouquet)', category: 'Mini Bouquets', stock: 10, unitPrice: 349 },
            { id: 'INV-007', itemName: 'Trio Delight (Mixed Bouquets - 3pcs)', category: 'Bundle Deals', stock: 18, unitPrice: 100 },
            { id: 'INV-008', itemName: 'Royal Romance (Red Velvet Lilies)', category: 'Premium Bouquets', stock: 14, unitPrice: 150 },
            { id: 'INV-009', itemName: 'Mystic Violet (Purple Daisies)', category: 'Premium Bouquets', stock: 16, unitPrice: 150 },
            { id: 'INV-010', itemName: 'Tulip Fantasy (Tulip Combo Box)', category: 'Premium Bouquets', stock: 15, unitPrice: 100 },
            { id: 'INV-011', itemName: 'Sunny Friends (Mini Potted Sunflowers)', category: 'Potted Arrangements', stock: 35, unitPrice: 35 },
            { id: 'INV-012', itemName: 'Garden Party (Mixed Daisies Pot)', category: 'Potted Arrangements', stock: 40, unitPrice: 35 },
            { id: 'INV-013', itemName: 'Eternal Grace (Blue/Red Lilies Box)', category: 'Potted Arrangements', stock: 10, unitPrice: 50 },
            { id: 'INV-014', itemName: 'Cascade Garland (Flower Chain)', category: 'Specialty Items', stock: 22, unitPrice: 30 },
            { id: 'INV-015', itemName: 'Bold Sunshine (Single Sunflower)', category: 'Specialty Items', stock: 28, unitPrice: 25 }
        ];

        const initialSales = [
            { id: 'SAL-501', orderId: 'ORD-104', customerName: 'Kenneth Dela Cruz', amount: 2900, paymentMethod: 'GCash', date: '2026-08-06', notes: 'Full payment via GCash QR' },
            { id: 'SAL-502', orderId: 'ORD-103', customerName: 'Clarissa Reyes', amount: 1500, paymentMethod: 'Cash', date: '2026-08-07', notes: 'Picked up in shop' },
            { id: 'SAL-503', orderId: 'ORD-100', customerName: 'Andrea Gomez', amount: 1250, paymentMethod: 'GCash', date: '2026-08-08', notes: 'GCash online transfer' }
        ];

       
        const orders = ref(JSON.parse(localStorage.getItem('blooms_orders')) || initialOrders);
        const inventory = ref(JSON.parse(localStorage.getItem('blooms_inventory')) || initialInventory);
        const sales = ref(JSON.parse(localStorage.getItem('blooms_sales')) || initialSales);

        // Sync with LocalStorage as backup
        watch(orders, (newVal) => localStorage.setItem('blooms_orders', JSON.stringify(newVal)), { deep: true });
        watch(inventory, (newVal) => localStorage.setItem('blooms_inventory', JSON.stringify(newVal)), { deep: true });
        watch(sales, (newVal) => localStorage.setItem('blooms_sales', JSON.stringify(newVal)), { deep: true });

        onMounted(() => {
          
            const protectedScreens = ['dashboard', 'orders', 'inventory', 'sales', 'reports'];
            if (protectedScreens.includes(currentScreen.value) && !isLoggedIn.value) {
                showToast('Please log in to access the system dashboard', 'info');
                const targetPage = isInPagesDir ? 'login.html' : 'Pages/login.html';
                window.location.href = targetPage;
            }
        });

     
        const orderSearch = ref('');
        const orderStatusFilter = ref('All');

        const inventorySearch = ref('');
        const inventoryCategoryFilter = ref('All');

        const salesSearch = ref('');
        const salesDateFilter = ref('All');

        
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
            orderId: 'ORD-' + Math.floor(100 + Math.random() * 900),
            customerName: '',
            amount: 1500,
            paymentMethod: 'GCash',
            date: new Date().toISOString().substr(0, 10),
            notes: 'Handcrafted bouquet transaction'
        });

        
        const navigateTo = (screen) => {
            isMobileMenuOpen.value = false;
            const protectedScreens = ['dashboard', 'orders', 'inventory', 'sales', 'reports'];
            
            if (protectedScreens.includes(screen) && !isLoggedIn.value) {
                showToast('Please log in to access the system dashboard', 'info');
                const targetLogin = isInPagesDir ? 'login.html' : 'Pages/login.html';
                window.location.href = targetLogin;
                return;
            }

            const pageFile = pageMap[screen] || 'landingpage.html';
            const targetUrl = isInPagesDir ? pageFile : `Pages/${pageFile}`;

            if (getScreenFromPath() === screen) {
                currentScreen.value = screen;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                window.location.href = targetUrl;
            }
        };

        const toggleMobileMenu = () => {
            isMobileMenuOpen.value = !isMobileMenuOpen.value;
        };

        
        const handleLogin = () => {
            if (!loginForm.value.email || !loginForm.value.password) {
                loginForm.value.error = 'Please enter both email and password.';
                return;
            }
            loginForm.value.error = '';

            if ((loginForm.value.email === 'jenelyn.ortiz@bloomsbyjen.com' || loginForm.value.email === 'demo@bloomsbyjen.com' || loginForm.value.email === 'admin@bloomsbyjen.com') &&
                (loginForm.value.password === 'password123' || loginForm.value.password === 'teacherJen2026' || loginForm.value.password === 'admin123')) {
                isLoggedIn.value = true;
                sessionStorage.setItem('blooms_logged_in', 'true');
                sessionStorage.setItem('blooms_user', JSON.stringify(currentUser.value));
                showToast('Welcome back, Ms. Jenelyn Ortiz!');
                navigateTo('dashboard');
            } else {
                loginForm.value.error = 'Invalid login credentials.';
            }
        };

        const handleLogout = () => {
            isLoggedIn.value = false;
            isMobileMenuOpen.value = false;
            sessionStorage.removeItem('blooms_logged_in');
            sessionStorage.removeItem('blooms_user');
            localStorage.removeItem('blooms_logged_in');
            localStorage.removeItem('blooms_user');
            showToast('Logged out successfully.');
            navigateTo('landing');
        };

        const fillDemoCredentials = () => {
            loginForm.value.email = 'jenelyn.ortiz@bloomsbyjen.com';
            loginForm.value.password = 'password123';
            showToast('Demo owner credentials populated');
        };

        
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
                        id: 'ORD-' + (orders.value.length + 105),
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
                } else {
                    isEditingItem.value = false;
                    itemForm.value = {
                        id: 'INV-' + String(inventory.value.length + 1).padStart(3, '0'),
                        itemName: '',
                        category: 'Single Stems',
                        stock: 25,
                        unitPrice: 120,
                        supplier: 'Benguet Valley Farm'
                    };
                }
            } else if (modalName === 'addEditSale') {
                if (data) {
                    isEditingSale.value = true;
                    saleForm.value = { ...data };
                } else {
                    isEditingSale.value = false;
                    saleForm.value = {
                        id: 'SAL-' + (sales.value.length + 505),
                        orderId: 'ORD-' + Math.floor(100 + Math.random() * 900),
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
                orderForm.value.price = qty * Number(item.unitPrice || 0);
            } else {
                orderForm.value.quantity = qty;
            }
        };

        const onBouquetTypeChange = () => {
            const item = selectedInventoryItem.value;
            if (item) {
                orderForm.value.quantity = 1;
                orderForm.value.price = Number(item.unitPrice || 0);
            }
        };

        const closeModal = () => {
            activeModal.value = null;
        };

        // --- Orders Actions ---
        const saveOrder = () => {
            if (!orderForm.value.customerName) {
                showToast('Please enter customer name', 'error');
                return;
            }

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
                    }
                } else {
                    const oldItem = inventory.value.find(i => i.itemName === oldBouquet);
                    if (oldItem) {
                        oldItem.stock += oldQty;
                    }
                    if (item) {
                        if (newQty > item.stock) {
                            showToast(`Cannot switch item: requested ${newQty} units exceeds stock (${item.stock})!`, 'error');
                            return;
                        }
                        item.stock = Math.max(0, item.stock - newQty);
                    }
                }

                const index = orders.value.findIndex(o => o.id === orderForm.value.id);
                if (index !== -1) orders.value[index] = { ...orderForm.value };

                // Update / sync corresponding sale record so Today's Sales reacts
                const saleIndex = sales.value.findIndex(s => s.orderId === orderForm.value.id);
                if (saleIndex !== -1) {
                    sales.value[saleIndex].amount = Number(orderForm.value.price) || 0;
                    sales.value[saleIndex].customerName = orderForm.value.customerName;
                    sales.value[saleIndex].date = orderForm.value.date;
                } else {
                    sales.value.unshift({
                        id: 'SAL-' + Math.floor(100 + Math.random() * 900),
                        orderId: orderForm.value.id,
                        customerName: orderForm.value.customerName,
                        amount: Number(orderForm.value.price) || 0,
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
                }

                orders.value.unshift({ ...orderForm.value });

                // Create corresponding sale record so Today's Sales reacts
                sales.value.unshift({
                    id: 'SAL-' + Math.floor(100 + Math.random() * 900),
                    orderId: orderForm.value.id,
                    customerName: orderForm.value.customerName,
                    amount: Number(orderForm.value.price) || 0,
                    paymentMethod: 'GCash',
                    date: orderForm.value.date,
                    notes: 'Order transaction'
                });

                showToast(`New Order ${orderForm.value.id} added & stock depleted!`);
            }
            closeModal();
        };

        const updateOrderStatus = (order, newStatus) => {
            order.status = newStatus;
            showToast(`Order ${order.id} status changed to ${newStatus}`);
        };

        const deleteOrder = (id) => {
            if (confirm(`Are you sure you want to delete order ${id}?`)) {
                const orderToDelete = orders.value.find(o => o.id === id);
                if (orderToDelete) {
                    const qtyToRestore = Number(orderToDelete.quantity) || 1;
                    const item = inventory.value.find(i => i.itemName === orderToDelete.bouquetType);
                    if (item) {
                        item.stock += qtyToRestore;
                    }
                }
                orders.value = orders.value.filter(o => o.id !== id);
                sales.value = sales.value.filter(s => s.orderId !== id);
                showToast(`Order ${id} deleted, stock restored & sale record updated`);
            }
        };

        
        const saveItem = () => {
            if (!itemForm.value.itemName) {
                showToast('Please enter item name', 'error');
                return;
            }

            if (isEditingItem.value) {
                const index = inventory.value.findIndex(i => i.id === itemForm.value.id);
                if (index !== -1) inventory.value[index] = { ...itemForm.value };
                showToast(`Item ${itemForm.value.itemName} updated!`);
            } else {
                inventory.value.unshift({ ...itemForm.value });
                showToast(`Item ${itemForm.value.itemName} added to stock!`);
            }
            closeModal();
        };

        const deleteItem = (id) => {
            if (confirm(`Delete item ${id} from inventory?`)) {
                inventory.value = inventory.value.filter(i => i.id !== id);
                showToast(`Item ${id} removed`);
            }
        };

        
        const saveSale = () => {
            if (!saleForm.value.customerName || !saleForm.value.amount) {
                showToast('Please fill out customer name and amount', 'error');
                return;
            }

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
            if (confirm(`Delete sale transaction ${id}?`)) {
                sales.value = sales.value.filter(s => s.id !== id);
                showToast(`Sale transaction ${id} deleted`);
            }
        };

        
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

        
        const totalOrdersCount = computed(() => orders.value.length);
        const pendingOrdersCount = computed(() => orders.value.filter(o => o.status === 'Pending' || o.status === 'In Progress').length);
        const lowStockItems = computed(() => inventory.value.filter(i => Number(i.stock) < 10));
        const lowStockItemsCount = computed(() => lowStockItems.value.length);
        const totalSalesRevenue = computed(() => sales.value.reduce((sum, s) => sum + Number(s.amount), 0));
        const todaySalesRevenue = computed(() => {
            const todayStr = new Date().toISOString().substr(0, 10);
            return sales.value
                .filter(s => s.date === todayStr)
                .reduce((sum, s) => sum + Number(s.amount), 0);
        });

       
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
            isMobileMenuOpen,
            toggleMobileMenu,
            currentUser,
            loginForm,
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
            openModal,
            closeModal,
            saveOrder,
            updateOrderStatus,
            deleteOrder,
            saveItem,
            deleteItem,
            saveSale,
            deleteSale,
            exportReportCSV,
            totalOrdersCount,
            pendingOrdersCount,
            lowStockItems,
            lowStockItemsCount,
            totalSalesRevenue,
            todaySalesRevenue,
            paymentMethodBreakdown,
            categoryBreakdown,
            filteredOrders,
            filteredInventory,
            filteredSales
        };
    }
}).mount('#app');
