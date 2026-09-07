import { createSnapshotClient } from './src/worker-client.mjs';
import { formatUsd } from './src/money.mjs';

const getAccountIcon = type => ({ BANK: 'fa-building-columns', CREDIT_CARD: 'fa-credit-card',
  LOAN: 'fa-hand-holding-dollar', ASSET: 'fa-sack-dollar', LIABILITY: 'fa-file-invoice-dollar' }[type] || 'fa-wallet');

export class App {
  constructor({ document = globalThis.document, handlebars = globalThis.Handlebars,
    pageUrl = globalThis.location.href, config = globalThis.MONEYDANCE_CONFIG } = {}) {
    this.document = document;
    this.window = document.defaultView;
    this.pageUrl = pageUrl;
    this.handles = new this.window.AbortController();
    this.nodes = new Map();
    this.el = Object.fromEntries(['account-tree', 'current-account-name', 'total-balance',
      'mobile-total-balance', 'balance-card', 'mobile-balance-bar', 'total-transactions',
      'search-input', 'load-status', 'test-data-link', 'test-data-indicator', 'sidebar',
      'sidebar-overlay', 'theme-toggle'].map(id => [id, document.getElementById(id)]));
    handlebars.registerHelper('getAccountIcon', getAccountIcon);
    handlebars.registerHelper('formatCurrency', formatUsd);
    handlebars.registerHelper('isPositive', amount => amount > 0);
    handlebars.registerHelper('isNegative', amount => amount < 0);
    handlebars.registerPartial('accountNode', document.getElementById('account-node-partial').innerHTML);
    this.treeTemplate = handlebars.compile(document.getElementById('account-tree-template').innerHTML);
    this.client = createSnapshotClient({ pageUrl, config, onMessage: message => this.receive(message) });
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
    try { this.toggleTheme(this.window.localStorage.getItem('theme') !== 'dark'); } catch { /* theme storage is optional */ }
  }

  start() {
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
    return new Promise(resolve => { this.resolveLoad = resolve; this.client.load(); });
  }

  receive(message) {
    if (message.type === 'ready') {
      this.metadata = message.metadata;
      const root = { id: '', name: 'All Accounts', type: 'ROOT', isAll: true, isOpen: true, children: message.accounts };
      const index = node => { this.nodes.set(node.id, node); node.children.forEach(index); };
      index(root);
      this.el['account-tree'].innerHTML = this.treeTemplate(root);
      this.el['total-transactions'].textContent = String(message.totalCount);
      this.el['load-status'].hidden = true;
      this.el['load-status'].classList.remove('is-loading');
      this.selectAccount(root);
    } else if (message.type === 'error') {
      this.nodes.clear();
      this.el['account-tree'].replaceChildren();
      this.el['balance-card'].hidden = true;
      this.el['mobile-balance-bar'].hidden = true;
      this.el['total-transactions'].textContent = '—';
      this.el['load-status'].hidden = false;
      this.el['load-status'].classList.remove('is-loading');
      this.el['load-status'].classList.add('is-error');
      this.el['load-status'].setAttribute('role', 'alert');
      this.el['load-status'].textContent = `Unable to load accounts. ${message.message} Reload the page to retry.`;
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

  dispose() { this.client.dispose(); this.handles.abort(); }
}

// The harness imports the controller without starting another instance.
if (document.querySelector('script[type="module"][src="app.js"]')) {
  const app = new App();
  void app.start();
  window.addEventListener('pagehide', () => app.dispose(), { once: true });
}
