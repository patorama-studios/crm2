const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

const jobValidation = [
  body('customer_id').isInt().withMessage('Valid customer ID required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('date').isDate().withMessage('Valid date required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time required (HH:MM)'),
  body('assigned_creator_id').optional().isInt(),
  body('assigned_editor_id').optional().isInt(),
  body('products').optional().isArray(),
  body('products.*.product_id').isInt(),
  body('products.*.price').isFloat({ min: 0 }),
  body('products.*.payout_amount').isFloat({ min: 0 })
];

router.post('/', 
  authenticate, 
  authorize('super_admin', 'team_manager'),
  jobValidation,
  jobController.createJob
);

router.get('/', authenticate, jobController.getJobs);

router.get('/:id', authenticate, jobController.getJobById);

router.patch('/:id', 
  authenticate,
  authorize('super_admin', 'team_manager'),
  jobController.updateJob
);

router.delete('/:id',
  authenticate,
  authorize('super_admin'),
  jobController.deleteJob
);

module.exports = router;