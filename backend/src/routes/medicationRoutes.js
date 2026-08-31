const { Router } = require('express');
const { body, param, query } = require('express-validator');
const medicationController = require('../controllers/medicationController');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { MEDICATION_UNITS } = require('../utils/consts');

const router = Router();

router.use(requireAuth);

router.get('/', [query('department').optional().trim()], asyncHandler(medicationController.list));
router.get('/departments', asyncHandler(medicationController.departments));
router.get('/alerts', asyncHandler(medicationController.alerts));

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('currentStock').optional().isInt({ min: 0 }),
    body('unit').notEmpty().withMessage('Unit is required').isIn(MEDICATION_UNITS),
    body('alertThresholdDays').optional().isInt({ min: 1 }),
    body('department').optional().trim().isLength({ max: 50 }),
  ],
  asyncHandler(medicationController.create)
);

router.delete('/:id', [param('id').isInt()], asyncHandler(medicationController.remove));

router.post(
  '/:id/withdraw',
  [param('id').isInt(), body('quantity').isInt({ min: 1 })],
  asyncHandler(medicationController.withdraw)
);

router.post(
  '/:id/restock',
  [param('id').isInt(), body('quantity').isInt({ min: 1 })],
  asyncHandler(medicationController.restock)
);

module.exports = router;
