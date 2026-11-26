// Sample household budget for January to November 2026. Every figure is a whole dollar amount kept right here in the
// page, so the dashboard needs no network, no API and no storage beyond these constants.

export const categories = [
  { id: 'food', name: 'Food', color: '#f59e0b', soft: '#fef3c7' },
  { id: 'housing', name: 'Housing', color: '#6366f1', soft: '#e0e7ff' },
  { id: 'transport', name: 'Transport', color: '#0891b2', soft: '#cffafe' },
  { id: 'entertainment', name: 'Entertainment', color: '#db2777', soft: '#fce7f3' },
  { id: 'utilities', name: 'Utilities', color: '#059669', soft: '#d1fae5' },
  { id: 'savings', name: 'Savings', color: '#7c3aed', soft: '#ede9fe' },
  { id: 'other', name: 'Other', color: '#64748b', soft: '#e2e8f0' },
];

// income: salary, side work, and interest/other. expenses: one figure per category above.
export const months = [
  {
    id: '2026-01',
    month: 'January',
    year: 2026,
    income: { salary: 5100, side: 380, other: 65 },
    expenses: { food: 720, housing: 1850, transport: 330, entertainment: 260, utilities: 265, savings: 1200, other: 300 },
  },
  {
    id: '2026-02',
    month: 'February',
    year: 2026,
    income: { salary: 5100, side: 220, other: 70 },
    expenses: { food: 680, housing: 1850, transport: 540, entertainment: 180, utilities: 285, savings: 1050, other: 265 },
  },
  {
    id: '2026-03',
    month: 'March',
    year: 2026,
    income: { salary: 5200, side: 540, other: 55 },
    expenses: { food: 730, housing: 1850, transport: 320, entertainment: 280, utilities: 240, savings: 1100, other: 1390 },
  },
  {
    id: '2026-04',
    month: 'April',
    year: 2026,
    income: { salary: 5200, side: 310, other: 90 },
    expenses: { food: 700, housing: 1850, transport: 300, entertainment: 240, utilities: 215, savings: 1400, other: 290 },
  },
  {
    id: '2026-05',
    month: 'May',
    year: 2026,
    income: { salary: 5200, side: 620, other: 75 },
    expenses: { food: 750, housing: 1850, transport: 340, entertainment: 350, utilities: 205, savings: 1450, other: 330 },
  },
  {
    id: '2026-06',
    month: 'June',
    year: 2026,
    income: { salary: 5200, side: 480, other: 110 },
    expenses: { food: 730, housing: 1850, transport: 360, entertainment: 320, utilities: 255, savings: 1200, other: 760 },
  },
  {
    id: '2026-07',
    month: 'July',
    year: 2026,
    income: { salary: 5300, side: 260, other: 60 },
    expenses: { food: 760, housing: 1870, transport: 330, entertainment: 300, utilities: 300, savings: 1100, other: 690 },
  },
  {
    id: '2026-08',
    month: 'August',
    year: 2026,
    income: { salary: 5300, side: 390, other: 80 },
    expenses: { food: 720, housing: 1870, transport: 300, entertainment: 270, utilities: 315, savings: 1350, other: 340 },
  },
  {
    id: '2026-09',
    month: 'September',
    year: 2026,
    income: { salary: 5300, side: 150, other: 95 },
    expenses: { food: 690, housing: 1870, transport: 310, entertainment: 220, utilities: 255, savings: 1150, other: 470 },
  },
  {
    id: '2026-10',
    month: 'October',
    year: 2026,
    income: { salary: 5400, side: 420, other: 70 },
    expenses: { food: 760, housing: 1880, transport: 320, entertainment: 340, utilities: 240, savings: 1400, other: 310 },
  },
  {
    id: '2026-11',
    month: 'November',
    year: 2026,
    income: { salary: 5400, side: 300, other: 85 },
    expenses: { food: 830, housing: 1880, transport: 300, entertainment: 270, utilities: 265, savings: 1200, other: 610 },
  },
];

export function incomeTotal(month) {
  return month.income.salary + month.income.side + month.income.other;
}

export function expenseTotal(month) {
  return categories.reduce((sum, category) => sum + month.expenses[category.id], 0);
}

export function remainingTotal(month) {
  return incomeTotal(month) - expenseTotal(month);
}

export function savingsRate(month) {
  return Math.round((month.expenses.savings / incomeTotal(month)) * 100);
}

export function topCategory(month) {
  return categories.reduce((top, category) => {
    const amount = month.expenses[category.id];
    return amount > top.amount ? { ...category, amount } : top;
  }, { ...categories[0], amount: month.expenses[categories[0].id] });
}
