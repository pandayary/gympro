-- Create the database
CREATE DATABASE IF NOT EXISTS gym_db;
USE gym_db;

-- Create contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    status ENUM('new', 'read', 'replied') DEFAULT 'new'
);

-- Create members table
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    aadhaar_no VARCHAR(12) UNIQUE,
    membership_type ENUM('basic', 'premium', 'vip') DEFAULT 'basic',
    join_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'
);

-- Create trainers table
CREATE TABLE IF NOT EXISTS trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    specialty VARCHAR(100),
    certification VARCHAR(100),
    experience_years INT,
    status ENUM('active', 'inactive') DEFAULT 'active'
);

-- Create equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    status ENUM('available', 'maintenance', 'out_of_order') DEFAULT 'available',
    last_maintenance_date DATE
);

-- Create supplements table
CREATE TABLE IF NOT EXISTS supplements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    status ENUM('available', 'out_of_stock') DEFAULT 'available'
); 