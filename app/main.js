// The dashboard: one month at a time, all from the local data in data.js. Prev/next arrows (and the left/right arrow
// keys) move between months. Bars grow in, the headline figures count up, and hovering a category explains its share.
//
// window.__shotReady is false while a month is animating in and true when it has settled, so screenshots know when to
// capture.

import { incomeTotal, months } from './data.js';
import { dashboard, money } from './views.js';

const app = document.getElementById('app');
const monthHeading = document.getElementById('monthHeading');
const monthName = document.getElementById('monthName');
const monthYear = document.getElementById('monthYear');
const monthCount = document.getElementById('monthCount');
const prevButton = document.getElementById('prevMonth');
const nextButton = document.getElementById('nextMonth');

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const budgetShare = {
  food: 0.14,
  housing: 0.33,
  transport: 0.08,
  entertainment: 0.06,
  utilities: 0.05,
  savings: 0.24,
  other: 0.1,
};

function healthForPercent(percent) {
  if (percent > 100) return 'red';
  if (percent > 75) return 'yellow';
  return 'green';
}

function decorateHealth(month) {
  const income = incomeTotal(month);
  const list = app.querySelector('.category-list');

  app.querySelectorAll('.category-row').forEach((row) => {
    const bar = row.querySelector('.category-bar');
    if (!bar) return;

    const category = row.dataset.category;
    const spent = month.expenses[category] ?? 0;
    const budget = income * (budgetShare[category] ?? 0);
    const percent = budget === 0 ? 0 : (spent / budget) * 100;
    const level = healthForPercent(percent);
    const label = level === 'red' ? 'Over budget' : level === 'yellow' ? 'Near budget' : 'Under budget';

    const barRow = document.createElement('div');
    barRow.className = 'category-bar-row';
    bar.parentNode.insertBefore(barRow, bar);
    barRow.append(bar);

    const badge = document.createElement('span');
    badge.className = `health-badge is-${level}`;
    badge.textContent = `${Math.round(percent)}%`;
    badge.title = `${label}: ${money(spent)} spent of ${money(Math.round(budget))} budget`;
    badge.setAttribute('aria-label', `${label}, ${Math.round(percent)} percent of budget`);
    barRow.append(badge);
  });

  if (list) {
    const legend = document.createElement('div');
    legend.className = 'health-legend';
    legend.setAttribute('aria-label', 'Budget health legend');
    legend.innerHTML =
      '<span class="health-legend-item"><span class="health-dot is-green"></span>Under 75% of budget</span>' +
      '<span class="health-legend-item"><span class="health-dot is-yellow"></span>Near budget, 75–100%</span>' +
      '<span class="health-legend-item"><span class="health-dot is-red"></span>Over budget, 100%+</span>';
    list.parentNode.insertBefore(legend, list.nextSibling);
  }
}

const requested = new URLSearchParams(location.search).get('month');
const startIndex = months.findIndex(
  (month) => month.id === requested || (requested && month.month.toLowerCase() === requested.toLowerCase()),
);
const state = { index: startIndex >= 0 ? startIndex : 0 };
let renderToken = 0;

function updateHeader(month) {
  monthName.textContent = month.month;
  monthYear.textContent = month.year;
  monthCount.textContent = `${state.index + 1} of ${months.length}`;
  document.title = `${month.month} ${month.year} · Tally`;

  monthHeading.classList.remove('is-changing');
  void monthHeading.offsetWidth;
  monthHeading.classList.add('is-changing');

  prevButton.disabled = state.index === 0;
  nextButton.disabled = state.index === months.length - 1;
  prevButton.setAttribute(
    'aria-label',
    state.index > 0 ? `Previous month, ${months[state.index - 1].month}` : 'Previous month',
  );
  nextButton.setAttribute(
    'aria-label',
    state.index < months.length - 1 ? `Next month, ${months[state.index + 1].month}` : 'Next month',
  );
}

function animateAmounts(token) {
  const elements = app.querySelectorAll('[data-amount]');

  return new Promise((resolve) => {
    if (reducedMotion() || elements.length === 0) {
      elements.forEach((element) => {
        element.textContent = money(Number(element.dataset.amount));
      });
      resolve();
      return;
    }

    let running = elements.length;
    const finish = () => {
      running -= 1;
      if (running === 0) resolve();
    };

    elements.forEach((element, order) => {
      const target = Number(element.dataset.amount);
      const duration = 720;
      const delay = order * 55;
      let began = 0;

      const tick = (now) => {
        if (token !== renderToken) {
          resolve();
          return;
        }

        if (!began) began = now;
        const elapsed = now - began - delay;

        if (elapsed < 0) {
          requestAnimationFrame(tick);
          return;
        }

        const progress = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        element.textContent = money(value === 0 ? 0 : value);

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          element.textContent = money(target);
          finish();
        }
      };

      requestAnimationFrame(tick);
    });
  });
}

function bindCategoryHover() {
  const hint = document.getElementById('categoryHint');
  if (!hint) return;

  const defaultHint = hint.textContent;
  const rows = app.querySelectorAll('.category-row');

  const clear = () => {
    rows.forEach((row) => row.classList.remove('is-active'));
  };

  rows.forEach((row) => {
    const show = () => {
      clear();
      row.classList.add('is-active');
      hint.textContent = '';
      const name = document.createElement('strong');
      name.textContent = row.dataset.name;
      hint.append(
        name,
        ` · ${row.dataset.money} · ${row.dataset.share}% of spending · ${row.dataset.incomeShare}% of income`,
      );
    };

    const hide = () => {
      row.classList.remove('is-active');
      hint.textContent = defaultHint;
    };

    row.addEventListener('mouseenter', show);
    row.addEventListener('mouseleave', hide);
    row.addEventListener('focus', show);
    row.addEventListener('blur', hide);
    row.addEventListener('click', show);
  });
}

function bindTrend() {
  app.querySelectorAll('[data-trend-index]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.trendIndex);
      if (index === state.index) return;
      const direction = index > state.index ? 'next' : 'prev';
      state.index = index;
      render(direction);
    });
  });
}

function render(direction = 'none') {
  window.__shotReady = false;
  const token = ++renderToken;
  const month = months[state.index];
  const previousMonth = state.index > 0 ? months[state.index - 1] : null;

  app.dataset.dir = direction;
  app.innerHTML = dashboard(month, previousMonth);
  decorateHealth(month);
  updateHeader(month);

  requestAnimationFrame(() => {
    app.querySelectorAll('.category-row, .trend-card').forEach((element) => element.classList.add('is-visible'));
  });

  bindCategoryHover();
  bindTrend();

  const amountsDone = animateAmounts(token);
  const barsDone = new Promise((resolve) => {
    window.setTimeout(resolve, reducedMotion() ? 60 : 1340);
  });

  Promise.all([amountsDone, barsDone]).then(() => {
    if (token === renderToken) window.__shotReady = true;
  });

  try {
    history.replaceState(null, '', `?month=${month.id}`);
  } catch {
    // A file:// page may refuse history updates; the dashboard still works.
  }
}

function step(delta) {
  const next = Math.min(months.length - 1, Math.max(0, state.index + delta));
  if (next === state.index) return;
  state.index = next;
  render(delta > 0 ? 'next' : 'prev');
}

prevButton.addEventListener('click', () => step(-1));
nextButton.addEventListener('click', () => step(1));

document.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    step(-1);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    step(1);
  }
});

render();
