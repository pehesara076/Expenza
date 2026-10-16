const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    // Shared budget is linked to a "couple" identified by the sorted pair of user IDs
    coupleKey: { type: String, required: true, unique: true, index: true },
    totalBudget: { type: Number, required: true, default: 3000 },
    // Share for each user: { userId: amount }
    shares: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true, default: 1500 },
      },
    ],
    // Week start day: 0=Sunday, 1=Monday (default)
    weekStartDay: { type: Number, default: 1, min: 0, max: 6 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Budget', budgetSchema);
