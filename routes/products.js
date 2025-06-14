const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all products
router.get('/', authenticate, async (req, res) => {
  try {
    const [products] = await db.query(
      `SELECT p.*, COUNT(pv.id) as variant_count
       FROM products p
       LEFT JOIN product_variants pv ON p.id = pv.product_id
       GROUP BY p.id
       ORDER BY p.title`
    );

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product with variants
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [[product]] = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const [variants] = await db.query(
      'SELECT * FROM product_variants WHERE product_id = ?',
      [id]
    );

    product.variants = variants;

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
router.post('/', authenticate, authorize('super_admin'), [
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('base_price').isFloat({ min: 0 }),
  body('default_payout_type').isIn(['fixed', 'percentage']),
  body('default_payout_value').isFloat({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, base_price, default_payout_type, default_payout_value } = req.body;

  try {
    const [result] = await db.execute(
      `INSERT INTO products (title, description, base_price, default_payout_type, default_payout_value)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, base_price, default_payout_type, default_payout_value]
    );

    res.status(201).json({
      message: 'Product created successfully',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Create product variant
router.post('/:id/variants', authenticate, authorize('super_admin'), [
  body('name').notEmpty().trim(),
  body('price').isFloat({ min: 0 }),
  body('duration').optional().isInt({ min: 0 }),
  body('payout_amount').isFloat({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, price, duration, payout_amount } = req.body;

  try {
    const [result] = await db.execute(
      `INSERT INTO product_variants (product_id, name, price, duration, payout_amount)
       VALUES (?, ?, ?, ?, ?)`,
      [id, name, price, duration, payout_amount]
    );

    res.status(201).json({
      message: 'Product variant created successfully',
      variantId: result.insertId
    });
  } catch (error) {
    console.error('Error creating product variant:', error);
    res.status(500).json({ error: 'Failed to create product variant' });
  }
});

module.exports = router;