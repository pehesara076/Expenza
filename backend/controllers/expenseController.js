const Expense = require('../models/Expense');
const User = require('../models/User');

// GET /api/expenses
const getExpenses = async (req, res) => {
  try {
    const { from, to, type, category, page = 1, limit = 50 } = req.query;
    const userId = req.user._id;
    const partnerId = req.user.partnerId;

    // Personal expenses: only own. Shared: own + partner's (if linked)
    let userFilter;
    if (type === 'Shared' && partnerId) {
      userFilter = { userId: { $in: [userId, partnerId] } };
    } else if (type === 'Personal') {
      userFilter = { userId };
    } else {
      // No type filter: own personal + shared (own + partner)
      if (partnerId) {
        userFilter = {
          $or: [
            { userId, type: 'Personal' },
            { userId: { $in: [userId, partnerId] }, type: 'Shared' },
          ],
        };
      } else {
        userFilter = { userId };
      }
    }

    const filter = { ...userFilter };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    if (category) filter.category = category;
    if (type) filter.type = type;

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('userId', 'name');

    const total = await Expense.countDocuments(filter);
    const totalAmount = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]);

    // Category breakdown
    const byCategory = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);

    res.json({
      expenses,
      total,
      totalAmount: totalAmount[0]?.sum || 0,
      byCategory,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const { amount, category, type, date, note } = req.body;
    if (!amount || !category) {
      return res.status(400).json({ message: 'Amount and category are required' });
    }
    const expense = await Expense.create({
      userId: req.user._id,
      amount: Number(amount),
      category,
      type: type || 'Personal',
      date: date ? new Date(date) : new Date(),
      note: note || '',
    });
    const populated = await expense.populate('userId', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const { amount, category, type, date, note } = req.body;
    if (amount !== undefined) expense.amount = Number(amount);
    if (category !== undefined) expense.category = category;
    if (type !== undefined) expense.type = type;
    if (date !== undefined) expense.date = new Date(date);
    if (note !== undefined) expense.note = note;

    await expense.save();
    const populated = await expense.populate('userId', 'name');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
