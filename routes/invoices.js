const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get all invoices
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, customer_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT i.*, j.address, j.date as job_date, c.agency_name
      FROM invoices i
      JOIN jobs j ON i.job_id = j.id
      JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;
    
    const params = [];

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    
    if (customer_id) {
      query += ' AND i.customer_id = ?';
      params.push(customer_id);
    }

    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [invoices] = await db.query(query, params);

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Create invoice for job
router.post('/', authenticate, authorize('super_admin', 'team_manager'), async (req, res) => {
  const { job_id } = req.body;
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get job details
    const [[job]] = await connection.query(
      'SELECT customer_id FROM jobs WHERE id = ?',
      [job_id]
    );

    if (!job) {
      throw new Error('Job not found');
    }

    // Check if invoice already exists
    const [[existing]] = await connection.query(
      'SELECT id FROM invoices WHERE job_id = ?',
      [job_id]
    );

    if (existing) {
      throw new Error('Invoice already exists for this job');
    }

    // Calculate total from job products
    const [[{ total }]] = await connection.query(
      'SELECT SUM(price) as total FROM job_products WHERE job_id = ?',
      [job_id]
    );

    // Create invoice
    const [result] = await connection.execute(
      `INSERT INTO invoices (job_id, customer_id, total_amount, status)
       VALUES (?, ?, ?, ?)`,
      [job_id, job.customer_id, total || 0, 'draft']
    );

    await connection.commit();
    
    res.status(201).json({ 
      message: 'Invoice created successfully',
      invoiceId: result.insertId 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: error.message || 'Failed to create invoice' });
  } finally {
    connection.release();
  }
});

// Sync with Xero (placeholder)
router.post('/:id/sync-xero', authenticate, authorize('super_admin', 'team_manager'), async (req, res) => {
  const { id } = req.params;
  
  try {
    // TODO: Implement Xero integration
    // For now, just update the status
    await db.execute(
      'UPDATE invoices SET status = ?, xero_invoice_id = ? WHERE id = ?',
      ['sent', `XERO-${Date.now()}`, id]
    );

    res.json({ message: 'Invoice synced with Xero' });
  } catch (error) {
    console.error('Error syncing with Xero:', error);
    res.status(500).json({ error: 'Failed to sync with Xero' });
  }
});

// Check payment status (placeholder)
router.get('/:id/payment-status', authenticate, async (req, res) => {
  const { id } = req.params;
  
  try {
    const [[invoice]] = await db.query(
      'SELECT stripe_payment_status, stripe_payment_intent_id FROM invoices WHERE id = ?',
      [id]
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // TODO: Implement Stripe integration
    res.json({ 
      status: invoice.stripe_payment_status || 'pending',
      payment_intent: invoice.stripe_payment_intent_id 
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

module.exports = router;