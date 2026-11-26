// HTML for the dashboard, built from the budget data. All figures pass through the local currency formatter and all
// names are escaped before they reach the page.

import {
  categories,
  months,
  incomeTotal,
  expenseTotal,
  remainingTotal,
  savingsRate,
  topCategory,
} from './data.js';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const money = (value) => currency.format(value === 0 ? 0 : value);

const escape = (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const iconPaths = {
  food: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"/><path d="M21 15v7"/>',
  housing: '<path d="m3 10 9-7 9 7"/><path d="M5 9v11a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9"/>',
  transport: '<path d="M19 17h2a1 1 0 0 0 1-1v-3a2 2 0 0 0-1.5-1.9L18 10.6A3 3 0 0 0 15.1 8H8.9A3 3 0 0 0 6 10.6l-2.5 1A2 2 0 0 0 2 13.5V16a1 1 0 0 0 1 1h2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  entertainment: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  utilities: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  savings: '<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1.3 2-2h2v-4h-2c0-1-.5-1.5-1-2V5Z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/>',
  other: '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  income: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/>',
  expenses: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M4 3h16"/>',
};

function icon(name, size = 18) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] ?? iconPaths.other}</svg>`;
}

function trendArrow(up) {
  return `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${up ? 'M12 19V5m0 0-5 5m5-5 5 5' : 'M12 5v14m0 0-5-5m5 5 5-5'}"/></svg>`;
}

const signedMoney = (value) => (value > 0 ? `+${money(value)}` : value < 0 ? `−${money(Math.abs(value))}` : money(0));

export function summaryCards(month, previousMonth) {
  const income = incomeTotal(month);
  const expenses = expenseTotal(month);
  const remaining = remainingTotal(month);
  const rate = savingsRate(month);
  const surplus = remaining >= 0;
  const previousRemaining = previousMonth ? remainingTotal(previousMonth) : null;
  const change = previousRemaining === null ? null : remaining - previousRemaining;
  const previousExpenses = previousMonth ? expenseTotal(previousMonth) : null;
  const expenseChange = previousExpenses === null ? null : expenses - previousExpenses;
  const leader = topCategory(month);
  const leaderShare = expenses === 0 ? 0 : (leader.amount / expenses) * 100;
  const spentShare = income === 0 ? 0 : Math.round((expenses / income) * 100);
  const selectedIndex = months.findIndex((item) => item.id === month.id);
  const keptValues = months.map((item) => item.expenses.savings + remainingTotal(item));
  const tallestKept = Math.max(...keptValues, 1);

  let expenseMeta;
  if (expenseChange === null) {
    expenseMeta = `${money(month.expenses.savings)} set aside`;
  } else if (expenseChange === 0) {
    expenseMeta = `<span class="stat-trend is-flat">No change</span> vs ${escape(previousMonth.month)}`;
  } else {
    const up = expenseChange > 0;
    expenseMeta = `<span class="stat-trend ${up ? 'is-bad' : 'is-good'}">${trendArrow(up)}${money(Math.abs(expenseChange))}</span> vs ${escape(previousMonth.month)}`;
  }

  const changeMarkup =
    change === null
      ? '<strong class="is-flat">—</strong>'
      : `<strong class="${change >= 0 ? 'is-good' : 'is-bad'}">${signedMoney(change)}</strong>`;

  return `<section class="summary" aria-label="Monthly summary">
  <article class="balance-card ${surplus ? 'is-surplus' : 'is-over'}">
    <span class="orb orb-one" aria-hidden="true"></span>
    <span class="orb orb-two" aria-hidden="true"></span>
    <div class="balance-head">
      <span class="card-label">Remaining balance</span>
      <span class="status-pill">${surplus ? 'On track' : 'Over budget'}</span>
    </div>
    <p class="balance-value amount" data-amount="${remaining}">${money(remaining)}</p>
    <p class="balance-caption">${
      surplus
        ? `${money(expenses)} spent · ${money(month.expenses.savings)} set aside for savings`
        : `${money(expenses)} spent · ${money(Math.abs(remaining))} more than income`
    }</p>
    <div class="balance-foot">
      <div class="foot-stat">
        <span>Savings rate</span>
        <strong>${rate}%</strong>
      </div>
      <div class="foot-stat">
        <span>${previousMonth ? `vs ${escape(previousMonth.month)}` : 'Spent of income'}</span>
        ${previousMonth ? changeMarkup : `<strong>${spentShare}%</strong>`}
      </div>
    </div>
  </article>

  <div class="stat-pair">
    <article class="stat-card stat-income">
      <span class="stat-icon">${icon('income')}</span>
      <span class="stat-label">Income</span>
      <p class="stat-value amount" data-amount="${income}">${money(income)}</p>
      <p class="stat-meta">Salary ${money(month.income.salary)} · Side ${money(month.income.side)} · Other ${money(month.income.other)}</p>
    </article>
    <article class="stat-card stat-expense">
      <span class="stat-icon">${icon('expenses')}</span>
      <span class="stat-label">Expenses</span>
      <p class="stat-value amount" data-amount="${expenses}">${money(expenses)}</p>
      <p class="stat-meta">${expenseMeta}</p>
    </article>
  </div>

  <p class="insight">
    <span class="insight-dot" aria-hidden="true"></span>
    <span><strong>${escape(leader.name)}</strong> leads the month at ${money(leader.amount)} — ${leaderShare.toFixed(1)}% of all spending.</span>
  </p>

  <article class="trend-card" aria-label="Money kept in each month">
    <div class="trend-head">
      <div>
        <span class="trend-eyebrow">11-month trend</span>
        <strong>Money kept</strong>
      </div>
      <span class="trend-note">Savings + leftover</span>
    </div>
    <div class="trend-chart">
      ${months
        .map((item, index) => {
          const kept = keptValues[index];
          const height = Math.max(10, Math.round((kept / tallestKept) * 100));
          return `<button class="trend-col ${index === selectedIndex ? 'is-current' : ''}" type="button" data-trend-index="${index}" aria-label="Show ${escape(item.month)} ${item.year}: ${money(kept)} kept" title="${escape(item.month)}: ${money(kept)} kept">
            <span class="trend-bar-wrap"><span class="trend-bar" style="--h:${height}%; --i:${index}"></span></span>
            <span class="trend-label">${escape(item.month.slice(0, 3))}</span>
          </button>`;
        })
        .join('')}
    </div>
  </article>
</section>`;
}

export function categoryBreakdown(month) {
  const expenses = expenseTotal(month);
  const income = incomeTotal(month);

  const rows = categories
    .map((category, index) => {
      const amount = month.expenses[category.id];
      const share = expenses === 0 ? 0 : (amount / expenses) * 100;
      const shareOfIncome = income === 0 ? 0 : (amount / income) * 100;

      return `<li class="category-row" tabindex="0" data-category="${category.id}" data-name="${escape(category.name)}" data-money="${money(amount)}" data-share="${share.toFixed(1)}" data-income-share="${shareOfIncome.toFixed(1)}" style="--cat:${category.color}; --cat-soft:${category.soft}; --target:${share.toFixed(2)}%; --i:${index}" aria-label="${escape(category.name)}, ${money(amount)}, ${share.toFixed(1)} percent of spending">
        <div class="category-top">
          <span class="category-icon">${icon(category.id, 16)}</span>
          <span class="category-name">${escape(category.name)}</span>
          <span class="category-amount">${money(amount)}</span>
          <span class="category-share">${share.toFixed(1)}%</span>
        </div>
        <div class="category-bar" aria-hidden="true"><span class="category-fill"></span></div>
      </li>`;
    })
    .join('');

  return `<section class="panel categories" aria-label="Category breakdown">
  <header class="panel-head">
    <div>
      <p class="panel-eyebrow">Category breakdown</p>
      <h2>Where it goes</h2>
    </div>
    <div class="panel-total">
      <span>Total spent</span>
      <strong>${money(expenses)}</strong>
    </div>
  </header>
  <p class="hover-hint" id="categoryHint" aria-live="polite">Hover, focus or tap a category for the details.</p>
  <ul class="category-list">${rows}</ul>
  <p class="panel-foot">Every dollar is accounted for across seven categories. The bars show each category's share of the month's spending.</p>
</section>`;
}

export function dashboard(month, previousMonth) {
  return `${summaryCards(month, previousMonth)}${categoryBreakdown(month)}`;
}
