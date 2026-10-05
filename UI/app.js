import { createSnapshotClient } from './src/worker-client.mjs';
import { formatUsd } from './src/money.mjs';
import { formatExportDate, transactionDateParts } from './src/format.mjs';
import { projectSidebar } from './src/sidebar.mjs';

const getAccountIcon = type => ({ ROOT: 'checkbook', BANK: 'account_balance', CREDIT_CARD: 'credit_card',
  EXPENSE: 'sell', INCOME: 'paid', LOAN: 'payment_arrow_down', ASSET: 'money_bag', LIABILITY: 'receipt_long' }[type] || 'account_balance');
const isCategory = node => ['INCOME','EXPENSE'].includes(node?.type);

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
      'sidebar-overlay', 'theme-toggle', 'navigation-status'].map(id => [id, document.getElementById(id)]));
    handlebars.registerHelper('getAccountIcon', getAccountIcon);
    handlebars.registerHelper('formatCurrency', formatUsd);
    handlebars.registerHelper('isPositive', amount => amount > 0);
    handlebars.registerHelper('isNegative', amount => amount < 0);
    handlebars.registerPartial('accountNode', document.getElementById('account-node-partial').innerHTML);
    this.treeTemplate = handlebars.compile(document.getElementById('account-tree-template').innerHTML);
    this.transactionsTemplate = handlebars.compile(document.getElementById('transactions-template').innerHTML);
    this.detailsDialog = document.getElementById('split-details');
    for (const id of ['transactions-body', 'transactions-table', 'no-results', 'pagination-controls', 'prev-page', 'next-page', 'page-info', 'register-status', 'future-summary'])
      this.el[id] = document.getElementById(id);
    this.page = 1;
    this.searchText = '';
    this.navigation = null;
    this.pendingNavigation = null;
    this.sidebarSection = 'accounts';
    this.categoryGrouping = 'month';
    this.expandedAccounts = new Set(['']);
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
    listen(this.el['transactions-body'], event => {
      const account = event.target.closest('button.transaction-account');
      if (account) {
        this.navigate({mode:'exact',accountId:account.dataset.accountId,entryId:account.dataset.entryId});
        return;
      }
      const trigger = event.target.closest('.category-details');
      if (trigger) this.openDetails(trigger);
    });
    listen(document.getElementById('details-close'), () => this.closeDetails());
    this.detailsDialog.addEventListener('cancel', event => { event.preventDefault(); this.closeDetails(); }, {signal:this.handles.signal});
    listen(this.el['account-tree'], event => {
      const header = event.target.closest('.account-header');
      if (!header) return;
      if (event.target.closest('.account-toggle') && header.nextElementSibling) {
        header.querySelector('.account-toggle').classList.toggle('open');
        header.nextElementSibling.classList.toggle('open');
        if (header.nextElementSibling.classList.contains('open')) this.expandedAccounts.add(header.dataset.id);
        else this.expandedAccounts.delete(header.dataset.id);
        return;
      }
      const node = this.nodes.get(header.dataset.id);
      if (node) this.selectAccount(node);
    });
    listen(document.getElementById('open-sidebar'), () => this.toggleSidebar(true));
    listen(document.getElementById('close-sidebar'), () => this.toggleSidebar(false));
    listen(this.el['sidebar-overlay'], () => this.toggleSidebar(false));
    listen(this.el['theme-toggle'], () => this.toggleTheme());
    for (const section of ['accounts','categories'])
      listen(document.getElementById(`show-${section}`), () => this.renderSidebar(section));
    document.getElementById('category-grouping').addEventListener('click', event => {
      const button = event.target.closest('button[data-grouping]');
      if (!button || !isCategory(this.currentAccount)) return;
      this.categoryGrouping = button.dataset.grouping;
      this.setAccount(this.currentAccount);
      this.window.clearTimeout(this.searchTimer);
      this.requestPage(1);
    }, {signal:this.handles.signal});
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
      if (this.detailsDialog.open || this.mobileLayout.matches || this.el['search-input'].disabled || event.isComposing) return;
      if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        this.el['search-input'].focus();
        this.el['search-input'].select();
      }
    }, { signal: this.handles.signal });
    this.el['search-input'].addEventListener('input', () => {
      this.resetNavigation();
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
      this.el['total-transactions'].textContent = message.totalCount.toLocaleString('en-US');
      this.el['load-status'].hidden = !this.snapshotEmpty;
      this.el['load-status'].textContent = this.snapshotEmpty ? 'Snapshot loaded. No transactions in this export.' : '';
      this.el['load-status'].classList.remove('is-loading');
      this.selectAccount(root);
    } else if (message.type === 'page') {
      if (this.pendingNavigation?.pageRequestId === message.requestId) {
        const target = this.pendingNavigation.target;
        this.pendingNavigation = null;
        this.searchText = '';
        this.el['search-input'].value = '';
        this.el['clear-search'].hidden = true;
        this.includeFuture = target.includeFuture;
        this.closeDetails(false);
        this.toggleSidebar(false);
        this.setAccount(this.nodes.get(target.accountId));
        this.navigation = {accountId:target.accountId, entryIds:new Set(target.entryIds), focusEntryId:target.focusEntryId};
        this.el['navigation-status'].textContent = `${target.entryIds.length} related transaction${target.entryIds.length === 1 ? '' : 's'} highlighted.`;
        this.el['navigation-status'].hidden = false;
      }
      this.renderPage(message);
    } else if (message.type === 'located') {
      if (this.pendingNavigation?.locateRequestId !== message.requestId) return;
      const pageRequestId = this.client.queryLocated(message, message.requestId, this.categoryGrouping);
      if (pageRequestId !== null) this.pendingNavigation = {target:message,pageRequestId};
    } else if (message.type === 'navigationUnavailable') {
      if (this.pendingNavigation?.locateRequestId !== message.requestId) return;
      this.pendingNavigation = null;
      this.el['navigation-status'].textContent = message.message;
      this.el['navigation-status'].hidden = false;
    } else if (message.type === 'details' || message.type === 'detailsUnavailable') {
      if (this.detailsDialog.open) this.renderDetails(message);
    } else if (message.type === 'error') {
      this.resetNavigation();
      this.passwordInput.value = ''; this.unlockForm.hidden = true;
      this.document.getElementById('app').dataset.state = 'error';
      this.el['as-of-date'].hidden = true;
      this.el['as-of-date'].textContent = '';
      this.metadata = null;
      this.currentAccount = null;
      this.document.getElementById('category-controls').hidden = true;
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
    this.resetNavigation();
    this.includeFuture = false;
    this.setAccount(node);
    if (this.window.innerWidth <= 768) this.toggleSidebar(false);
    this.requestPage(1);
  }

  setAccount(node) {
    this.currentAccount = node;
    const section = isCategory(node) ? 'categories' : 'accounts';
    if (section !== this.sidebarSection || !this.el['account-tree'].children.length) this.renderSidebar(section);
    for (const header of this.el['account-tree'].querySelectorAll('.account-header'))
      header.classList.toggle('active', header.dataset.id === node.id);
    this.document.getElementById('category-controls').hidden = !isCategory(node);
    for (const button of this.document.querySelectorAll('#category-grouping button'))
      button.setAttribute('aria-pressed', String(button.dataset.grouping === this.categoryGrouping));
    this.document.getElementById('running-balance-heading').hidden = isCategory(node);
    this.el['transactions-table'].closest('.transactions-section').classList.toggle('category-ledger', isCategory(node));
    this.el['current-account-name'].textContent = node.name;
    const hideBalance = Boolean(node.isAll) || (isCategory(node) && this.categoryGrouping !== 'all');
    this.el['balance-card'].hidden = hideBalance;
    this.el['mobile-balance-bar'].hidden = hideBalance;
    for (const id of ['total-balance', 'mobile-total-balance']) {
      this.el[id].textContent = node.isAll ? '' : formatUsd(node.sidebarBalanceCents);
      this.el[id].className = `amount ${node.sidebarBalanceCents < 0 ? 'negative' : 'positive'}`;
    }
  }

  renderSidebar(section = this.sidebarSection) {
    this.sidebarSection = section;
    this.document.getElementById('sidebar-section-title').textContent = section === 'categories' ? 'Categories' : 'Accounts';
    for (const value of ['accounts','categories'])
      this.document.getElementById(`show-${value}`).setAttribute('aria-pressed', String(value === section));
    const root = this.nodes.get('');
    if (!root) return;
    const children = projectSidebar(root.children, section, this.expandedAccounts);
    this.el['account-tree'].innerHTML = section === 'accounts' ?
      this.treeTemplate({...root,children,isOpen:this.expandedAccounts.has('')}) :
      children.map(node => this.treeTemplate(node)).join('');
    for (const header of this.el['account-tree'].querySelectorAll('.account-header'))
      header.classList.toggle('active', header.dataset.id === this.currentAccount?.id);
  }

  resetNavigation() {
    this.navigation = null;
    this.pendingNavigation = null;
    for (const row of this.el['transactions-body'].querySelectorAll('.navigation-target')) {
      row.classList.remove('navigation-target');
      row.removeAttribute('tabindex');
    }
    this.el['navigation-status'].hidden = true;
    this.el['navigation-status'].textContent = '';
  }

  navigate(target) {
    this.window.clearTimeout(this.searchTimer);
    this.resetNavigation();
    this.closeDetails(false);
    this.toggleSidebar(false);
    this.el['navigation-status'].textContent = 'Finding transaction…';
    this.el['navigation-status'].hidden = false;
    // Keep the current register and search intact until a target page succeeds.
    const locateRequestId = this.client.locate(target);
    this.pendingNavigation = {locateRequestId};
  }

  clearRegister() {
    this.closeDetails(false);
    this.document.getElementById('category-scope').textContent = '';
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
    if (this.pendingNavigation) this.resetNavigation();
    this.clearRegister();
    this.el['total-transactions'].textContent = '—';
    this.el['register-status'].textContent = 'Loading transactions…';
    this.el['register-status'].hidden = false;
    this.document.querySelector('.content-body').scrollTop = 0;
    this.client.query({ accountId: this.currentAccount.isAll ? null : this.currentAccount.id, text: this.searchText, page, includeFuture: this.includeFuture, grouping: this.categoryGrouping });
  }

  renderPage(message) {
    this.page = message.page;
    this.el['register-status'].hidden = true;
    this.el['total-transactions'].textContent = message.totalMatches.toLocaleString('en-US');
    const future = message.future;
    this.el['future-summary'].hidden = this.includeFuture || !future.count;
    this.el['future-summary'].textContent = `${future.count} Future Transaction${future.count === 1 ? '' : 's'}: ${future.amountCents > 0 ? '+' : ''}${formatUsd(future.amountCents)}`;
    this.el['no-results'].querySelector('p').textContent = future.count && !this.includeFuture ? 'No current or past matches. Future transactions are available above.' : this.searchText.trim() ? 'No results found.' : 'No transactions found.';
    let previousYear;
    const periods = new Map((message.periods || []).map(period => [period.rowIndex,period]));
    this.document.getElementById('category-scope').textContent = (message.grouping && message.periodScope === 'matching') ? 'Matches in category + descendants' : '';
    const rows = message.rows.map((row, index) => {
      const {year, month, day} = transactionDateParts(row.date);
      const showYearDivider = !message.periods && year !== previousYear;
      previousYear = year;
      return { ...row, year, month, day, showYearDivider, period:periods.get(index), isFuture: row.date > this.metadata.effectiveDate,
        isNavigationTarget: this.navigation?.accountId === row.accountId && this.navigation.entryIds.has(row.id),
        accountIcon: getAccountIcon(this.nodes.get(row.accountId)?.type) };
    });
    this.el['transactions-body'].innerHTML = this.transactionsTemplate({ paginatedTransactions: rows, isRoot: this.currentAccount.isAll || Boolean(this.searchText.trim()),
      isSearch: Boolean(this.searchText.trim()), hideRunningBalance: isCategory(this.currentAccount),
      columnCount: this.mobileLayout.matches ? 3 : isCategory(this.currentAccount) ? 4 : 5 });
    this.el['transactions-table'].classList.toggle('hidden', rows.length === 0);
    this.el['no-results'].classList.toggle('hidden', rows.length !== 0);
    const pages = Math.max(1, Math.ceil(message.totalMatches / message.pageSize));
    this.el['page-info'].textContent = `Page ${message.page} of ${pages}`;
    this.el['pagination-controls'].classList.toggle('hidden', pages === 1);
    this.el['prev-page'].disabled = message.page === 1;
    this.el['next-page'].disabled = message.page === pages;
    if (this.navigation?.focusEntryId) {
      const target = [...this.el['transactions-body'].querySelectorAll('tr.navigation-target')]
        .find(row => row.dataset.entryId === this.navigation.focusEntryId);
      if (target) {
        // scrollIntoView also scrolls overflow:hidden ancestors, moving the topbar.
        // Center within the register's own scroll pane instead.
        const pane = this.document.querySelector('.content-body');
        const paneRect = pane.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        pane.scrollTop += targetRect.top - paneRect.top - pane.clientTop
          - (pane.clientHeight - targetRect.height) / 2;
        target.focus({preventScroll:true});
      }
      this.navigation.focusEntryId = null;
    }
  }

  updateYearColumns() {
    for (const heading of this.el['transactions-body'].querySelectorAll('.sticky-year, .period-heading'))
      heading.colSpan = this.mobileLayout.matches ? 3 : isCategory(this.currentAccount) ? 4 : 5;
  }

  openDetails(trigger) {
    if (this.pendingNavigation) {
      this.client.invalidatePending();
      this.resetNavigation();
    }
    this.closeDetails(false);
    this.detailsTrigger = trigger;
    this.detailsScroll = this.document.querySelector('.content-body').scrollTop;
    for (const id of ['details-description','details-amount','details-context','details-total','details-note'])
      this.document.getElementById(id).textContent = '';
    this.document.getElementById('details-body').textContent = 'Loading split details…';
    this.detailsDialog.querySelector('footer').hidden = true;
    this.detailsDialog.showModal();
    this.document.getElementById('details-close').focus({preventScroll:true});
    this.client.details({accountId:trigger.dataset.accountId,entryId:trigger.dataset.entryId});
  }

  closeDetails(restore = true) {
    this.client?.invalidateDetails();
    if (!this.detailsDialog?.open) return;
    this.detailsDialog.close();
    this.document.getElementById('details-body').replaceChildren();
    if (restore) {
      if (this.detailsTrigger?.isConnected) this.detailsTrigger.focus({preventScroll:true});
      this.document.querySelector('.content-body').scrollTop = this.detailsScroll;
    }
    this.detailsTrigger = null;
  }

  renderDetails(details) {
    const make = (tag, cls, text) => {
      const node = this.document.createElement(tag);
      node.className = cls;
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const body = this.document.getElementById('details-body');
    body.replaceChildren(); body.scrollTop = 0;
    if (details.type === 'detailsUnavailable') { body.textContent = details.message; return; }
    const amount = (id, value) => {
      const node=this.document.getElementById(id);
      node.textContent=value === null ? 'Unavailable' : formatUsd(value);
      node.classList.toggle('negative',value !== null && value < 0);
    };
    this.document.getElementById('details-description').textContent = details.description;
    this.document.getElementById('details-context').textContent = `${details.date} · ${details.accountPath}`;
    amount('details-amount',details.amountCents); amount('details-total',details.totalCents);
    const list = make('ol','details-allocations');
    for (const allocation of details.allocations) {
      const item=make('li','details-allocation');
      const path=make(allocation.destinationAvailable ? 'button' : 'div','details-path',allocation.path);
      if (allocation.destinationAvailable) {
        path.type = 'button';
        path.classList.add('details-transfer');
        path.title = `View related transactions in ${allocation.path}`;
        path.addEventListener('click', () => this.navigate({mode:'transfer',destinationAccountId:allocation.accountId,transactionId:details.transactionId}));
      }
      item.append(path,
        make('div','details-money'+(allocation.amountCents < 0 ? ' negative' : ''),allocation.amountCents === null ? 'Unavailable' : formatUsd(allocation.amountCents)));
      if (allocation.memo) {
        item.append(make('div','details-memo',allocation.memo));
      }
      if (allocation.tags?.length) {
        const tags=make('div','details-tags');
        for (const tag of allocation.tags) tags.append(make('span','details-tag',tag));item.append(tags);
      }
      if (allocation.unavailableReason) item.append(make('div','details-reason',allocation.unavailableReason));
      list.append(item);
    }
    if (details.allocations.length) body.append(list);
    else body.append(make('p','details-empty','Uncategorized — no allocations are available for this entry.'));
    this.detailsDialog.querySelector('footer').hidden = false;
    this.document.getElementById('details-note').textContent = details.totalCents !== null ?
      `${details.allocations.length} allocation${details.allocations.length === 1 ? '' : 's'}` :
      details.allocations.length ? 'One or more split amounts are unavailable.' : 'No allocation total is available.';
  }

  toggleSidebar(show) {
    this.el.sidebar.classList.toggle('open', show);
    this.el['sidebar-overlay'].classList.toggle('hidden', !show);
    this.el['sidebar-overlay'].classList.toggle('show', show);
  }

  toggleTheme(light = !this.document.body.classList.contains('light-mode')) {
    this.document.body.classList.toggle('light-mode', light);
    this.el['theme-toggle'].innerHTML = `<span class="mi mi-${light ? 'dark_mode' : 'light_mode'}" aria-hidden="true"></span>`;
    try { this.window.localStorage.setItem('theme', light ? 'light' : 'dark'); } catch { /* optional preference */ }
  }

  dispose() { this.closeDetails(false); this.passwordInput.value = '';  this.window.clearTimeout(this.searchTimer); this.client.dispose(); this.handles.abort(); this.headerObserver.disconnect(); }
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
