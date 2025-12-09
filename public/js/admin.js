// Admin panel JavaScript

let editingProductId = null;

async function checkAdminAccess() {
  try {
    // Wait for authentication check to complete
    await checkAuth();
    
    // Double check if currentUser is set
    if (!currentUser) {
      console.error('No current user found');
      window.location.href = '/';
      return false;
    }
    
    // Check if user is admin
    if (!currentUser.isAdmin) {
      console.error('User is not an admin');
      window.location.href = '/';
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Admin access check failed:', error);
    window.location.href = '/';
    return false;
  }
}

function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(tabName + 'Tab').classList.add('active');
  event.target.classList.add('active');
  
  // Load tab content
  if (tabName === 'products') {
    loadProducts();
  } else if (tabName === 'orders') {
    loadOrders();
  } else if (tabName === 'users') {
    loadUsers();
  } else if (tabName === 'contacts') {
    loadContacts();
  }
}

async function loadStats() {
  try {
    const response = await fetch('/api/admin/stats');
    
    if (!response.ok) {
      if (response.status === 403) {
        showMessage('Admin access required', 'error');
        window.location.href = '/';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const stats = await response.json();
    
    const container = document.getElementById('adminStats');
    if (!container) {
      console.error('Stats container not found');
      return;
    }
    
    container.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${stats.products || 0}</div>
        <div class="stat-label">Total Products</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.orders || 0}</div>
        <div class="stat-label">Total Orders</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.pendingOrders || 0}</div>
        <div class="stat-label">Pending Orders</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.newContacts || 0}</div>
        <div class="stat-label">New Messages</div>
      </div>
    `;
  } catch (error) {
    console.error('Failed to load stats:', error);
    showMessage('Failed to load statistics. Please refresh the page.', 'error');
  }
}

async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const products = await response.json();
    
    const container = document.getElementById('productsList');
    if (!container) {
      console.error('Products container not found');
      return;
    }
    
    if (products.length === 0) {
      container.innerHTML = '<p style="color: var(--secondary-gray);">No products yet.</p>';
      return;
    }
    
    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(product => `
            <tr>
              <td><img src="/uploads/${product.image || 'placeholder.jpg'}" alt="${product.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23f5f5f5%22 width=%2260%22 height=%2260%22/%3E%3C/svg%3E'"></td>
              <td>${product.name}</td>
              <td>$${parseFloat(product.price).toFixed(2)}</td>
              <td>${product.stock}</td>
              <td>
                <button class="btn btn-outline" onclick="editProduct(${product.id})" style="padding: 0.4rem 1rem; margin-right: 0.5rem;">Edit</button>
                <button class="btn btn-primary" onclick="deleteProduct(${product.id})" style="padding: 0.4rem 1rem; background: #dc3545;">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Failed to load products:', error);
  }
}

async function addProduct() {
  const formData = new FormData();
  formData.append('name', document.getElementById('productName').value);
  formData.append('description', document.getElementById('productDescription').value);
  formData.append('material', document.getElementById('productMaterial').value || 'Cotton');
  formData.append('price', document.getElementById('productPrice').value);
  formData.append('stock', document.getElementById('productStock').value);
  
  // Append all selected images
  const imageFiles = document.getElementById('productImages').files;
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }
  
  try {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('Product added successfully!', 'success');
      closeModal('addProductModal');
      document.getElementById('addProductForm').reset();
      loadProducts();
      loadStats();
    } else {
      showMessage(data.error || 'Failed to add product', 'error');
    }
  } catch (error) {
    showMessage('Failed to add product', 'error');
  }
}

async function editProduct(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    const product = await response.json();
    
    editingProductId = productId;
    document.getElementById('editProductId').value = productId;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductDescription').value = product.description || '';
    document.getElementById('editProductMaterial').value = product.material || 'Cotton';
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductStock').value = product.stock;
    
    // Display existing images
    const existingImagesDiv = document.getElementById('existingImagesList');
    const productImages = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
    if (productImages.length > 0) {
      existingImagesDiv.innerHTML = productImages.map((img, index) => `
        <div style="position: relative; display: inline-block;">
          <img src="/uploads/${img}" alt="Product image ${index + 1}" 
               style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px; border: 2px solid var(--light-gray);">
          <button type="button" onclick="deleteProductImage(${productId}, '${img}')" 
                  style="position: absolute; top: -5px; right: -5px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px;">×</button>
        </div>
      `).join('');
    } else {
      existingImagesDiv.innerHTML = '<p style="color: var(--secondary-gray);">No images</p>';
    }
    
    // Clear preview
    document.getElementById('editImagePreview').innerHTML = '';
    document.getElementById('editProductImages').value = '';
    
    openModal('editProductModal');
  } catch (error) {
    showMessage('Failed to load product', 'error');
  }
}

async function updateProduct() {
  const productId = editingProductId;
  const formData = new FormData();
  formData.append('name', document.getElementById('editProductName').value);
  formData.append('description', document.getElementById('editProductDescription').value);
  formData.append('material', document.getElementById('editProductMaterial').value || 'Cotton');
  formData.append('price', document.getElementById('editProductPrice').value);
  formData.append('stock', document.getElementById('editProductStock').value);
  
  // Append all selected images
  const imageFiles = document.getElementById('editProductImages').files;
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }
  
  try {
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('Product updated successfully!', 'success');
      closeModal('editProductModal');
      loadProducts();
      loadStats();
    } else {
      showMessage(data.error || 'Failed to update product', 'error');
    }
  } catch (error) {
    showMessage('Failed to update product', 'error');
  }
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('Product deleted successfully!', 'success');
      loadProducts();
      loadStats();
    } else {
      showMessage(data.error || 'Failed to delete product', 'error');
    }
  } catch (error) {
    showMessage('Failed to delete product', 'error');
  }
}

async function loadOrders() {
  try {
    const response = await fetch('/api/orders');
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        showMessage('Session expired. Please login again.', 'error');
        setTimeout(() => window.location.href = '/', 2000);
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const orders = await response.json();
    
    const container = document.getElementById('ordersList');
    if (!container) {
      console.error('Orders container not found');
      return;
    }
    
    if (orders.length === 0) {
      container.innerHTML = '<p style="color: var(--secondary-gray);">No orders yet.</p>';
      return;
    }
    
    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => {
            const date = new Date(order.created_at).toLocaleDateString();
            return `
              <tr>
                <td>#${order.id}</td>
                <td>${order.user_name || 'N/A'}</td>
                <td>${order.email || 'N/A'}</td>
                <td>$${parseFloat(order.total_amount).toFixed(2)}</td>
                <td>
                  <select onchange="updateOrderStatus(${order.id}, this.value)" style="padding: 0.4rem; border: 1px solid var(--light-gray); border-radius: 4px;">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                  </select>
                </td>
                <td>${date}</td>
                <td>
                  <button class="btn btn-outline" onclick="viewOrderDetails(${order.id})" style="padding: 0.4rem 1rem;">View Details</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
}

async function viewOrderDetails(orderId) {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}`);
    const order = await response.json();
    
    const date = new Date(order.created_at).toLocaleDateString();
    const time = new Date(order.created_at).toLocaleTimeString();
    
    const itemsHtml = order.items.map(item => `
      <tr>
        <td>
          <img src="/uploads/${item.image || 'placeholder.jpg'}" alt="${item.product_name}" 
               style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"
               onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23f5f5f5%22 width=%2260%22 height=%2260%22/%3E%3C/svg%3E'">
        </td>
        <td>${item.product_name}</td>
        <td>${item.quantity}</td>
        <td>$${parseFloat(item.price).toFixed(2)}</td>
        <td>$${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');
    
    const statusColors = {
      'pending': '#ffc107',
      'processing': '#17a2b8',
      'shipped': '#007bff',
      'delivered': '#28a745',
      'cancelled': '#dc3545'
    };
    
    document.getElementById('orderDetailsContent').innerHTML = `
      <div style="margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1rem;">Order Information</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
          <div>
            <strong>Order ID:</strong> #${order.id}
          </div>
          <div>
            <strong>Date:</strong> ${date} ${time}
          </div>
          <div>
            <strong>Customer:</strong> ${order.user_name}
          </div>
          <div>
            <strong>Email:</strong> ${order.email}
          </div>
          <div>
            <strong>Status:</strong> 
            <span style="padding: 0.3rem 0.8rem; background: ${statusColors[order.status] || '#6c757d'}; color: white; border-radius: 4px; text-transform: capitalize; margin-left: 0.5rem;">
              ${order.status}
            </span>
          </div>
          <div>
            <strong>Total Amount:</strong> $${parseFloat(order.total_amount).toFixed(2)}
          </div>
        </div>
      </div>
      
      <div>
        <h3 style="margin-bottom: 1rem;">Order Items</h3>
        <table class="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align: right; font-weight: bold;">Total:</td>
              <td style="font-weight: bold;">$${parseFloat(order.total_amount).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div style="margin-top: 2rem;">
        <label><strong>Update Status:</strong></label>
        <select id="orderStatusSelect" onchange="updateOrderStatusFromModal(${order.id}, this.value)" 
                style="padding: 0.5rem; border: 1px solid var(--light-gray); border-radius: 4px; margin-left: 1rem; width: 200px;">
          <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
          <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
          <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
          <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </div>
    `;
    
    openModal('orderDetailsModal');
  } catch (error) {
    console.error('Failed to load order details:', error);
    showMessage('Failed to load order details', 'error');
  }
}

async function updateOrderStatusFromModal(orderId, status) {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('Order status updated!', 'success');
      viewOrderDetails(orderId); // Refresh the modal
      loadOrders(); // Refresh the orders list
      loadStats(); // Refresh stats
    } else {
      showMessage('Failed to update order status', 'error');
    }
  } catch (error) {
    showMessage('Failed to update order status', 'error');
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('Order status updated!', 'success');
      loadOrders();
      loadStats();
    } else {
      showMessage('Failed to update order status', 'error');
    }
  } catch (error) {
    showMessage('Failed to update order status', 'error');
  }
}

async function loadUsers() {
  try {
    const response = await fetch('/api/admin/users');
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        showMessage('Admin access required. Please login again.', 'error');
        setTimeout(() => window.location.href = '/', 2000);
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const users = await response.json();
    
    const container = document.getElementById('usersList');
    if (!container) {
      console.error('Users container not found');
      return;
    }
    
    if (users.length === 0) {
      container.innerHTML = '<p style="color: var(--secondary-gray);">No users yet.</p>';
      return;
    }
    
    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => {
            const date = new Date(user.created_at).toLocaleDateString();
            const isCurrentUser = currentUser && user.id == currentUser.id;
            return `
              <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>
                  <span style="padding: 0.3rem 0.8rem; background: ${user.is_admin ? '#007bff' : '#6c757d'}; color: white; border-radius: 4px;">
                    ${user.is_admin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td>${date}</td>
                <td>
                  <button class="btn btn-outline" onclick="editUser(${user.id})" style="padding: 0.4rem 1rem; margin-right: 0.5rem;">Edit</button>
                  ${!isCurrentUser ? `<button class="btn btn-primary" onclick="deleteUser(${user.id})" style="padding: 0.4rem 1rem; background: #dc3545;">Delete</button>` : '<span style="color: var(--secondary-gray);">Current User</span>'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Failed to load users:', error);
    showMessage('Failed to load users', 'error');
  }
}

let editingUserId = null;

async function editUser(userId) {
  try {
    const response = await fetch(`/api/admin/users/${userId}`);
    const user = await response.json();
    
    editingUserId = userId;
    document.getElementById('editUserId').value = userId;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserIsAdmin').checked = user.is_admin === 1;
    
    openModal('editUserModal');
  } catch (error) {
    showMessage('Failed to load user', 'error');
  }
}

async function updateUser() {
  const userId = editingUserId;
  const name = document.getElementById('editUserName').value;
  const email = document.getElementById('editUserEmail').value;
  const isAdmin = document.getElementById('editUserIsAdmin').checked;
  
  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, is_admin: isAdmin })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('User updated successfully!', 'success');
      closeModal('editUserModal');
      loadUsers();
    } else {
      showMessage(data.error || 'Failed to update user', 'error');
    }
  } catch (error) {
    showMessage('Failed to update user', 'error');
  }
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('User deleted successfully!', 'success');
      loadUsers();
    } else {
      showMessage(data.error || 'Failed to delete user', 'error');
    }
  } catch (error) {
    showMessage('Failed to delete user', 'error');
  }
}

async function loadContacts() {
  try {
    const response = await fetch('/api/admin/contacts');
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        showMessage('Admin access required. Please login again.', 'error');
        setTimeout(() => window.location.href = '/', 2000);
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contacts = await response.json();
    
    const container = document.getElementById('contactsList');
    if (!container) {
      console.error('Contacts container not found');
      return;
    }
    
    if (contacts.length === 0) {
      container.innerHTML = '<p style="color: var(--secondary-gray);">No messages yet.</p>';
      return;
    }
    
    container.innerHTML = contacts.map(contact => {
      const date = new Date(contact.created_at).toLocaleDateString();
      return `
        <div style="background: var(--white); padding: 1.5rem; margin-bottom: 1rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <div>
              <h3 style="margin-bottom: 0.5rem;">${contact.subject}</h3>
              <p style="color: var(--secondary-gray);">From: ${contact.user_name} (${contact.email})</p>
              <p style="color: var(--secondary-gray);">Date: ${date}</p>
            </div>
            <div>
              <span style="padding: 0.5rem 1rem; background: ${contact.status === 'new' ? '#d4edda' : 'var(--light-gray)'}; border-radius: 4px; text-transform: capitalize;">
                ${contact.status}
              </span>
            </div>
          </div>
          <p style="color: var(--primary-black); line-height: 1.6;">${contact.message}</p>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Failed to load contacts:', error);
  }
}

// Immediate check on page load - before DOM is ready
(async function() {
  try {
    // Check authentication immediately
    await checkAuth();
    
    // Verify admin access before allowing page to load
    if (!currentUser || !currentUser.isAdmin) {
      console.error('Unauthorized access attempt to admin panel');
      window.location.href = '/';
      return;
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeAdminPanel);
    } else {
      initializeAdminPanel();
    }
  } catch (error) {
    console.error('Failed to verify admin access:', error);
    window.location.href = '/';
  }
})();

async function initializeAdminPanel() {
  try {
    // Double-check admin access
    if (!currentUser || !currentUser.isAdmin) {
      window.location.href = '/';
      return;
    }
    
    // Show admin content after verification
    const verificationDiv = document.getElementById('adminVerification');
    const adminHeader = document.getElementById('adminHeader');
    const adminContent = document.getElementById('adminContent');
    
    if (verificationDiv) verificationDiv.style.display = 'none';
    if (adminHeader) adminHeader.style.display = 'flex';
    if (adminContent) adminContent.style.display = 'block';
    
    // Load all initial data
    await Promise.all([
      loadStats(),
      loadProducts()
    ]);
  } catch (error) {
    console.error('Failed to initialize admin panel:', error);
    const verificationDiv = document.getElementById('adminVerification');
    if (verificationDiv) {
      verificationDiv.innerHTML = '<p style="color: #dc3545;">Failed to load admin panel. Redirecting...</p>';
    }
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  }
}

