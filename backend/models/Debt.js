const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  note: { type: String, trim: true, default: '' },
});

const debtSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    direction: { type: String, required: true, enum: ['i_owe', 'owed_to_me'] },
    personName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, default: null },
    note: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Partially paid', 'Settled'],
      default: 'Pending',
    },
    payments: [paymentSchema],
    paidAmount: { type: Number, default: 0 },
    remaining: { type: Number, default: null },
  },
  { timestamps: true }
);

// Auto-calculate remaining and status before save
debtSchema.pre('save', function (next) {
  this.paidAmount = this.payments.reduce((sum, p) => sum + p.amount, 0);
  this.remaining = Math.max(0, this.amount - this.paidAmount);
  if (this.remaining <= 0) {
    this.status = 'Settled';
  } else if (this.paidAmount > 0) {
    this.status = 'Partially paid';
  } else {
    this.status = 'Pending';
  }
  next();
});

module.exports = mongoose.model('Debt', debtSchema);
