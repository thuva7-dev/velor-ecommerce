const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Session configuration
app.use(session({
  secret: 'velor-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'velor_db'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.session.userId && req.session.isAdmin) {
    next();
  } else {
    // Redirect to home page if not admin (for HTML requests)
    if (req.accepts('html')) {
      return res.redirect('/');
    }
    // Return JSON error for API requests
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Routes

// Serve main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/profile', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API Routes

// Authentication
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 0)';
    
    db.query(query, [name, email, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Registration failed' });
      }
      res.json({ success: true, message: 'Registration successful' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Login failed' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.isAdmin = user.is_admin === 1;
    
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin === 1
      }
    });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/user', (req, res) => {
  if (req.session.userId) {
    res.json({
      loggedIn: true,
      user: {
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.userEmail,
        isAdmin: req.session.isAdmin
      }
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// Products
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products ORDER BY created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    res.json(results);
  });
});

app.get('/api/products/:id', (req, res) => {
  const query = 'SELECT * FROM products WHERE id = ?';
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = results[0];
    
    // Get all images for this product
    const imageQuery = 'SELECT image_path FROM product_images WHERE product_id = ? ORDER BY display_order ASC';
    db.query(imageQuery, [req.params.id], (err, imageResults) => {
      if (!err && imageResults.length > 0) {
        product.images = imageResults.map(img => img.image_path);
      } else {
        // Fallback to single image if no images in product_images table
        product.images = product.image ? [product.image] : [];
      }
      res.json(product);
    });
  });
});

// Admin - Add Product
app.post('/api/admin/products', requireAdmin, upload.array('images', 10), (req, res) => {
  const { name, description, material, price, stock } = req.body;
  const images = req.files ? req.files.map(file => file.filename) : [];
  const primaryImage = images.length > 0 ? images[0] : null;
  
  const query = 'INSERT INTO products (name, description, material, price, stock, image) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [name, description, material || 'Cotton', price, stock, primaryImage], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to add product' });
    }
    
    const productId = result.insertId;
    
    // Insert all images into product_images table
    if (images.length > 0) {
      const imageValues = images.map((img, index) => [productId, img, index]);
      const imageQuery = 'INSERT INTO product_images (product_id, image_path, display_order) VALUES ?';
      db.query(imageQuery, [imageValues], (err) => {
        if (err) {
          console.error('Failed to save product images:', err);
        }
      });
    }
    
    res.json({ success: true, productId });
  });
});

// Admin - Update Product
app.put('/api/admin/products/:id', requireAdmin, upload.array('images', 10), (req, res) => {
  const { name, description, material, price, stock } = req.body;
  const productId = req.params.id;
  const newImages = req.files ? req.files.map(file => file.filename) : [];
  
  // Get current primary image
  db.query('SELECT image FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
    
    const currentPrimaryImage = results[0]?.image;
    const primaryImage = newImages.length > 0 ? newImages[0] : currentPrimaryImage;
    
    const query = 'UPDATE products SET name = ?, description = ?, material = ?, price = ?, stock = ?, image = ? WHERE id = ?';
    db.query(query, [name, description, material || 'Cotton', price, stock, primaryImage, productId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update product' });
      }
      
      // Add new images to product_images table
      if (newImages.length > 0) {
        // Get current max display_order
        db.query('SELECT MAX(display_order) as max_order FROM product_images WHERE product_id = ?', [productId], (err, orderResults) => {
          const maxOrder = orderResults[0]?.max_order ?? -1;
          const imageValues = newImages.map((img, index) => [productId, img, maxOrder + index + 1]);
          const imageQuery = 'INSERT INTO product_images (product_id, image_path, display_order) VALUES ?';
          db.query(imageQuery, [imageValues], (err) => {
            if (err) {
              console.error('Failed to save product images:', err);
            }
          });
        });
      }
      
      res.json({ success: true });
    });
  });
});

// Admin - Delete Product
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const query = 'DELETE FROM products WHERE id = ?';
  db.query(query, [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete product' });
    }
    res.json({ success: true });
  });
});

// Cart
app.get('/api/cart', requireAuth, (req, res) => {
  const query = `
    SELECT c.*, p.name, p.price, p.image 
    FROM cart c 
    JOIN products p ON c.product_id = p.id 
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `;
  db.query(query, [req.session.userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch cart' });
    }
    res.json(results);
  });
});

app.post('/api/cart', requireAuth, (req, res) => {
  const { productId, quantity, size, customSizeData } = req.body;
  
  // Check if item already in cart with same size
  const checkQuery = 'SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND (size = ? OR (size IS NULL AND ? IS NULL))';
  db.query(checkQuery, [req.session.userId, productId, size || null, size || null], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to add to cart' });
    }
    
    if (results.length > 0) {
      // Update quantity for same product and size
      const updateQuery = 'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ? AND (size = ? OR (size IS NULL AND ? IS NULL))';
      db.query(updateQuery, [quantity, req.session.userId, productId, size || null, size || null], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update cart' });
        }
        res.json({ success: true });
      });
    } else {
      // Insert new item with size
      const insertQuery = 'INSERT INTO cart (user_id, product_id, quantity, size, custom_size_data) VALUES (?, ?, ?, ?, ?)';
      db.query(insertQuery, [req.session.userId, productId, quantity, size || null, customSizeData || null], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to add to cart' });
        }
        res.json({ success: true });
      });
    }
  });
});

app.delete('/api/cart/:id', requireAuth, (req, res) => {
  const query = 'DELETE FROM cart WHERE id = ? AND user_id = ?';
  db.query(query, [req.params.id, req.session.userId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to remove from cart' });
    }
    res.json({ success: true });
  });
});

// Orders
app.post('/api/orders', requireAuth, (req, res) => {
  const { items, total } = req.body;
  
  const orderQuery = 'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)';
  db.query(orderQuery, [req.session.userId, total, 'pending'], (err, orderResult) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create order' });
    }
    
    const orderId = orderResult.insertId;
    // Get cart items with size data
    const cartQuery = 'SELECT * FROM cart WHERE user_id = ?';
    db.query(cartQuery, [req.session.userId], (err, cartItems) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch cart items' });
      }
      
      // Create a map of cart items by product_id and size
      const cartMap = {};
      cartItems.forEach(item => {
        const key = `${item.product_id}_${item.size || 'no_size'}`;
        cartMap[key] = item;
      });
      
      // Build order items with size data
      const orderItemsQuery = 'INSERT INTO order_items (order_id, product_id, quantity, price, size, custom_size_data) VALUES ?';
      const values = items.map(item => {
        const key = `${item.product_id}_${item.size || 'no_size'}`;
        const cartItem = cartMap[key];
        return [
          orderId, 
          item.product_id, 
          item.quantity, 
          item.price,
          cartItem ? cartItem.size : null,
          cartItem ? cartItem.custom_size_data : null
        ];
      });
      
      db.query(orderItemsQuery, [values], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to create order items' });
        }
        
        // Clear cart
        db.query('DELETE FROM cart WHERE user_id = ?', [req.session.userId], () => {});
        
        res.json({ success: true, orderId });
      });
    });
  });
});

app.get('/api/orders', requireAuth, (req, res) => {
  let query;
  if (req.session.isAdmin) {
    query = `
      SELECT o.*, u.name as user_name, u.email 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `;
  } else {
    query = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
  }
  
  db.query(query, req.session.isAdmin ? [] : [req.session.userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
    res.json(results);
  });
});

// Admin - Update Order Status
app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const { status } = req.body;
  const query = 'UPDATE orders SET status = ? WHERE id = ?';
  db.query(query, [status, req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update order' });
    }
    res.json({ success: true });
  });
});

// Admin - Get Order Details (with items)
app.get('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const orderId = req.params.id;
  
  // Get order info
  const orderQuery = `
    SELECT o.*, u.name as user_name, u.email 
    FROM orders o 
    JOIN users u ON o.user_id = u.id 
    WHERE o.id = ?
  `;
  
  db.query(orderQuery, [orderId], (err, orderResults) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch order' });
    }
    
    if (orderResults.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResults[0];
    
    // Get order items
    const itemsQuery = `
      SELECT oi.*, p.name as product_name, p.image 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ?
    `;
    
    db.query(itemsQuery, [orderId], (err, itemsResults) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch order items' });
      }
      
      order.items = itemsResults;
      res.json(order);
    });
  });
});

// Admin - Get All Users
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const query = 'SELECT id, name, email, is_admin, created_at FROM users ORDER BY created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    res.json(results);
  });
});

// Admin - Get User Details
app.get('/api/admin/users/:id', requireAdmin, (req, res) => {
  const query = 'SELECT id, name, email, is_admin, created_at FROM users WHERE id = ?';
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(results[0]);
  });
});

// Admin - Update User
app.put('/api/admin/users/:id', requireAdmin, (req, res) => {
  const { name, email, is_admin } = req.body;
  const userId = req.params.id;
  
  // Prevent admin from removing their own admin status
  if (userId == req.session.userId && is_admin !== 1) {
    return res.status(400).json({ error: 'Cannot remove your own admin status' });
  }
  
  const query = 'UPDATE users SET name = ?, email = ?, is_admin = ? WHERE id = ?';
  db.query(query, [name, email, is_admin ? 1 : 0, userId], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: 'Failed to update user' });
    }
    res.json({ success: true });
  });
});

// Admin - Delete User
app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  const userId = req.params.id;
  
  // Prevent admin from deleting themselves
  if (userId == req.session.userId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  const query = 'DELETE FROM users WHERE id = ?';
  db.query(query, [userId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    res.json({ success: true });
  });
});

// Contact
app.post('/api/contact', requireAuth, (req, res) => {
  const { subject, message } = req.body;
  const query = 'INSERT INTO contacts (user_id, subject, message, status) VALUES (?, ?, ?, ?)';
  db.query(query, [req.session.userId, subject, message, 'new'], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to send message' });
    }
    res.json({ success: true });
  });
});

app.get('/api/admin/contacts', requireAdmin, (req, res) => {
  const query = `
    SELECT c.*, u.name as user_name, u.email 
    FROM contacts c 
    JOIN users u ON c.user_id = u.id 
    ORDER BY c.created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch contacts' });
    }
    res.json(results);
  });
});

// User Profile
app.get('/api/profile', requireAuth, (req, res) => {
  const query = 'SELECT id, name, email, created_at FROM users WHERE id = ?';
  db.query(query, [req.session.userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
    res.json(results[0]);
  });
});

app.put('/api/profile', requireAuth, (req, res) => {
  const { name, email } = req.body;
  const query = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
  db.query(query, [name, email, req.session.userId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }
    req.session.userName = name;
    req.session.userEmail = email;
    res.json({ success: true });
  });
});

// Admin Dashboard Stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const stats = {};
  
  db.query('SELECT COUNT(*) as count FROM products', (err, results) => {
    if (!err) stats.products = results[0].count;
    
    db.query('SELECT COUNT(*) as count FROM orders', (err, results) => {
      if (!err) stats.orders = results[0].count;
      
      db.query('SELECT COUNT(*) as count FROM orders WHERE status = "pending"', (err, results) => {
        if (!err) stats.pendingOrders = results[0].count;
        
        db.query('SELECT COUNT(*) as count FROM contacts WHERE status = "new"', (err, results) => {
          if (!err) stats.newContacts = results[0].count;
          
          res.json(stats);
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

