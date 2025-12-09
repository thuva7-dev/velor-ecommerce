// Profile page JavaScript

async function loadProfile() {
  if (!currentUser) {
    window.location.href = '/';
    return;
  }
  
  try {
    const response = await fetch('/api/profile');
    if (!response.ok) {
      throw new Error('Failed to load profile');
    }
    
    const profile = await response.json();
    document.getElementById('profileName').value = profile.name;
    document.getElementById('profileEmail').value = profile.email;
    
    loadOrders();
  } catch (error) {
    console.error('Failed to load profile:', error);
    showMessage('Failed to load profile', 'error');
  }
}

async function updateProfile() {
  const name = document.getElementById('profileName').value;
  const email = document.getElementById('profileEmail').value;
  
  try {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('Profile updated successfully!', 'success');
      currentUser.name = name;
      currentUser.email = email;
      updateNavForUser();
    } else {
      showMessage(data.error || 'Failed to update profile', 'error');
    }
  } catch (error) {
    showMessage('Failed to update profile', 'error');
  }
}

async function loadOrders() {
  try {
    const response = await fetch('/api/orders');
    if (!response.ok) {
      throw new Error('Failed to load orders');
    }
    
    const orders = await response.json();
    const container = document.getElementById('ordersList');
    
    if (orders.length === 0) {
      container.innerHTML = '<p style="color: var(--secondary-gray);">No orders yet.</p>';
      return;
    }
    
    container.innerHTML = orders.map(order => {
      const date = new Date(order.created_at).toLocaleDateString();
      return `
        <div style="background: var(--white); padding: 1.5rem; margin-bottom: 1rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin-bottom: 0.5rem;">Order #${order.id}</h3>
              <p style="color: var(--secondary-gray);">Date: ${date}</p>
              <p style="color: var(--secondary-gray);">Total: $${parseFloat(order.total_amount).toFixed(2)}</p>
            </div>
            <div>
              <span style="padding: 0.5rem 1rem; background: var(--light-gray); border-radius: 4px; text-transform: capitalize;">
                ${order.status}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Failed to load orders:', error);
    document.getElementById('ordersList').innerHTML = '<p style="color: var(--secondary-gray);">Failed to load orders.</p>';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  if (currentUser) {
    loadProfile();
  } else {
    window.location.href = '/';
  }
});

