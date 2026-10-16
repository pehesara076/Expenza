const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDebts,
  createDebt,
  updateDebt,
  deleteDebt,
  addPayment,
  deletePayment,
} = require('../controllers/debtController');

router.use(protect);
router.get('/', getDebts);
router.post('/', createDebt);
router.put('/:id', updateDebt);
router.delete('/:id', deleteDebt);
router.post('/:id/payments', addPayment);
router.delete('/:id/payments/:paymentId', deletePayment);

module.exports = router;
