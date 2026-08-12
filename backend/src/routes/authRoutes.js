const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

const usernameRule = body('username')
  .trim()
  .isLength({ min: 3, max: 50 })
  .withMessage('Username must be 3-50 characters');

const passwordRule = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters');

router.post(
  '/register',
  [usernameRule, passwordRule, body('role').optional().isIn(['pharmacist', 'admin'])],
  asyncHandler(authController.register)
);

router.post(
  '/login',
  [body('username').trim().notEmpty(), body('password').notEmpty()],
  asyncHandler(authController.login)
);

router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', requireAuth, asyncHandler(authController.me));

module.exports = router;
