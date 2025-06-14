-- Patorama Studios CRM Database Schema - Production
-- MySQL Database Schema for Real Estate Media Business
-- Production Database: patoramacom_crm

-- Use the existing database
USE patoramacom_crm;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'content_creator', 'editor', 'team_manager') NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

-- 2. Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    billing_address TEXT,
    team_leader_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_leader_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_agency_name (agency_name),
    INDEX idx_email (email)
);

-- 3. Products table (before product_variants due to FK dependency)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_serviceable BOOLEAN DEFAULT TRUE,
    base_price DECIMAL(10, 2) NOT NULL,
    default_payout_type ENUM('fixed', 'percentage') NOT NULL DEFAULT 'fixed',
    default_payout_value DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_title (title),
    INDEX idx_is_serviceable (is_serviceable)
);

-- 4. Product variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration INT COMMENT 'Duration in minutes',
    payout_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id)
);

-- 5. Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    address TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status ENUM('scheduled', 'in_progress', 'editing', 'completed', 'cancelled', 'delivered') DEFAULT 'scheduled',
    assigned_creator_id INT,
    assigned_editor_id INT,
    notes TEXT,
    created_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_creator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_editor_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_customer_id (customer_id),
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_assigned_creator (assigned_creator_id),
    INDEX idx_assigned_editor (assigned_editor_id)
);

-- 6. Job products table (junction table)
CREATE TABLE IF NOT EXISTS job_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    payout_amount DECIMAL(10, 2) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration INT COMMENT 'Duration in minutes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    UNIQUE KEY unique_job_product_variant (job_id, product_id, variant_id),
    INDEX idx_job_id (job_id)
);

-- 7. Uploads table
CREATE TABLE IF NOT EXISTS uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    uploaded_by_user_id INT NOT NULL,
    file_type ENUM('photo', 'video', 'document', 'other') NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_job_id (job_id),
    INDEX idx_uploaded_by (uploaded_by_user_id),
    INDEX idx_is_final (is_final)
);

-- 8. Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    customer_id INT NOT NULL,
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    xero_invoice_id VARCHAR(255),
    stripe_payment_status VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    total_amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    due_date DATE,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE RESTRICT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_job_invoice (job_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status),
    INDEX idx_xero_invoice_id (xero_invoice_id)
);

-- 9. Payouts table
CREATE TABLE IF NOT EXISTS payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'approved', 'paid', 'cancelled') DEFAULT 'pending',
    paid_on DATETIME,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE RESTRICT,
    INDEX idx_user_id (user_id),
    INDEX idx_job_id (job_id),
    INDEX idx_status (status)
);

-- 10. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT,
    message TEXT NOT NULL,
    type ENUM('assignment', 'update', 'upload', 'payment', 'system') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- 11. Activity logs table (for audit trail)
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_user_id (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
);

-- 12. Customer contacts table (for multiple contacts per customer)
CREATE TABLE IF NOT EXISTS customer_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id)
);

-- Create views for common queries

-- View for job overview with customer and team details
CREATE OR REPLACE VIEW job_overview AS
SELECT 
    j.id,
    j.address,
    j.date,
    j.time,
    j.status,
    j.notes,
    c.agency_name,
    c.contact_name AS customer_contact,
    creator.name AS creator_name,
    editor.name AS editor_name,
    manager.name AS created_by,
    j.created_at
FROM jobs j
LEFT JOIN customers c ON j.customer_id = c.id
LEFT JOIN users creator ON j.assigned_creator_id = creator.id
LEFT JOIN users editor ON j.assigned_editor_id = editor.id
LEFT JOIN users manager ON j.created_by_user_id = manager.id;

-- View for invoice summary
CREATE OR REPLACE VIEW invoice_summary AS
SELECT 
    i.id,
    i.status,
    i.total_amount,
    i.due_date,
    j.id AS job_id,
    j.address,
    j.date AS job_date,
    c.agency_name,
    c.email AS customer_email
FROM invoices i
JOIN jobs j ON i.job_id = j.id
JOIN customers c ON i.customer_id = c.id;

-- Insert production admin user
-- Password: 'PatoramaAdmin2024!' (hashed with bcrypt)
INSERT IGNORE INTO users (name, email, password_hash, role) VALUES
('Patorama Admin', 'admin@patorama.com.au', '$2b$10$XQRuuPjlLV4wf5x9qYnGIuhEDLJcLz4xFGQ7GqHa.8RhK3.YMhLKi', 'super_admin');

-- Insert sample products for Patorama Studios
INSERT IGNORE INTO products (title, description, base_price, default_payout_type, default_payout_value) VALUES
('Photography Package', 'Standard real estate photography with professional editing', 299.00, 'fixed', 150.00),
('Video Tour', 'Professional video walkthrough with cinematic editing', 599.00, 'percentage', 50.00),
('Drone Photography', 'Aerial photography and video with professional pilot', 399.00, 'fixed', 200.00),
('Virtual Staging', 'Digital furniture staging for empty properties', 99.00, 'fixed', 50.00),
('Twilight Photography', 'Professional dusk photography for enhanced curb appeal', 199.00, 'fixed', 100.00),
('Floor Plans', 'Professional architectural floor plan creation', 149.00, 'fixed', 75.00);

-- Insert sample product variants
INSERT IGNORE INTO product_variants (product_id, name, price, duration, payout_amount) VALUES
(1, 'Basic Package (15 photos)', 249.00, 60, 125.00),
(1, 'Premium Package (25 photos)', 299.00, 90, 150.00),
(1, 'Luxury Package (35+ photos)', 399.00, 120, 200.00),
(2, 'Basic Video (2 minutes)', 499.00, 120, 250.00),
(2, 'Premium Video (3-4 minutes)', 599.00, 180, 300.00),
(2, 'Cinematic Video (5+ minutes)', 799.00, 240, 400.00),
(3, 'Basic Drone (5 shots)', 299.00, 45, 150.00),
(3, 'Premium Drone (10+ shots)', 399.00, 60, 200.00),
(3, 'Drone Video Package', 499.00, 90, 250.00);

-- Insert sample customer for testing
INSERT IGNORE INTO customers (agency_name, contact_name, email, phone, billing_address) VALUES
('Patorama Test Agency', 'Test Contact', 'test@patorama.com.au', '+61 2 1234 5678', '123 Test Street, Canberra, ACT 2600');

-- Create upload directory structure (this will be handled by the application)
-- Ensure proper permissions are set on the server