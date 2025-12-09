// Products page JavaScript

let selectedProduct = null;
let currentProductImages = [];
let currentImageIndex = 0;

function setupProductImageGallery(images) {
  currentProductImages = images;
  currentImageIndex = 0;
  
  const mainImage = document.getElementById('modalProductImage');
  const thumbnailsDiv = document.getElementById('productImageThumbnails');
  
  if (images.length === 0) {
    mainImage.src = '/uploads/placeholder.jpg';
    thumbnailsDiv.innerHTML = '';
    return;
  }
  
  // Set main image
  mainImage.src = `/uploads/${images[0]}`;
  mainImage.onclick = () => {
    if (images.length > 1) {
      currentImageIndex = (currentImageIndex + 1) % images.length;
      mainImage.src = `/uploads/${images[currentImageIndex]}`;
      updateThumbnailSelection();
    }
  };
  
  // Create thumbnails
  if (images.length > 1) {
    thumbnailsDiv.innerHTML = images.map((img, index) => `
      <img src="/uploads/${img}" alt="Thumbnail ${index + 1}" 
           onclick="selectProductImage(${index})"
           style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 2px solid ${index === 0 ? 'var(--primary-black)' : 'transparent'};"
           class="product-thumbnail">
    `).join('');
  } else {
    thumbnailsDiv.innerHTML = '';
  }
}

function selectProductImage(index) {
  currentImageIndex = index;
  const mainImage = document.getElementById('modalProductImage');
  mainImage.src = `/uploads/${currentProductImages[index]}`;
  updateThumbnailSelection();
}

function updateThumbnailSelection() {
  document.querySelectorAll('.product-thumbnail').forEach((thumb, index) => {
    thumb.style.borderColor = index === currentImageIndex ? 'var(--primary-black)' : 'transparent';
  });
}

async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    const products = await response.json();
    
    const container = document.getElementById('productsGrid');
    if (container) {
      container.innerHTML = products.map(product => `
        <div class="product-card" onclick="viewProduct(${product.id})">
          <img src="/uploads/${product.image || 'placeholder.jpg'}" alt="${product.name}" class="product-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22280%22 height=%22300%22%3E%3Crect fill=%22%23f5f5f5%22 width=%22280%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%236b6b6b%22%3ENo Image%3C/text%3E%3C/svg%3E'">
          <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
            <p class="product-stock">${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load products:', error);
  }
}

let selectedSize = null;
let isCustomSize = false;

async function viewProduct(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    const product = await response.json();
    
    selectedProduct = product;
    selectedSize = null;
    isCustomSize = false;
    
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalProductDescription').textContent = product.description || 'No description available.';
    document.getElementById('modalProductMaterial').textContent = `Material: ${product.material || 'Cotton'}`;
    document.getElementById('modalProductPrice').textContent = `$${parseFloat(product.price).toFixed(2)}`;
    document.getElementById('modalProductStock').textContent = product.stock > 0 
      ? `In Stock (${product.stock} available)` 
      : 'Out of Stock';
    
    // Set up image gallery
    const productImages = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : ['placeholder.jpg']);
    setupProductImageGallery(productImages);
    
    document.getElementById('productQuantity').max = product.stock;
    document.getElementById('productQuantity').value = 1;
    
    // Generate size buttons
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const sizeOptionsDiv = document.getElementById('sizeOptions');
    sizeOptionsDiv.innerHTML = sizes.map(size => `
      <button type="button" class="size-btn" onclick="selectSize('${size}')" 
              style="padding: 0.5rem 1rem; border: 2px solid var(--light-gray); background: var(--white); 
                     cursor: pointer; border-radius: 4px; min-width: 50px; transition: all 0.3s;">
        ${size}
      </button>
    `).join('');
    
    // Reset custom size form
    document.getElementById('customSizeForm').style.display = 'none';
    document.getElementById('sizeChart').style.display = 'none';
    document.getElementById('customSizeBtn').textContent = 'Customize Size';
    document.getElementById('customSizeBtn').style.background = 'var(--white)';
    
    // Clear custom size inputs
    ['customChest', 'customWaist', 'customLength', 'customShoulder', 'customSleeve', 'customHip'].forEach(id => {
      document.getElementById(id).value = '';
    });
    
    openModal('productModal');
  } catch (error) {
    console.error('Failed to load product:', error);
    showMessage('Failed to load product details', 'error');
  }
}

function selectSize(size) {
  selectedSize = size;
  isCustomSize = false;
  
  // Update button styles
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.style.background = 'var(--white)';
    btn.style.borderColor = 'var(--light-gray)';
    btn.style.color = 'var(--primary-black)';
  });
  
  event.target.style.background = 'var(--primary-black)';
  event.target.style.borderColor = 'var(--primary-black)';
  event.target.style.color = 'var(--white)';
  
  // Hide custom size form
  document.getElementById('customSizeForm').style.display = 'none';
  document.getElementById('customSizeBtn').style.background = 'var(--white)';
  
  // Show size chart
  document.getElementById('sizeChart').style.display = 'block';
}

function toggleCustomSize() {
  isCustomSize = !isCustomSize;
  const customForm = document.getElementById('customSizeForm');
  const customBtn = document.getElementById('customSizeBtn');
  
  if (isCustomSize) {
    customForm.style.display = 'block';
    customBtn.style.background = 'var(--primary-black)';
    customBtn.style.color = 'var(--white)';
    selectedSize = 'Custom';
    
    // Deselect standard sizes
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.style.background = 'var(--white)';
      btn.style.borderColor = 'var(--light-gray)';
      btn.style.color = 'var(--primary-black)';
    });
    
    // Show size chart for reference
    document.getElementById('sizeChart').style.display = 'block';
  } else {
    customForm.style.display = 'none';
    customBtn.style.background = 'var(--white)';
    customBtn.style.color = 'var(--primary-black)';
    selectedSize = null;
    
    // Clear custom inputs
    ['customChest', 'customWaist', 'customLength', 'customShoulder', 'customSleeve', 'customHip'].forEach(id => {
      document.getElementById(id).value = '';
    });
  }
}

async function addToCartFromModal() {
  if (!currentUser) {
    showMessage('Please login to add items to cart', 'error');
    closeModal('productModal');
    openModal('loginModal');
    return;
  }
  
  if (!selectedProduct) return;
  
  // Check if size is selected
  if (!selectedSize) {
    showMessage('Please select a size', 'error');
    return;
  }
  
  const quantity = parseInt(document.getElementById('productQuantity').value);
  
  if (quantity > selectedProduct.stock) {
    showMessage('Not enough stock available', 'error');
    return;
  }
  
  // Get custom size data if custom size is selected
  let customSizeData = null;
  if (isCustomSize) {
    const chest = document.getElementById('customChest').value;
    const waist = document.getElementById('customWaist').value;
    const length = document.getElementById('customLength').value;
    const shoulder = document.getElementById('customShoulder').value;
    const sleeve = document.getElementById('customSleeve').value;
    const hip = document.getElementById('customHip').value;
    
    // Validate custom measurements
    if (!chest || !waist || !length) {
      showMessage('Please fill in at least Chest, Waist, and Length measurements', 'error');
      return;
    }
    
    customSizeData = JSON.stringify({
      chest: parseFloat(chest),
      waist: parseFloat(waist),
      length: parseFloat(length),
      shoulder: shoulder ? parseFloat(shoulder) : null,
      sleeve: sleeve ? parseFloat(sleeve) : null,
      hip: hip ? parseFloat(hip) : null
    });
  }
  
  try {
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: selectedProduct.id,
        quantity: quantity,
        size: selectedSize,
        customSizeData: customSizeData
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('Item added to cart!', 'success');
      closeModal('productModal');
      loadCartCount();
    } else {
      showMessage(data.error || 'Failed to add to cart', 'error');
    }
  } catch (error) {
    showMessage('Failed to add to cart', 'error');
  }
}

async function loadCart() {
  if (!currentUser) return;
  
  try {
    const response = await fetch('/api/cart');
    if (!response.ok) {
      document.getElementById('cart').style.display = 'none';
      return;
    }
    
    const cart = await response.json();
    const container = document.getElementById('cartItems');
    const cartSection = document.getElementById('cart');
    
    if (cart.length === 0) {
      cartSection.style.display = 'none';
      return;
    }
    
    cartSection.style.display = 'block';
    
    let total = 0;
    container.innerHTML = cart.map(item => {
      const itemTotal = parseFloat(item.price) * item.quantity;
      total += itemTotal;
      return `
        <div class="cart-item">
          <img src="/uploads/${item.image || 'placeholder.jpg'}" alt="${item.name}" class="cart-item-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f5f5f5%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'">
          <div class="cart-item-info">
            <h3 class="cart-item-name">${item.name}</h3>
            <p class="cart-item-price">$${parseFloat(item.price).toFixed(2)} each</p>
          </div>
          <div class="cart-item-quantity">
            <span>Qty: ${item.quantity}</span>
            <button class="quantity-btn" onclick="removeFromCart(${item.id})">Remove</button>
          </div>
          <div style="font-weight: bold;">$${itemTotal.toFixed(2)}</div>
        </div>
      `;
    }).join('');
    
    document.getElementById('cartTotal').textContent = total.toFixed(2);
  } catch (error) {
    console.error('Failed to load cart:', error);
  }
}

async function removeFromCart(cartId) {
  try {
    const response = await fetch(`/api/cart/${cartId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('Item removed from cart', 'success');
      loadCart();
      loadCartCount();
    }
  } catch (error) {
    showMessage('Failed to remove item', 'error');
  }
}

async function checkout() {
  if (!currentUser) {
    showMessage('Please login to checkout', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/cart');
    const cart = await response.json();
    
    if (cart.length === 0) {
      showMessage('Your cart is empty', 'error');
      return;
    }
    
    const items = cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: parseFloat(item.price)
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
      loadCart();
      loadCartCount();
    } else {
      showMessage('Failed to place order', 'error');
    }
  } catch (error) {
    showMessage('Failed to place order', 'error');
  }
}

// Check URL for cart view
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  
  if (window.location.hash === '#cart') {
    setTimeout(() => {
      document.getElementById('cart').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
  
  // Reload cart when user logs in
  const originalCheckAuth = checkAuth;
  checkAuth = async function() {
    await originalCheckAuth();
    if (currentUser) {
      loadCart();
    }
  };
});

