const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    source: {
      type: String,
      required: true,
      enum: ['Money from home', 'Allowance', 'Freelance', 'Salary', 'Gift', 'Other'],
    },
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Income', incomeSchema);
