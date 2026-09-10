import { createSnapshotClient } from './src/worker-client.mjs';
import { formatUsd } from './src/money.mjs';
import { formatExportDate, transactionDateParts } from './src/format.mjs';

const getAccountIcon = type => ({ BANK: 'fa-building-columns', CREDIT_CARD: 'fa-credit-card',
  LOAN: 'fa-hand-holding-dollar', ASSET: 'fa-sack-dollar', LIABILITY: 'fa-file-invoice-dollar' }[type] || 'fa-wallet');

export class App {
  constructor({ document = globalThis.document, handlebars = globalThis.Handlebars,
    pageUrl = globalThis.location.href, config = globalThis.MONEYDANCE_CONFIG, workerFactory } = {}) {
    this.document = document;
    this.window = document.defaultView;
    this.pageUrl = pageUrl;
    this.handles = new this.window.AbortController();
    this.nodes = new Map();
    this.el = Object.fromEntries(['account-tree', 'current-account-name', 'total-balance',
      'mobile-total-balance', 'balance-card', 'mobile-balance-bar', 'total-transactions',
      'search-input', 'clear-search', 'load-status', 'as-of-date', 'test-data-link', 'test-data-indicator', 'sidebar',
      'sidebar-overlay', 'theme-toggle'].map(id => [id, document.getElementById(id)]));
    handlebars.registerHelper('getAccountIcon', getAccountIcon);
    handlebars.registerHelper('formatCurrency', formatUsd);
    handlebars.registerHelper('isPositive', amount => amount > 0);
    handlebars.registerHelper('isNegative', amount => amount < 0);
    handlebars.registerPartial('accountNode', document.getElementById('account-node-partial').innerHTML);
    this.treeTemplate = handlebars.compile(document.getElementById('account-tree-template').innerHTML);
    this.transactionsTemplate = handlebars.compile(document.getElementById('transactions-template').innerHTML);
    for (const id of ['transactions-body', 'transactions-table', 'no-results', 'pagination-controls', 'prev-page', 'next-page', 'page-info', 'register-status', 'future-summary'])
      this.el[id] = document.getElementById(id);
    this.page = 1;
    this.searchText = '';
    this.mobileLayout = this.window.matchMedia('(max-width: 768px)');
    this.mobileLayout.addEventListener('change', () => this.updateYearColumns(), { signal: this.handles.signal });
    this.headerObserver = new this.window.ResizeObserver(([entry]) => {
      this.el['transactions-table'].style.setProperty('--register-header-height', `${entry.target.getBoundingClientRect().height}px`);
    });
    this.headerObserver.observe(this.el['transactions-table'].querySelector('thead'));
    this.client = createSnapshotClient({ pageUrl, config, workerFactory, onMessage: message => this.receive(message) });
    this.unlockForm = document.getElementById('unlock-form');
    this.passwordInput = document.getElementById('snapshot-password');
    this.unlockButton = document.getElementById('unlock-button');
    this.unlockStatus = document.getElementById('unlock-status');
    this.unlockForm.addEventListener('submit', event => {
      event.preventDefault();
      if (this.unlockButton.disabled) return;
      this.unlockButton.disabled = true;
      this.unlockStatus.textContent = 'Unlocking…';
      this.document.getElementById('app').dataset.state = 'unlocking';
      this.client.unlock(this.passwordInput.value);
    }, {signal:this.handles.signal});
    const listen = (element, action) => element.addEventListener('click', action, { signal: this.handles.signal });
    listen(this.el['account-tree'], event => {
      const header = event.target.closest('.account-header');
      if (!header) return;
      if (event.target.closest('.account-toggle') && header.nextElementSibling) {
        header.querySelector('.account-toggle').classList.toggle('open');
        header.nextElementSibling.classList.toggle('open');
        return;
      }
      const node = this.nodes.get(header.dataset.id);
      if (node) this.selectAccount(node);
    });
    listen(document.getElementById('open-sidebar'), () => this.toggleSidebar(true));
    listen(document.getElementById('close-sidebar'), () => this.toggleSidebar(false));
    listen(this.el['sidebar-overlay'], () => this.toggleSidebar(false));
    listen(this.el['theme-toggle'], () => this.toggleTheme());
    listen(this.el['prev-page'], () => this.requestPage(this.page - 1));
    listen(this.el['next-page'], () => this.requestPage(this.page + 1));
    listen(this.el['future-summary'], () => { this.includeFuture = true; this.requestPage(1); });
    listen(this.el['clear-search'], () => {
      if (this.el['search-input'].disabled) return;
      this.el['search-input'].value = '';
      this.el['search-input'].dispatchEvent(new this.window.Event('input', { bubbles: true }));
      this.el['search-input'].focus();
    });
    this.document.addEventListener('keydown', event => {
      if (this.mobileLayout.matches || this.el['search-input'].disabled || event.isComposing) return;
      if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        this.el['search-input'].focus();
        this.el['search-input'].select();
      }
    }, { signal: this.handles.signal });
    this.el['search-input'].addEventListener('input', () => {
      this.searchText = this.el['search-input'].value;
      this.el['clear-search'].hidden = !this.searchText;
      this.client.invalidatePending();
      this.window.clearTimeout(this.searchTimer);
      this.clearRegister();
      this.el['total-transactions'].textContent = '—';
      this.el['register-status'].textContent = 'Searching transactions…';
      this.el['register-status'].hidden = false;
      this.searchTimer = this.window.setTimeout(() => this.requestPage(1), 100);
    }, { signal: this.handles.signal });
    try { this.toggleTheme(this.window.localStorage.getItem('theme') !== 'dark'); } catch { /* theme storage is optional */ }
  }

  start() {
    // Keep the password field discoverable while the encrypted file downloads.
    // Preserve any value filled before load completes; unlock still requires locked.
    this.unlockForm.hidden = this.client.testMode;
    this.unlockButton.disabled = true;
    this.unlockStatus.textContent = 'Downloading snapshot…';
    this.document.getElementById('app').dataset.state = 'loading';
    this.el['as-of-date'].hidden = true;
    this.el['as-of-date'].textContent = '';
    this.el['search-input'].disabled = true;
    this.el['account-tree'].replaceChildren();
    this.nodes.clear();
    this.el['balance-card'].hidden = true;
    this.el['mobile-balance-bar'].hidden = true;
    this.el['test-data-link'].hidden = true;
    this.el['test-data-indicator'].hidden = !this.client.testMode;
    this.el['load-status'].textContent = 'Loading accounts…';
    this.el['load-status'].classList.add('is-loading');
    this.el['load-status'].classList.remove('is-error');
    this.el['load-status'].setAttribute('role', 'status');
    this.el['load-status'].hidden = false;
    this.el['total-transactions'].textContent = '—';
    this.clearRegister();
    return new Promise(resolve => { this.resolveLoad = resolve; this.client.load(); });
  }

  receive(message) {
    if (message.type === 'locked' || message.type === 'unlockError') {
      this.document.getElementById('app').dataset.state = 'locked';
      this.el['load-status'].hidden = true;
      this.unlockForm.hidden = false;
      this.unlockButton.disabled = false;
      this.unlockStatus.textContent = message.type === 'unlockError' ? message.message : 'Enter your password to view this snapshot.';
      // Let mobile users open the keyboard themselves; automatic focus can pan
      // the iOS viewport away from the menu even before the user interacts.
      if (!this.mobileLayout.matches) this.passwordInput.focus({ preventScroll: true });
    } else if (message.type === 'ready') {
      this.passwordInput.value = '';
      this.unlockForm.hidden = true;
      this.snapshotEmpty = message.totalCount === 0;
      this.document.getElementById('app').dataset.state = this.snapshotEmpty ? 'empty' : 'ready';
      this.el['as-of-date'].textContent = formatExportDate(message.metadata.exportDate);
      this.el['as-of-date'].hidden = false;
      this.el['search-input'].disabled = false;
      this.metadata = message.metadata;
      const root = { id: '', name: 'All Accounts', type: 'ROOT', isAll: true, isOpen: true, children: message.accounts };
      const index = node => { this.nodes.set(node.id, node); node.children.forEach(index); };
      index(root);
      this.el['account-tree'].innerHTML = this.treeTemplate(root);
      this.el['total-transactions'].textContent = String(message.totalCount);
      this.el['load-status'].hidden = !this.snapshotEmpty;
      this.el['load-status'].textContent = this.snapshotEmpty ? 'Snapshot loaded. No transactions in this export.' : '';
      this.el['load-status'].classList.remove('is-loading');
      this.selectAccount(root);
    } else if (message.type === 'page') {
      this.renderPage(message);
    } else if (message.type === 'error') {
      this.passwordInput.value = ''; this.unlockForm.hidden = true;
      this.document.getElementById('app').dataset.state = 'error';
      this.el['as-of-date'].hidden = true;
      this.el['as-of-date'].textContent = '';
      this.metadata = null;
      this.currentAccount = null;
      this.el['current-account-name'].textContent = 'Unable to load snapshot';
      this.client.dispose();
      this.window.clearTimeout(this.searchTimer);
      this.el['search-input'].disabled = true;
      this.el['clear-search'].hidden = true;
      this.clearRegister();
      this.nodes.clear();
      this.el['account-tree'].replaceChildren();
      this.el['balance-card'].hidden = true;
      this.el['mobile-balance-bar'].hidden = true;
      this.el['total-transactions'].textContent = '—';
      this.el['load-status'].hidden = false;
      this.el['load-status'].classList.remove('is-loading');
      this.el['load-status'].classList.add('is-error');
      this.el['load-status'].setAttribute('role', 'alert');
      this.el['load-status'].textContent = `${message.message} Reload the page to retry.`;
      this.el['test-data-link'].hidden = true;
      if (!this.client.testMode && message.code === 'LOAD_FAILED' && message.reason === 'NOT_FOUND') {
        const url = new URL(this.pageUrl);
        url.searchParams.set('test', 'true');
        this.el['test-data-link'].href = url.href;
        this.el['test-data-link'].hidden = false;
      }
    }
    this.resolveLoad?.(message);
    this.resolveLoad = null;
  }

  selectAccount(node) {
    this.window.clearTimeout(this.searchTimer);
    this.includeFuture = false;
    this.currentAccount = node;
    for (const header of this.el['account-tree'].querySelectorAll('.account-header'))
      header.classList.toggle('active', header.dataset.id === node.id);
    this.el['current-account-name'].textContent = node.name;
    this.el['balance-card'].hidden = Boolean(node.isAll);
    this.el['mobile-balance-bar'].hidden = Boolean(node.isAll);
    for (const id of ['total-balance', 'mobile-total-balance']) {
      this.el[id].textContent = node.isAll ? '' : formatUsd(node.sidebarBalanceCents);
      this.el[id].className = `amount ${node.sidebarBalanceCents < 0 ? 'negative' : 'positive'}`;
    }
    if (this.window.innerWidth <= 768) this.toggleSidebar(false);
    this.requestPage(1);
  }

  clearRegister() {
    this.el['future-summary'].hidden = true;
    this.el['transactions-body'].replaceChildren();
    this.el['transactions-table'].classList.add('hidden');
    this.el['no-results'].classList.add('hidden');
    this.el['pagination-controls'].classList.add('hidden');
    this.el['register-status'].hidden = true;
    this.el['prev-page'].disabled = true;
    this.el['next-page'].disabled = true;
  }

  requestPage(page) {
    this.clearRegister();
    this.el['total-transactions'].textContent = '—';
    this.el['register-status'].textContent = 'Loading transactions…';
    this.el['register-status'].hidden = false;
    this.document.querySelector('.content-body').scrollTop = 0;
    this.client.query({ accountId: this.currentAccount.isAll ? null : this.currentAccount.id, text: this.searchText, page, includeFuture: this.includeFuture });
  }

  renderPage(message) {
    this.page = message.page;
    this.el['register-status'].hidden = true;
    this.el['total-transactions'].textContent = String(message.totalMatches);
    const future = message.future;
    this.el['future-summary'].hidden = this.includeFuture || !future.count;
    this.el['future-summary'].textContent = `${future.count} Future Transaction${future.count === 1 ? '' : 's'}: ${future.amountCents > 0 ? '+' : ''}${formatUsd(future.amountCents)}`;
    this.el['no-results'].querySelector('p').textContent = future.count && !this.includeFuture ? 'No current or past matches. Future transactions are available above.' : this.searchText.trim() ? 'No results found.' : 'No transactions found.';
    let previousYear;
    const rows = message.rows.map(row => {
      const {year, month, day} = transactionDateParts(row.date);
      const showYearDivider = year !== previousYear;
      previousYear = year;
      return { ...row, year, month, day, showYearDivider, isFuture: row.date > this.metadata.effectiveDate };
    });
    this.el['transactions-body'].innerHTML = this.transactionsTemplate({ paginatedTransactions: rows, isRoot: this.currentAccount.isAll || Boolean(this.searchText.trim()),
      columnCount: this.mobileLayout.matches ? 3 : 5 });
    this.el['transactions-table'].classList.toggle('hidden', rows.length === 0);
    this.el['no-results'].classList.toggle('hidden', rows.length !== 0);
    const pages = Math.max(1, Math.ceil(message.totalMatches / message.pageSize));
    this.el['page-info'].textContent = `Page ${message.page} of ${pages}`;
    this.el['pagination-controls'].classList.toggle('hidden', pages === 1);
    this.el['prev-page'].disabled = message.page === 1;
    this.el['next-page'].disabled = message.page === pages;
  }

  updateYearColumns() {
    for (const heading of this.el['transactions-body'].querySelectorAll('.sticky-year'))
      heading.colSpan = this.mobileLayout.matches ? 3 : 5;
  }

  toggleSidebar(show) {
    this.el.sidebar.classList.toggle('open', show);
    this.el['sidebar-overlay'].classList.toggle('hidden', !show);
    this.el['sidebar-overlay'].classList.toggle('show', show);
  }

  toggleTheme(light = !this.document.body.classList.contains('light-mode')) {
    this.document.body.classList.toggle('light-mode', light);
    this.el['theme-toggle'].innerHTML = light ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    try { this.window.localStorage.setItem('theme', light ? 'light' : 'dark'); } catch { /* optional preference */ }
  }

  dispose() { this.passwordInput.value = '';  this.window.clearTimeout(this.searchTimer); this.client.dispose(); this.handles.abort(); this.headerObserver.disconnect(); }
}

// Use the same bootstrap in production and lifecycle regression scenarios.
export function startViewer(options) {
  const app = new App(options);
  app.window.addEventListener('pagehide', event => {
    // A cached document resumes its existing session, including its worker/date.
    // Keep this listener through repeated cache visits; dispose only on departure.
    if (!event.persisted) app.dispose();
  }, { signal: app.handles.signal });
  void app.start();
  return app;
}

// The harness imports the controller without starting another instance.
if (document.querySelector('script[type="module"][src="app.js"]')) {
  try {
    startViewer();
  } catch {
    document.getElementById('app').dataset.state = 'error';
    const status = document.getElementById('load-status');
    status.className = 'is-error';
    status.setAttribute('role', 'alert');
    status.textContent = 'Unable to initialize the viewer. Reload the page to retry.';
    status.hidden = false;
  }
}
