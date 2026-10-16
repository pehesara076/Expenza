// Utility functions shared across the app

export const formatLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const CATEGORIES = ['Food', 'Transport', 'Data/Bills', 'Shopping', 'Entertainment', 'Other'];
export const INCOME_SOURCES = ['Money from home', 'Allowance', 'Freelance', 'Salary', 'Gift', 'Other'];

export const CATEGORY_COLORS = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  'Data/Bills': '#8b5cf6',
  Shopping: '#ec4899',
  Entertainment: '#10b981',
  Other: '#6b7280',
};

export const CATEGORY_ICONS = {
  Food: '🍜',
  Transport: '🚌',
  'Data/Bills': '📱',
  Shopping: '🛍️',
  Entertainment: '🎮',
  Other: '💸',
};
