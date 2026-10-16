const Debt = require('../models/Debt');

// GET /api/debts
const getDebts = async (req, res) => {
  try {
    const { direction, status } = req.query;
    const filter = { userId: req.user._id };
    if (direction) filter.direction = direction;
    if (status) filter.status = status;

    const debts = await Debt.find(filter).sort({ date: -1 });

    // Summary
    const iOwe = debts
      .filter((d) => d.direction === 'i_owe' && d.status !== 'Settled')
      .reduce((s, d) => s + d.remaining, 0);
    const owedToMe = debts
      .filter((d) => d.direction === 'owed_to_me' && d.status !== 'Settled')
      .reduce((s, d) => s + d.remaining, 0);

    res.json({ debts, summary: { iOwe, owedToMe, net: owedToMe - iOwe } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/debts
const createDebt = async (req, res) => {
  try {
    const { direction, personName, amount, date, dueDate, note } = req.body;
    if (!direction || !personName || !amount) {
      return res.status(400).json({ message: 'direction, personName, and amount are required' });
    }

    const debt = new Debt({
      userId: req.user._id,
      direction,
      personName,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      note: note || '',
    });
    await debt.save();
    res.status(201).json(debt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/debts/:id
const updateDebt = async (req, res) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, userId: req.user._id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });

    const { personName, amount, date, dueDate, note } = req.body;
    if (personName !== undefined) debt.personName = personName;
    if (amount !== undefined) debt.amount = Number(amount);
    if (date !== undefined) debt.date = new Date(date);
    if (dueDate !== undefined) debt.dueDate = dueDate ? new Date(dueDate) : null;
    if (note !== undefined) debt.note = note;

    await debt.save(); // pre-save recalculates remaining & status
    res.json(debt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/debts/:id
const deleteDebt = async (req, res) => {
  try {
    const debt = await Debt.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    res.json({ message: 'Debt deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/debts/:id/payments
const addPayment = async (req, res) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, userId: req.user._id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });

    const { amount, date, note } = req.body;
    if (!amount) return res.status(400).json({ message: 'Payment amount is required' });

    debt.payments.push({
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      note: note || '',
    });
    await debt.save(); // auto-recalculates
    res.json(debt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/debts/:id/payments/:paymentId
const deletePayment = async (req, res) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, userId: req.user._id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });

    debt.payments = debt.payments.filter((p) => !p._id.equals(req.params.paymentId));
    await debt.save();
    res.json(debt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getDebts, createDebt, updateDebt, deleteDebt, addPayment, deletePayment };
