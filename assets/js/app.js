// ...existing code...
/*
  Cart behaviour for menu.html
  - Add items with .btn-add-cart (data-name, data-price)
  - Renders #cart-items (UL) and toggles #cart-empty
  - Quantity +/- and remove actions update localStorage and UI
*/

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

    // Create and save order to orders array
    const savedOrder = createOrder(orderPayload);

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