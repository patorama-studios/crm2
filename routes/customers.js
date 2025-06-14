const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all customers
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT c.*, u.name as team_leader_name
      FROM customers c
      LEFT JOIN users u ON c.team_leader_user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];

    if (search) {
      query += ' AND (c.agency_name LIKE ? OR c.contact_name LIKE ? OR c.email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [customers] = await db.query(query, params);

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM customers WHERE 1=1' +
      (search ? ' AND (agency_name LIKE ? OR contact_name LIKE ? OR email LIKE ?)' : ''),
      search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []
    );

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [[customer]] = await db.query(
      `SELECT c.*, u.name as team_leader_name
       FROM customers c
       LEFT JOIN users u ON c.team_leader_user_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [jobs] = await db.query(
      `SELECT j.*, 
              u1.name as creator_name, 
              u2.name as editor_name
       FROM jobs j
       LEFT JOIN users u1 ON j.assigned_creator_id = u1.id
       LEFT JOIN users u2 ON j.assigned_editor_id = u2.id
       WHERE j.customer_id = ?
       ORDER BY j.date DESC
       LIMIT 10`,
      [id]
    );

    customer.recent_jobs = jobs;

    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer
router.post('/', authenticate, authorize('super_admin', 'team_manager'), [
  body('agency_name').notEmpty().trim(),
  body('contact_name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('billing_address').optional().trim(),
  body('team_leader_user_id').optional().isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { agency_name, contact_name, email, phone, billing_address, team_leader_user_id } = req.body;

  try {
    const [result] = await db.execute(
      `INSERT INTO customers (agency_name, contact_name, email, phone, billing_address, team_leader_user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [agency_name, contact_name, email, phone, billing_address, team_leader_user_id]
    );

    res.status(201).json({
      message: 'Customer created successfully',
      customerId: result.insertId
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.patch('/:id', authenticate, authorize('super_admin', 'team_manager'), async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const allowedUpdates = ['agency_name', 'contact_name', 'email', 'phone', 
                          'billing_address', 'team_leader_user_id'];
    
    const updateFields = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .map(key => `${key} = ?`);
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const values = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .map(key => updates[key]);
    
    values.push(id);

    const [result] = await db.execute(
      `UPDATE customers SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  const { id } = req.params;
  
  try {
    const [[customer]] = await db.query(
      'SELECT COUNT(*) as job_count FROM jobs WHERE customer_id = ?',
      [id]
    );

    if (customer.job_count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing jobs' 
      });
    }

    const [result] = await db.execute('DELETE FROM customers WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;