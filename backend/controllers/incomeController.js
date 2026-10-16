const Income = require('../models/Income');

// GET /api/income
const getIncomes = async (req, res) => {
  try {
    const { from, to, page = 1, limit = 50 } = req.query;
    const filter = { userId: req.user._id };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const incomes = await Income.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Income.countDocuments(filter);
    const totalAmount = await Income.aggregate([
      { $match: filter },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]);

    res.json({
      incomes,
      total,
      totalAmount: totalAmount[0]?.sum || 0,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/income
const createIncome = async (req, res) => {
  try {
    const { amount, source, date, note } = req.body;
    if (!amount || !source) {
      return res.status(400).json({ message: 'Amount and source are required' });
    }
    const income = await Income.create({
      userId: req.user._id,
      amount: Number(amount),
      source,
      date: date ? new Date(date) : new Date(),
      note: note || '',
    });
    res.status(201).json(income);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/income/:id
const updateIncome = async (req, res) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, userId: req.user._id });
    if (!income) return res.status(404).json({ message: 'Income not found' });

    const { amount, source, date, note } = req.body;
    if (amount !== undefined) income.amount = Number(amount);
    if (source !== undefined) income.source = source;
    if (date !== undefined) income.date = new Date(date);
    if (note !== undefined) income.note = note;

    await income.save();
    res.json(income);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/income/:id
const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!income) return res.status(404).json({ message: 'Income not found' });
    res.json({ message: 'Income deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getIncomes, createIncome, updateIncome, deleteIncome };
