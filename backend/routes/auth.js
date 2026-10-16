const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  logout,
  getMe,
  generateInvite,
  linkPartner,
  unlinkPartner,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/generate-invite', protect, generateInvite);
router.post('/link-partner', protect, linkPartner);
router.post('/unlink-partner', protect, unlinkPartner);

module.exports = router;
