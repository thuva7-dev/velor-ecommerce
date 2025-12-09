// Cart page JavaScript

async function loadCart() {
  if (!currentUser) {
    document.getElementById('emptyCart').style.display = 'block';
    document.getElementById('emptyCart').innerHTML = `
      <p style="font-size: 1.2rem; color: var(--secondary-gray); margin-bottom: 2rem;">Please login to view your cart</p>
      <button class="btn btn-primary" onclick="openModal('loginModal')">Login</button>
    `;
    return;
  }
  
  try {
    const response = await fetch('/api/cart');
    
    if (!response.ok) {
      if (response.status === 401) {
        document.getElementById('emptyCart').style.display = 'block';
        document.getElementById('emptyCart').innerHTML = `
          <p style="font-size: 1.2rem; color: var(--secondary-gray); margin-bottom: 2rem;">Please login to view your cart</p>
          <button class="btn btn-primary" onclick="openModal('loginModal')">Login</button>
        `;
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const cart = await response.json();
    const emptyCartDiv = document.getElementById('emptyCart');
    const cartContentDiv = document.getElementById('cartContent');
    const cartItemsDiv = document.getElementById('cartItems');
    
    if (cart.length === 0) {
      emptyCartDiv.style.display = 'block';
      cartContentDiv.style.display = 'none';
      return;
    }
    
    emptyCartDiv.style.display = 'none';
    cartContentDiv.style.display = 'block';
    
    let total = 0;
    cartItemsDiv.innerHTML = cart.map(item => {
      const itemTotal = parseFloat(item.price) * item.quantity;
      total += itemTotal;
      
      // Parse custom size data if exists
      let sizeDisplay = item.size || 'No size';
      if (item.size === 'Custom' && item.custom_size_data) {
        try {
          const customData = JSON.parse(item.custom_size_data);
          sizeDisplay = `Custom (Chest: ${customData.chest}", Waist: ${customData.waist}", Length: ${customData.length}")`;
        } catch (e) {
          sizeDisplay = 'Custom';
        }
      }
      
      return `
        <div class="cart-item" style="display: flex; gap: 1.5rem; padding: 1.5rem; border-bottom: 1px solid var(--light-gray); align-items: center;">
          <img src="/uploads/${item.image || 'placeholder.jpg'}" alt="${item.name}" 
               style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;"
               onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Crect fill=%22%23f5f5f5%22 width=%22120%22 height=%22120%22/%3E%3C/svg%3E'">
          <div style="flex: 1;">
            <h3 style="margin-bottom: 0.5rem; font-size: 1.2rem;">${item.name}</h3>
            <p style="color: var(--secondary-gray); margin-bottom: 0.5rem;">$${parseFloat(item.price).toFixed(2)} each</p>
            <p style="color: var(--secondary-gray); margin-bottom: 1rem; font-size: 0.9rem;">Size: <strong>${sizeDisplay}</strong></p>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <label style="color: var(--secondary-gray);">Quantity:</label>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''} style="width: 30px; height: 30px; border: 1px solid var(--light-gray); background: var(--white); cursor: pointer; border-radius: 4px;">-</button>
                <span style="min-width: 30px; text-align: center;">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})" style="width: 30px; height: 30px; border: 1px solid var(--light-gray); background: var(--white); cursor: pointer; border-radius: 4px;">+</button>
              </div>
            </div>
          </div>
          <div style="text-align: right; min-width: 120px;">
            <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem;">$${itemTotal.toFixed(2)}</div>
            <button class="btn btn-outline" onclick="removeFromCart(${item.id})" style="padding: 0.4rem 1rem; font-size: 0.9rem;">Remove</button>
          </div>
        </div>
      `;
    }).join('');
    
    document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
    document.getElementById('subtotal').textContent = `$${total.toFixed(2)}`;
    
    // Update cart count in nav
    loadCartCount();
  } catch (error) {
    console.error('Failed to load cart:', error);
    showMessage('Failed to load cart. Please try again.', 'error');
  }
}

async function updateQuantity(cartId, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(cartId);
    return;
  }
  
  try {
    // First, get the cart item to find product_id
    const cartResponse = await fetch('/api/cart');
    const cart = await cartResponse.json();
    const item = cart.find(i => i.id === cartId);
    
    if (!item) {
      showMessage('Item not found in cart', 'error');
      return;
    }
    
    // Remove the item
    await fetch(`/api/cart/${cartId}`, {
      method: 'DELETE'
    });
    
    // Add it back with new quantity and same size
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: item.product_id,
        quantity: newQuantity,
        size: item.size,
        customSizeData: item.custom_size_data
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      loadCart();
      loadCartCount();
    } else {
      showMessage('Failed to update quantity', 'error');
    }
  } catch (error) {
    console.error('Failed to update quantity:', error);
    showMessage('Failed to update quantity', 'error');
  }
}

async function removeFromCart(cartId) {
  if (!confirm('Are you sure you want to remove this item from your cart?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/cart/${cartId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('Item removed from cart', 'success');
      loadCart();
      loadCartCount();
    } else {
      showMessage('Failed to remove item', 'error');
    }
  } catch (error) {
    console.error('Failed to remove item:', error);
    showMessage('Failed to remove item', 'error');
  }
}

async function checkout() {
  if (!currentUser) {
    showMessage('Please login to checkout', 'error');
    openModal('loginModal');
    return;
  }
  
  try {
    const response = await fetch('/api/cart');
    
    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }
    
    const cart = await response.json();
    
    if (cart.length === 0) {
      showMessage('Your cart is empty', 'error');
      return;
    }
    
    // Confirm checkout
    if (!confirm(`Place order for $${cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2)}?`)) {
      return;
    }
    
    const items = cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: parseFloat(item.price),
      size: item.size
    }));
    
    const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    
    const orderResponse = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, total })
    });
    
    const orderData = await orderResponse.json();
    
    if (orderData.success) {
      showMessage('Order placed successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/profile';
      }, 2000);
    } else {
      showMessage(orderData.error || 'Failed to place order', 'error');
    }
  } catch (error) {
    console.error('Failed to place order:', error);
    showMessage('Failed to place order. Please try again.', 'error');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  updateNavForUser();
  loadCart();
});

