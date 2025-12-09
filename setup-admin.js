// Script to create default admin user
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'velor_db'
});

async function createAdmin() {
  try {
    const adminEmail = 'admin@velor.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Check if admin already exists
    db.query('SELECT * FROM users WHERE email = ?', [adminEmail], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        process.exit(1);
      }
      
      if (results.length > 0) {
        // Update existing admin
        db.query(
          'UPDATE users SET password = ?, is_admin = 1 WHERE email = ?',
          [hashedPassword, adminEmail],
          (err) => {
            if (err) {
              console.error('Failed to update admin:', err);
              process.exit(1);
            }
            console.log('Admin user updated successfully!');
            console.log('Email:', adminEmail);
            console.log('Password:', adminPassword);
            console.log('\n⚠️  IMPORTANT: Change the password after first login!');
            db.end();
          }
        );
      } else {
        // Create new admin
        db.query(
          'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 1)',
          ['Admin', adminEmail, hashedPassword],
          (err) => {
            if (err) {
              console.error('Failed to create admin:', err);
              process.exit(1);
            }
            console.log('Admin user created successfully!');
            console.log('Email:', adminEmail);
            console.log('Password:', adminPassword);
            console.log('\n⚠️  IMPORTANT: Change the password after first login!');
            db.end();
          }
        );
      }
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    console.log('\nPlease make sure:');
    console.log('1. MySQL is running');
    console.log('2. Database "velor_db" exists (run database.sql first)');
    console.log('3. Credentials in .env are correct');
    process.exit(1);
  }
  
  console.log('Connected to database');
  createAdmin();
});

