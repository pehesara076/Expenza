/**
 * Seed script – creates two linked users with sample data.
 * Run: node scripts/seed.js
 * Make sure MONGODB_URI is set in .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('../backend/models/User');
const Income = require('../backend/models/Income');
const Expense = require('../backend/models/Expense');
const Budget = require('../backend/models/Budget');
const Debt = require('../backend/models/Debt');
const Todo = require('../backend/models/Todo');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set in .env');
  process.exit(1);
}

const randDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
};

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clean slate
  await Promise.all([
    User.deleteMany({ email: { $in: ['user1@demo.com', 'user2@demo.com'] } }),
    Income.deleteMany({}),
    Expense.deleteMany({}),
    Budget.deleteMany({}),
    Debt.deleteMany({}),
    Todo.deleteMany({}),
  ]);

  // Create users
  const pass = await bcrypt.hash('password123', 12);

  const user1 = await User.create({
    name: 'Ashan',
    email: 'user1@demo.com',
    password: pass,
  });
  const user2 = await User.create({
    name: 'Kavya',
    email: 'user2@demo.com',
    password: pass,
  });

  // Link them
  user1.partnerId = user2._id;
  user2.partnerId = user1._id;
  await user1.save({ validateBeforeSave: false });
  await user2.save({ validateBeforeSave: false });

  const coupleKey = [user1._id, user2._id].sort().join('_');

  // Shared budget
  await Budget.create({
    coupleKey,
    totalBudget: 3000,
    shares: [
      { userId: user1._id, amount: 1500 },
      { userId: user2._id, amount: 1500 },
    ],
    weekStartDay: 1,
  });

  // Income – user1
  await Income.insertMany([
    { userId: user1._id, amount: 15000, source: 'Money from home', date: randDate(5), note: 'Monthly' },
    { userId: user1._id, amount: 3500, source: 'Freelance', date: randDate(12), note: 'Logo design' },
    { userId: user1._id, amount: 2000, source: 'Gift', date: randDate(20), note: 'Birthday' },
  ]);

  // Income – user2
  await Income.insertMany([
    { userId: user2._id, amount: 12000, source: 'Allowance', date: randDate(3), note: 'October' },
    { userId: user2._id, amount: 5000, source: 'Freelance', date: randDate(15), note: 'Tutoring' },
  ]);

  // Expenses – this week (shared)
  await Expense.insertMany([
    { userId: user1._id, amount: 480, category: 'Food', type: 'Shared', date: randDate(1), note: 'Lunch at Burger King' },
    { userId: user1._id, amount: 250, category: 'Transport', type: 'Shared', date: randDate(2), note: 'Tuk' },
    { userId: user2._id, amount: 620, category: 'Food', type: 'Shared', date: randDate(1), note: 'Grocery run' },
    { userId: user2._id, amount: 399, category: 'Entertainment', type: 'Shared', date: randDate(3), note: 'Netflix' },
    // Personal expenses
    { userId: user1._id, amount: 1200, category: 'Shopping', type: 'Personal', date: randDate(4), note: 'T-shirts' },
    { userId: user1._id, amount: 350, category: 'Data/Bills', type: 'Personal', date: randDate(6), note: 'Mobile data' },
    { userId: user2._id, amount: 800, category: 'Shopping', type: 'Personal', date: randDate(5), note: 'Accessories' },
    { userId: user2._id, amount: 150, category: 'Transport', type: 'Personal', date: randDate(2), note: 'Bus' },
  ]);

  // Debts – user1
  const debt1 = new Debt({
    userId: user1._id,
    direction: 'i_owe',
    personName: 'Nimal',
    amount: 2500,
    date: randDate(30),
    dueDate: randDate(-10),
    note: 'Borrowed for rent',
  });
  debt1.payments.push({ amount: 1000, date: randDate(10), note: 'Partial' });
  await debt1.save();

  const debt2 = new Debt({
    userId: user1._id,
    direction: 'owed_to_me',
    personName: 'Saman',
    amount: 1500,
    date: randDate(15),
    note: 'Lent for concert tickets',
  });
  await debt2.save();

  // Debts – user2
  const debt3 = new Debt({
    userId: user2._id,
    direction: 'owed_to_me',
    personName: 'Dilani',
    amount: 800,
    date: randDate(7),
    note: 'Shopping split',
  });
  await debt3.save();

  // Todos – user1
  await Todo.insertMany([
    { userId: user1._id, text: 'Pay electricity bill', priority: 'High', dueDate: randDate(-3) },
    { userId: user1._id, text: 'Top up data package', priority: 'Medium' },
    { userId: user1._id, text: 'Check bank statement', priority: 'Low', done: true },
  ]);

  // Todos – user2
  await Todo.insertMany([
    { userId: user2._id, text: 'Buy groceries this weekend', priority: 'High' },
    { userId: user2._id, text: 'Pay back Dilani', priority: 'Medium', dueDate: randDate(-1) },
    { userId: user2._id, text: 'Renew library card', priority: 'Low' },
  ]);

  console.log('\n✅ Seed complete!\n');
  console.log('  👤 User 1: user1@demo.com  /  password123  (Ashan)');
  console.log('  👤 User 2: user2@demo.com  /  password123  (Kavya)');
  console.log('  🔗 Both accounts are already linked as partners\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  mongoose.disconnect();
  process.exit(1);
});
