const { validationResult, body, param, query } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const validateLogin = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

const validateUser = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('role').isIn(['admin', 'b1', 'b2', 'b3', 'accountant']).withMessage('Invalid role'),
  handleValidation,
];

const validateStore = [
  body('code').trim().notEmpty().withMessage('Store code is required'),
  body('name').trim().notEmpty().withMessage('Store name is required'),
  handleValidation,
];

const validateItem = [
  body('code').trim().notEmpty().withMessage('Item code is required'),
  body('name').trim().notEmpty().withMessage('Item name is required'),
  handleValidation,
];

const validatePrice = [
  body('item_id').isInt().withMessage('Item ID is required'),
  body('price').isDecimal().withMessage('Valid price is required'),
  body('effective_date').isDate().withMessage('Effective date is required'),
  handleValidation,
];

const validateOrder = [
  body('from_store_id').isInt().withMessage('Source store is required'),
  body('to_store_id').isInt().withMessage('Destination store is required'),
  body('lines').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('lines.*.item_id').isInt().withMessage('Item ID is required'),
  body('lines.*.quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  handleValidation,
];

const validateInvoice = [
  body('invoice_number').trim().notEmpty().withMessage('Invoice number is required'),
  body('paid_by_store_id').isInt().withMessage('Paying store is required'),
  body('invoice_date').isDate().withMessage('Invoice date is required'),
  body('total_amount').isDecimal().withMessage('Total amount is required'),
  handleValidation,
];

const validateId = [
  param('id').isInt().withMessage('Valid ID is required'),
  handleValidation,
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidation,
];

module.exports = {
  handleValidation,
  validateLogin,
  validateUser,
  validateStore,
  validateItem,
  validatePrice,
  validateOrder,
  validateInvoice,
  validateId,
  validatePagination,
};
