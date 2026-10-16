const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

const getCoupleKey = (id1, id2) => [id1.toString(), id2.toString()].sort().join('_');

const getWeekBounds = (weekStartDay) => {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = (day - weekStartDay + 7) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// GET /api/budget
const getBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const partnerId = req.user.partnerId;

    if (!partnerId) {
      return res.status(200).json({ linked: false });
    }

    const coupleKey = getCoupleKey(userId, partnerId);
    let budget = await Budget.findOne({ coupleKey });
    if (!budget) {
      budget = await Budget.create({
        coupleKey,
        totalBudget: 3000,
        shares: [
          { userId, amount: 1500 },
          { userId: partnerId, amount: 1500 },
        ],
        weekStartDay: 1,
      });
    }

    const { start, end } = getWeekBounds(budget.weekStartDay);

    // Shared expenses this week by each partner
    const weeklyExpenses = await Expense.aggregate([
      {
        $match: {
          userId: { $in: [userId, partnerId] },
          type: 'Shared',
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: '$userId', total: { $sum: '$amount' } } },
    ]);

    const spentByUser = weeklyExpenses.find((e) => e._id.equals(userId))?.total || 0;
    const spentByPartner = weeklyExpenses.find((e) => e._id.equals(partnerId))?.total || 0;
    const totalSpent = spentByUser + spentByPartner;

    // Historical weeks (last 8 weeks)
    const history = [];
    for (let i = 1; i <= 8; i++) {
      const hEnd = new Date(start);
      hEnd.setDate(start.getDate() - (i - 1) * 7 - 1);
      hEnd.setHours(23, 59, 59, 999);
      const hStart = new Date(hEnd);
      hStart.setDate(hEnd.getDate() - 6);
      hStart.setHours(0, 0, 0, 0);

      const spent = await Expense.aggregate([
        {
          $match: {
            userId: { $in: [userId, partnerId] },
            type: 'Shared',
            date: { $gte: hStart, $lte: hEnd },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      history.push({
        weekStart: hStart,
        weekEnd: hEnd,
        spent: spent[0]?.total || 0,
        budget: budget.totalBudget,
      });
    }

    res.json({
      linked: true,
      budget,
      week: { start, end, totalSpent, spentByUser, spentByPartner },
      history,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/budget
const updateBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const partnerId = req.user.partnerId;
    if (!partnerId) return res.status(400).json({ message: 'No partner linked' });

    const coupleKey = getCoupleKey(userId, partnerId);
    const { totalBudget, shares, weekStartDay } = req.body;

    let budget = await Budget.findOne({ coupleKey });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });

    if (totalBudget !== undefined) budget.totalBudget = Number(totalBudget);
    if (weekStartDay !== undefined) budget.weekStartDay = Number(weekStartDay);
    if (shares && Array.isArray(shares)) budget.shares = shares;

    await budget.save();
    res.json(budget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getBudget, updateBudget };
