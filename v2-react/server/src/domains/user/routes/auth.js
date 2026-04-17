const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../../../middleware/auth');
const { validateLogin } = require('../../../middleware/validate');

router.post('/login', validateLogin, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;