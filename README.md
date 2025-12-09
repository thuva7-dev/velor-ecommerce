# Velor E-commerce Website

A modern, minimalist e-commerce website built with HTML, CSS, JavaScript, Node.js, Express.js, and MySQL.

## Features

### Main Website
- **Home Page**: Beautiful hero section with featured products
- **About Page**: Information about the Velor brand
- **Products Page**: Browse and view all products (no login required)
- **Contact Page**: Send messages to admin (login required)

### User Features
- User registration and login
- View products without login
- Add to cart (login required)
- Place orders (login required)
- User profile with edit functionality
- View order history

### Admin Panel
- Dashboard with statistics
- Manage products (add, edit, delete)
- Upload product images
- Manage orders and update order status
- View and manage customer contacts
- Stock management

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: Express Sessions
- **File Upload**: Multer

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

### Setup Steps

1. **Clone or download the project**
   ```bash
   cd velor-ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MySQL database**
   - Open MySQL command line or phpMyAdmin
   - Run the SQL file to create the database and tables:
   ```bash
   mysql -u root -p < database.sql
   ```
   Or import `database.sql` using phpMyAdmin

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update the database credentials:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=velor_db
   ```

5. **Create admin user**
   - Run the setup script:
   ```bash
   node setup-admin.js
   ```
   - Or manually register an admin user through the registration endpoint
   - To make a user admin, update the database:
   ```sql
   UPDATE users SET is_admin = 1 WHERE email = 'your-email@example.com';
   ```

6. **Create uploads directory**
   ```bash
   mkdir uploads
   ```
   (This should already be created, but ensure it exists)

7. **Start the server**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

8. **Access the website**
   - Main site: http://localhost:3000
   - Admin panel: http://localhost:3000/admin (requires admin login)

## Default Admin Credentials

After running the setup script, you can use:
- **Email**: admin@velor.com
- **Password**: admin123

**Important**: Change the admin password after first login!

## Project Structure

```
velor-ecommerce/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js
│   │   ├── home.js
│   │   ├── products.js
│   │   ├── contact.js
│   │   ├── profile.js
│   │   └── admin.js
│   ├── index.html
│   ├── about.html
│   ├── products.html
│   ├── contact.html
│   ├── profile.html
│   └── admin.html
├── uploads/
│   └── (product images will be stored here)
├── server.js
├── database.sql
├── package.json
├── .env.example
└── README.md
```

## Database Schema

- **users**: User accounts (customers and admins)
- **products**: Product catalog
- **cart**: Shopping cart items
- **orders**: Customer orders
- **order_items**: Individual items in orders
- **contacts**: Customer contact messages

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user info

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product

### Cart (Requires Auth)
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `DELETE /api/cart/:id` - Remove item from cart

### Orders (Requires Auth)
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders (or all orders if admin)

### Contact (Requires Auth)
- `POST /api/contact` - Send contact message

### Profile (Requires Auth)
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Admin (Requires Admin Auth)
- `GET /api/admin/stats` - Get dashboard statistics
- `POST /api/admin/products` - Add new product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/contacts` - Get all contact messages
- `PUT /api/admin/orders/:id` - Update order status

## Security Notes

- Passwords are hashed using bcrypt
- Sessions are used for authentication
- Admin routes are protected
- File uploads are restricted to images only
- SQL injection protection via parameterized queries

## Troubleshooting

1. **Database connection error**
   - Check MySQL is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **Image upload not working**
   - Check `uploads/` directory exists and is writable
   - Verify file size is under 5MB
   - Ensure file is an image (jpg, png, gif)

3. **Session not persisting**
   - Check browser allows cookies
   - Verify session secret in server.js

4. **Admin access denied**
   - Verify user has `is_admin = 1` in database
   - Check session is valid

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please check the code comments or database schema.

