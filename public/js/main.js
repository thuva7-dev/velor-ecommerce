// Main JavaScript for Velor E-commerce

let currentUser = null;

// Check authentication status on page load
async function checkAuth() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();
    
    if (data.loggedIn) {
      currentUser = data.user;
      updateNavForUser();
    } else {
      updateNavForGuest();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}

// Update navigation for logged-in user
function updateNavForUser() {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;
  
  const authButtons = navLinks.querySelector('.auth-buttons');
  if (authButtons) {
    authButtons.innerHTML = `
      <span style="color: var(--secondary-gray);">Hello, ${currentUser.name}</span>
      <a href="/profile" class="btn btn-outline">Profile</a>
      ${currentUser.isAdmin ? '<a href="/admin" class="btn btn-outline">Admin</a>' : ''}
      <button class="btn btn-primary" onclick="logout()">Logout</button>
    `;
  }
  
  // Update cart count
  if (currentUser) {
    loadCartCount();
  }
}

// Update navigation for guest
function updateNavForGuest() {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;
  
  const authButtons = navLinks.querySelector('.auth-buttons');
  if (authButtons) {
    authButtons.innerHTML = `
      <button class="btn btn-outline" onclick="openModal('loginModal')">Login</button>
      <button class="btn btn-primary" onclick="openModal('registerModal')">Register</button>
    `;
  }
}

// Login function
async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      currentUser = data.user;
      closeModal('loginModal');
      updateNavForUser();
      showMessage('Login successful!', 'success');
      
      // Redirect admin users to admin panel
      if (data.user.isAdmin) {
        setTimeout(() => {
          window.location.href = '/admin';
        }, 1000);
      } else {
        setTimeout(() => location.reload(), 1000);
      }
    } else {
      showMessage(data.error || 'Login failed', 'error');
    }
  } catch (error) {
    showMessage('Login failed. Please try again.', 'error');
  }
}

// Register function
async function register() {
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      closeModal('registerModal');
      showMessage('Registration successful! Please login.', 'success');
      setTimeout(() => openModal('loginModal'), 1000);
    } else {
      showMessage(data.error || 'Registration failed', 'error');
    }
  } catch (error) {
    showMessage('Registration failed. Please try again.', 'error');
  }
}

// Logout function
async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
    currentUser = null;
    updateNavForGuest();
    showMessage('Logged out successfully', 'success');
    setTimeout(() => location.reload(), 1000);
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

// Modal functions
function openModal(modalId) {
  if (!currentUser && (modalId === 'addToCartModal' || modalId === 'contactModal')) {
    showMessage('Please login to continue', 'error');
    openModal('loginModal');
    return;
  }
  
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    // Clear form if it's a form modal
    const form = modal.querySelector('form');
    if (form) form.reset();
  }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});

// Show message
function showMessage(text, type = 'success') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;
  
  const container = document.querySelector('.container') || document.body;
  container.insertBefore(messageDiv, container.firstChild);
  
  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

// Load cart count
async function loadCartCount() {
  if (!currentUser) return;
  
  try {
    const response = await fetch('/api/cart');
    if (response.ok) {
      const cart = await response.json();
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      const cartCount = document.querySelector('.cart-count');
      if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
      }
    }
  } catch (error) {
    console.error('Failed to load cart count:', error);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

