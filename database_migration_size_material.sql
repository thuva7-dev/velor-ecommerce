-- Migration: Add material and size fields
-- Run this SQL to update existing database

USE velor_db;

-- Add material column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS material VARCHAR(200) DEFAULT 'Cotton';

-- Add size column to cart table
ALTER TABLE cart ADD COLUMN IF NOT EXISTS size VARCHAR(50) DEFAULT NULL;
ALTER TABLE cart ADD COLUMN IF NOT EXISTS custom_size_data TEXT DEFAULT NULL;

-- Add size column to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size VARCHAR(50) DEFAULT NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS custom_size_data TEXT DEFAULT NULL;

-- Update unique constraint for cart to include size
ALTER TABLE cart DROP INDEX IF EXISTS unique_cart_item;
ALTER TABLE cart ADD UNIQUE KEY unique_cart_item (user_id, product_id, size);

