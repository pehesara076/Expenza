const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getIncomes, createIncome, updateIncome, deleteIncome } = require('../controllers/incomeController');

router.use(protect);
router.get('/', getIncomes);
router.post('/', createIncome);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

module.exports = router;
