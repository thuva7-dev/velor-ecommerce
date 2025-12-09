// Home page JavaScript

async function loadFeaturedProducts() {
  try {
    const response = await fetch('/api/products');
    const products = await response.json();
    
    // Show first 4 products
    const featuredProducts = products.slice(0, 4);
    const container = document.getElementById('featuredProducts');
    
    if (container) {
      container.innerHTML = featuredProducts.map(product => `
        <div class="product-card" onclick="window.location.href='/products?id=${product.id}'">
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

document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProducts();
});

