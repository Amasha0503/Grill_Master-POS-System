// ================= LOGIN ===================== //

document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;   // <-- Prevent login code from running on other pages

    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const role = document.getElementById("role-cashier").checked ? "cashier" : "admin";

        if (role === "cashier") {
            location.href = "cashier.html";
        } else {
            location.href = "admin.html";
        }
    });
});


const CART_KEY = 'gm_cart_v1';
const ORDERS_KEY = 'gm_orders_v1';

let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
let orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];


// Helpers
const saveCart = () => localStorage.setItem(CART_KEY, JSON.stringify(cart));
const formatPrice = v => Number(v).toFixed(2);
const saveOrders = () => localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

// Add item (increase if exists)
function addToCart(name, price) {
    price = parseFloat(price);
    const idx = cart.findIndex(i => i.name === name && i.price === price);
    if (idx > -1) cart[idx].quantity += 1;
    else cart.push({ name, price, quantity: 1 });
    saveCart();
    renderCart();
}

// Remove item by index
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

// Change qty (delta can be negative)
function changeQuantity(index, delta) {
    if (!cart[index]) return;
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    saveCart();
    renderCart();
}

function cartTotals() {
    const itemsCount = cart.reduce((s, i) => s + i.quantity, 0);
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    return { itemsCount, total: formatPrice(total) };
}

function renderCart() {
    const cartEmptyEl = document.getElementById('cart-empty');
    const cartItemsEl = document.getElementById('cart-items');
    const headerEl = document.querySelector('.cart .card-header');

    if (!cartItemsEl || !cartEmptyEl || !headerEl) return;

    if (cart.length === 0) {
        cartEmptyEl.style.display = 'block';
        cartItemsEl.style.display = 'none';
        headerEl.innerHTML = `
      <h5 class="card-title mb-0"><span class="me-2">🛒</span> Current Order</h5>
    `;
        return;
    }

    cartEmptyEl.style.display = 'none';
    cartItemsEl.style.display = 'block';
    cartItemsEl.innerHTML = '';

    // header with badge
    const { itemsCount, total } = cartTotals();
    headerEl.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <h5 class="card-title mb-0"><span class="me-2">🛒</span> Current Order</h5>
      <span class="badge rounded-pill" style="background:#f67318;color:#fff;padding:6px 12px;font-size:0.95rem;">${itemsCount}</span>
    </div>
  `;

    // items
    cart.forEach((it, i) => {
        const li = document.createElement('li');
        li.className = 'list-group-item px-3 py-3';
        li.style.borderBottom = '1px solid #f1f1f1';
        li.innerHTML = `
      <div class="row align-items-center gx-2">
        <div class="col-5">
          <h6 class="mb-1 fw-bold" style="color:#212529">${it.name}</h6>
          <small class="text-body-secondary">Rs.${formatPrice(it.price)}<br>each</small>
        </div>
        <div class="col-7 d-flex justify-content-end align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary rounded-2" data-action="decrease" data-index="${i}" style="padding:4px 8px;">−</button>
          <span class="fw-bold">${it.quantity}</span>
          <button class="btn btn-sm rounded-circle add-qty" data-action="increase" data-index="${i}" style="background:#f67318;color:#fff;border:none;width:28px;height:28px;padding:0;display:flex;align-items:center;justify-content:center;">+</button>
          <span class="fw-bold" style="color:#212529">Rs.${formatPrice(it.price * it.quantity)}</span>
          <button class="btn btn-sm btn-outline-danger rounded-2" data-action="remove" data-index="${i}" style="padding:4px 8px;color:#dc3545;">🗑️</button>
        </div>
      </div>
    `;
        cartItemsEl.appendChild(li);
    });

    // total row
    const totalLi = document.createElement('li');
    totalLi.className = 'list-group-item px-3 py-3';
    totalLi.style.borderTop = '2px solid #e9ecef';
    totalLi.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <span class="fw-bold" style="font-size:1.05rem;color:#212529">Total</span>
      <span class="fw-bold" style="font-size:1.4rem;color:#f67318">Rs.${total}</span>
    </div>
  `;
    cartItemsEl.appendChild(totalLi);
}

// Event delegation for add buttons on menu and for cart action buttons
document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.btn-add-cart');
    if (addBtn) {
        e.preventDefault();
        const name = addBtn.getAttribute('data-name') || addBtn.dataset.name;
        const price = addBtn.getAttribute('data-price') || addBtn.dataset.price;
        if (name && price) addToCart(name, price);
        return;
    }

    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn && actionBtn.dataset.index !== undefined) {
        const idx = parseInt(actionBtn.dataset.index, 10);
        const act = actionBtn.dataset.action;
        if (act === 'increase') changeQuantity(idx, 1);
        if (act === 'decrease') changeQuantity(idx, -1);
        if (act === 'remove') removeFromCart(idx);
    }
});


// Checkout button (show payment modal using Bootstrap)
document.addEventListener('click', (e) => {
    const cb = e.target.closest('.checkout-btn');
    if (!cb) return;
    if (cart.length === 0) {
        alert('Cart is empty');
        return;
    }

    // Update modal with current total
    const { total } = cartTotals();
    document.getElementById('modal-total').textContent = `Rs.${total}`;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    modal.show();
});





// Generate unique IDs and order numbers
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function generateOrderNumber() {
    return 'ORD-' + Date.now().toString().slice(-6);
}

// Order CRUD operations
function createOrder(orderPayload) {
    const id = generateId();
    const orderNumber = generateOrderNumber();

    const newOrder = {
        id,
        orderNumber,
        items: orderPayload.items || [],
        total: orderPayload.total || '0.00',
        customerName: orderPayload.customerName || '',
        customerPhone: orderPayload.customerPhone || '',
        paymentMethod: orderPayload.paymentMethod || 'cash',
        status: orderPayload.status || 'paid',
        createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    saveOrders();
    return newOrder;
}

function getOrders() {
    return orders.slice();
}

function getOrderById(id) {
    return orders.find(o => o.id === id) || null;
}


// Expose order store for global access
window.OrderStore = {
    createOrder,
    getOrders,
    getOrderById,
};


// CUSTOMER STORAGE & OPERATIONS
const CUSTOMERKEY = 'gmcustomersv1';
let customers = JSON.parse(localStorage.getItem(CUSTOMERKEY)) || [];
console.log("Customers loaded:");

// Save customers to localStorage
function saveCustomers() {
    localStorage.setItem(CUSTOMERKEY, JSON.stringify(customers));
    console.log("Customers saved:");
}

// Add/Update customer from completed order
function addCustomerFromOrder(order) {
    const customerIndex = customers.findIndex(c => c.phoneNo === order.customerPhone);
    
    if (customerIndex !== -1) {
        // Update existing customer
        customers[customerIndex].orders.push(order.orderNumber);
        customers[customerIndex].totalSpent = (parseFloat(customers[customerIndex].totalSpent) + parseFloat(order.total)).toFixed(2);
        customers[customerIndex].lastOrder = order.orderNumber;
    } else {
        // Create new customer
        const newCustomer = {
            name: order.customerName,
            phoneNo: order.customerPhone,
            orders: [order.orderNumber],
            totalSpent: order.total,
            lastOrder: order.orderNumber,
            createdAt: new Date().toISOString()
        };
        customers.push(newCustomer);
    }
    saveCustomers();
}

// Get all customers
function getAllCustomers() {
    return customers.slice();
}

// Get customer by phone
function getCustomerByPhone(phoneNo) {
    return customers.find(c => c.phoneNo === phoneNo) || null;
}

// Get customer's orders list
function getCustomerOrders(phoneNo) {
    const customer = getCustomerByPhone(phoneNo);
    if (!customer || !customer.orders) return [];
    return orders.filter(order => customer.orders.includes(order.orderNumber));
}

// Get total spent by customer
function getCustomerTotalSpent(phoneNo) {
    const customerOrders = getCustomerOrders(phoneNo);
    return customerOrders.reduce((sum, order) => sum + parseFloat(order.total), 0).toFixed(2);
}

window.CustomerStore = {
    addCustomerFromOrder,
    getAllCustomers,
    getCustomerByPhone,
    getCustomerOrders,
    getCustomerTotalSpent
};

// Render customers table from CustomerStore (using template)


function renderCustomersTable(filter = '') {
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  const cust = window.CustomerStore ? window.CustomerStore.getAllCustomers() : customers;
  const filtered = cust.filter(cust => 
    (cust.name.toLowerCase().includes(filter.toLowerCase()) ||
    cust.orders.some(o => o.toLowerCase().includes(filter.toLowerCase())) || 
     cust.phoneNo.toLowerCase().includes(filter.toLowerCase()))
  );
  
  const template = document.getElementById('customerRowTemplate');
  
  filtered.forEach(cust => {
    const clone = template.content.cloneNode(true);
    clone.querySelector('.name').textContent = cust.name;
    clone.querySelector('.phoneNo').textContent = cust.phoneNo;
    clone.querySelector('.orders').textContent = cust.orders.join(', ');
    clone.querySelector('.totalSpent').textContent = `Rs.${Number(cust.totalSpent).toFixed(2)}`;
    
    
    tbody.appendChild(clone);
    console.log("js loaded!");
  });
}








// Single payment confirmation handler (no duplicates)
let paymentProcessing = false;

document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirm-payment-btn');

    if (confirmBtn) {
        confirmBtn.addEventListener('click', handlePaymentConfirmation);
    }

    renderCart();
});

function handlePaymentConfirmation(e) {
    // Prevent duplicate processing
    if (paymentProcessing) return;
    paymentProcessing = true;

    try {
        const nameEl = document.getElementById('customer-name');
        const phoneEl = document.getElementById('customer-phone');
        const paymentInput = document.querySelector('input[name="payment"]:checked');

        const name = nameEl ? nameEl.value.trim() : '';
        const phone = phoneEl ? phoneEl.value.trim() : '';
        const paymentMethod = paymentInput ? paymentInput.value : 'cash';

        // Validate inputs
        if (!name || !phone) {
            alert('Please fill in all fields');
            paymentProcessing = false;
            return;
        }

        // Build complete order object
        const totals = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderPayload = {
            items: cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            total: formatPrice(totals),
            customerName: name,
            customerPhone: phone,
            paymentMethod: paymentMethod,
            status: 'paid'
        };

        //-----------------------------------------------------------------------------------------------------------------------//
        


        // Create and save order to orders array
        const savedOrder = createOrder(orderPayload);

        //Save customer from order (NEW WORKING VERSION)
        addCustomerFromOrder(savedOrder);

        // Refresh customer table if on admin page
        if (document.getElementById('customersTableBody')) {
            renderCustomersTable();
        }


        // Clear cart
        cart = [];
        saveCart();
        renderCart();

        // Close modal
        const modalInst = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
        if (modalInst) modalInst.hide();

        // Reset form fields
        if (nameEl) nameEl.value = '';
        if (phoneEl) phoneEl.value = '';

        // Single success message with order details
        alert(
            `✓ Order Completed Successfully!\n\n` +
            `Order Number: ${savedOrder.orderNumber}\n` +
            `Total: Rs.${savedOrder.total}\n` +
            `Customer: ${savedOrder.customerName}\n` +
            `Payment: ${savedOrder.paymentMethod}`
        );

    } catch (error) {
        console.error('Payment processing error:', error);
        alert('An error occurred while processing the payment. Please try again.');
    } finally {
        paymentProcessing = false;
    }
}




// ...existing code...------------------------------------------------------------------------------------------------------------------

// Menu store for CRUD operations (persisted to localStorage)
const MENU_KEY = 'gm_menu_v1';

// ensure a generator function exists (reuse existing generateId if present)
const _genId = (typeof generateId === 'function') ? generateId : () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

let menu = JSON.parse(localStorage.getItem(MENU_KEY)) || (function seedMenu(){
  const seeded = [
    { id: _genId(), name: 'Cheeseburger', category: 'Burger', price: 1850.00, image: 'assets/images/cheeseburger.png', status: 'Available' },
    { id: _genId(), name: 'Chicken Burger', category: 'Burger', price: 1950.00, image: 'assets/images/chickenburger.png', status: 'Available' },
    { id: _genId(), name: 'Smash Burger', category: 'Burger', price: 2250.00, image: 'assets/images/smashburger.png', status: 'Available' },
    { id: _genId(), name: 'Turkey Burger', category: 'Burger', price: 1650.00, image: 'assets/images/turkeyburger.png', status: 'Available' },
    { id: _genId(), name: 'Meat Burger', category: 'Burger', price: 2450.00, image: 'assets/images/meatburger.png', status: 'Available' },
    { id: _genId(), name: 'Mushroom Burger', category: 'Burger', price: 1550.00, image: 'assets/images/mushroomburger.png', status: 'Available' },

    { id: _genId(), name: 'Chicken Nuggets (4 pieces)', category: 'Side', price: 1300.00, image: 'assets/images/chickennuggets.jpg', status: 'Available' },
    { id: _genId(), name: 'French Fries', category: 'Side', price: 950.00, image: 'assets/images/frenchfries.png', status: 'Available' },
    { id: _genId(), name: 'Chilli Cheese Loaded Fries', category: 'Side', price: 1450.00, image: 'assets/images/loadedfries.jpg', status: 'Available' },
    { id: _genId(), name: 'Crispy Onion Rings', category: 'Side', price: 850.00, image: 'assets/images/onionrings.jpg', status: 'Available' },

    { id: _genId(), name: 'Coke (500 ml)', category: 'Drink', price: 400.00, image: 'assets/images/coke3.jpg', status: 'Available' },
    { id: _genId(), name: 'Pepsi (500 ml)', category: 'Drink', price: 400.00, image: 'assets/images/pepsi.jpg', status: 'Available' },
    { id: _genId(), name: 'Sprite (500 ml)', category: 'Drink', price: 400.00, image: 'assets/images/sprite1.jpg', status: 'Available' },
    { id: _genId(), name: 'Lemon Mojito', category: 'Drink', price: 850.00, image: 'assets/images/lemonmojito.jpg', status: 'Available' },
    { id: _genId(), name: 'Strawberry Mojito', category: 'Drink', price: 950.00, image: 'assets/images/strwberrymojito.avif', status: 'Available' },
    { id: _genId(), name: 'Orange Mojito', category: 'Drink', price: 950.00, image: 'assets/images/orangemojito.avif', status: 'Available' }
  ];
  localStorage.setItem(MENU_KEY, JSON.stringify(seeded));
  return seeded;
})();

function saveMenu() { localStorage.setItem(MENU_KEY, JSON.stringify(menu)); }
function getMenu() { return menu.slice(); }
function getMenuItemById(id) { return menu.find(i => i.id === id) || null; }

function createMenuItem(payload) {
  const item = Object.assign({
    id: _genId(),
    name: '',
    category: 'Burger',
    price: 0.00,
    image: '',
    status: 'Available'
  }, payload);
  menu.push(item);
  saveMenu();
  return item;
}

function updateMenuItem(id, patch = {}) {
  const idx = menu.findIndex(i => i.id === id);
  if (idx === -1) return null;
  menu[idx] = Object.assign({}, menu[idx], patch, { updatedAt: new Date().toISOString() });
  saveMenu();
  return menu[idx];
}

function deleteMenuItem(id) {
  const idx = menu.findIndex(i => i.id === id);
  if (idx === -1) return false;
  menu.splice(idx, 1);
  saveMenu();
  return true;
}

function findMenuItems(query = {}) {
  // simple filter by name/category/status
  return menu.filter(item => {
    if (query.name && !item.name.toLowerCase().includes(String(query.name).toLowerCase())) return false;
    if (query.category && query.category !== 'all' && item.category !== query.category) return false;
    if (query.status && item.status !== query.status) return false;
    return true;
  });
}

// expose MenuStore for CRUD from UI
window.MenuStore = {
  getMenu,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  findMenuItems,
  saveMenu
};

// ...existing code...
// --- Customer CRUD Operations ---

// --- Customer CRUD Operations ---


// ...existing code...

// Render menu items table from MenuStore (using template)
function renderMenuItems(filter = '') {
  const tbody = document.getElementById('itemsTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  const items = window.MenuStore ? window.MenuStore.getMenu() : menu;
  const filtered = items.filter(item => 
    (item.name.toLowerCase().includes(filter.toLowerCase()) || 
     item.category.toLowerCase().includes(filter.toLowerCase()))
  );
  
  const template = document.getElementById('itemRowTemplate');
  
  filtered.forEach(item => {
    const clone = template.content.cloneNode(true);
    clone.querySelector('.item-name').textContent = item.name;
    clone.querySelector('.item-category').textContent = item.category;
    clone.querySelector('.item-price').textContent = `Rs.${Number(item.price).toFixed(2)}`;
    clone.querySelector('.item-status').textContent = item.status;
    
    clone.querySelector('[data-action="edit-item"]').dataset.id = item.id;
    clone.querySelector('[data-action="delete-item"]').dataset.id = item.id;
    
    tbody.appendChild(clone);
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Only run if on admin.html (check if elements exist)
  if (!document.getElementById('itemsTableBody')) return;
  
  renderMenuItems();
  
  // Add Item button
  const addItemBtn = document.getElementById('addItemBtn');
  if (addItemBtn) {
    addItemBtn.addEventListener('click', () => {
      document.getElementById('itemForm').reset();
      document.getElementById('itemId').value = '';
      new bootstrap.Modal(document.getElementById('itemModal')).show();
    });
  }
  
  // Item form submit
  const itemForm = document.getElementById('itemForm');
  if (itemForm) {
    itemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const id = document.getElementById('itemId').value;
      const payload = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        image: document.getElementById('itemImage').value || 'assets/images/placeholder.png',
        status: document.getElementById('itemStatus').value
      };
      
      if (id) {
        window.MenuStore.updateMenuItem(id, payload);
      } else {
        window.MenuStore.createMenuItem(payload);
      }
      
      renderMenuItems();
      bootstrap.Modal.getInstance(document.getElementById('itemModal')).hide();
    });
  }
  
  // Search filter
  const searchInput = document.getElementById('searchItem');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderMenuItems(e.target.value);
    });
  }
});

// Table action delegation (edit/delete) - works on any page
document.addEventListener('click', (e) => {
  const editBtn = e.target.closest('[data-action="edit-item"]');
  if (editBtn) {
    const id = editBtn.dataset.id;
    const item = window.MenuStore.getMenuItemById(id);
    if (!item) return;
    
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemImage').value = item.image || '';
    document.getElementById('itemStatus').value = item.status;
    new bootstrap.Modal(document.getElementById('itemModal')).show();
  }
  
  const deleteBtn = e.target.closest('[data-action="delete-item"]');
  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    if (confirm('Delete this item?')) {
      window.MenuStore.deleteMenuItem(id);
      renderMenuItems();
    }
  }
});

// ...existing code...

 
function salesOrderList(filter = '') {
  const tbody = document.getElementById('salesTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  const items = window.OrderStoreStore ? window.OrderStore.getOrders() : orders;
  const filtered = items.filter(order => 
    (order.orderNumber.toLowerCase().includes(filter.toLowerCase()) || 
    order.items.some(i => i.name.toLowerCase().includes(filter.toLowerCase())) ||
    order.paymentMethod.toLowerCase().includes(filter.toLowerCase()) ||
     order.createdAt.toLowerCase().includes(filter.toLowerCase())
    )
  );
  const totalRevenueEl = document.getElementById('salesTotal');
  const totalRevenue = filtered.reduce((sum, order) => sum + Number(order.total), 0);
  
  const template = document.getElementById('salesRowTemplate');
  
  filtered.forEach(order => {
    const clone = template.content.cloneNode(true);
    clone.querySelector('.order-id').textContent = order.orderNumber;
    clone.querySelector('.items').textContent = order.items.map(i => `${i.name}`).join(', ');
    clone.querySelector('.total').textContent = `Rs.${Number(order.total).toFixed(2)}`;
    clone.querySelector('.payment-method').textContent = order.paymentMethod;
    clone.querySelector('.order-status').textContent = order.status;
    clone.querySelector('.date').textContent = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '';
    
    tbody.appendChild(clone);
  });

  if (totalRevenueEl) {
    totalRevenueEl.textContent = `Rs.${totalRevenue.toFixed(2)}`;
    }

  
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Only run if on admin.html (check if elements exist)
  if (!document.getElementById('salesTableBody')) return;
  
  salesOrderList();

  // Search filter
  const searchInput = document.getElementById('searchSales');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      salesOrderList(e.target.value);
    });
  }
});




// ADMIN PAGE INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
    // Initialize customers table
    if (document.getElementById('customersTableBody')) {
        renderCustomersTable();
        
        // Search functionality
        const searchInput = document.getElementById('searchCustomer');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                renderCustomersTable(e.target.value);
            });
        }
    }
    
    // Expose functions globally for admin access
    
});



