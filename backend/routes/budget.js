const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getBudget, updateBudget } = require('../controllers/budgetController');

router.use(protect);
router.get('/', getBudget);
router.put('/', updateBudget);

module.exports = router;
