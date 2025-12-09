// Contact page JavaScript

async function submitContact() {
  if (!currentUser) {
    showMessage('Please login to send a message', 'error');
    openModal('loginModal');
    return;
  }
  
  const subject = document.getElementById('contactSubject').value;
  const message = document.getElementById('contactMessage').value;
  
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, message })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('Message sent successfully!', 'success');
      document.getElementById('contactForm').reset();
    } else {
      showMessage(data.error || 'Failed to send message', 'error');
    }
  } catch (error) {
    showMessage('Failed to send message', 'error');
  }
}

