const retrieveData = async () => {
  try {
    const response = await fetch("./data.json");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to load mock data:", error);
    throw error;
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const getAccountIcon = (type) => {
  switch (type) {
    case "BANK":
      return "fa-building-columns";
    case "CREDIT_CARD":
      return "fa-credit-card";
    case "LOAN":
      return "fa-hand-holding-dollar";
    case "ASSET":
      return "fa-sack-dollar";
    case "LIABILITY":
      return "fa-file-invoice-dollar";
    default:
      return "fa-wallet";
  }
};

const calculateTotalBalance = (node) => {
  if (node.balance !== undefined) return node.balance;
  if (!node.children || node.children.length === 0) return 0;
  return node.children.reduce(
    (sum, child) => sum + calculateTotalBalance(child),
    0
  );
};

class App {
  constructor(data) {
    this.data = data;
    this.currentAccount = null;
    this.allTransactions = [];
    this.searchQuery = "";
    this.currentPage = 1;
    this.itemsPerPage = 100;

    this.init();
  }

  static async create() {
    const data = await retrieveData();
    return new App(data);
  }

  init() {
    this.cacheDOM();
    this.bindEvents();

    if (localStorage.getItem("theme") === "light") {
      this.toggleTheme(true);
    }

    this.extractAllTransactions();
    this.renderAccountTree();
    this.selectAccount(this.data); // Select root by default
  }

  cacheDOM() {
    this.accountTreeEl = document.getElementById("account-tree");
    this.transactionsBodyEl = document.getElementById("transactions-body");
    this.currentAccountNameEl = document.getElementById("current-account-name");
    this.totalBalanceEl = document.getElementById("total-balance");
    this.mobileTotalBalanceEl = document.getElementById("mobile-total-balance");
    this.totalTransactionsEl = document.getElementById("total-transactions");
    this.searchInputEl = document.getElementById("search-input");
    this.noResultsEl = document.getElementById("no-results");
    this.transactionsTableEl = document.getElementById("transactions-table");

    this.paginationControlsEl = document.getElementById("pagination-controls");
    this.prevPageBtn = document.getElementById("prev-page");
    this.nextPageBtn = document.getElementById("next-page");
    this.pageInfoEl = document.getElementById("page-info");

    // Mobile sidebar
    this.sidebarEl = document.getElementById("sidebar");
    this.overlayEl = document.getElementById("sidebar-overlay");
    this.openSidebarBtn = document.getElementById("open-sidebar");
    this.closeSidebarBtn = document.getElementById("close-sidebar");

    this.themeToggleBtn = document.getElementById("theme-toggle");
    
    // Register Handlebars helpers and partials
    Handlebars.registerHelper('getAccountIcon', getAccountIcon);
    Handlebars.registerHelper('formatCurrency', formatCurrency);
    Handlebars.registerHelper('isPositive', (amount) => amount > 0);
    Handlebars.registerHelper('isNegative', (amount) => amount < 0);
    Handlebars.registerHelper('getTotalBalance', calculateTotalBalance);
    
    Handlebars.registerPartial('accountNode', document.getElementById('account-node-partial').innerHTML);
    
    this.accountTreeTemplate = Handlebars.compile(document.getElementById('account-tree-template').innerHTML);
    this.transactionsTemplate = Handlebars.compile(document.getElementById('transactions-template').innerHTML);
  }

  bindEvents() {
    this.searchInputEl.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.currentPage = 1;
      this.renderTransactions();
    });

    this.openSidebarBtn.addEventListener("click", () =>
      this.toggleSidebar(true),
    );
    this.closeSidebarBtn.addEventListener("click", () =>
      this.toggleSidebar(false),
    );
    this.overlayEl.addEventListener("click", () => this.toggleSidebar(false));

    this.themeToggleBtn.addEventListener("click", () => this.toggleTheme());

    this.prevPageBtn.addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderTransactions();
        this.scrollToTop();
      }
    });

    this.nextPageBtn.addEventListener("click", () => {
      this.currentPage++;
      this.renderTransactions();
      this.scrollToTop();
    });
    
    // Account tree event delegation
    this.accountTreeEl.addEventListener('click', (e) => {
      const header = e.target.closest('.account-header');
      if (!header) return;
      
      const toggle = header.querySelector('.account-toggle');
      const subContainer = header.nextElementSibling;
      const hasChildren = subContainer && subContainer.classList.contains('sub-accounts');
      
      if (hasChildren && (e.target.closest('.account-toggle') || e.target.classList.contains('account-toggle'))) {
        toggle.classList.toggle('open');
        subContainer.classList.toggle('open');
        e.stopPropagation();
        return;
      }
      
      const id = header.dataset.id;
      const node = this.findNodeById(this.data, id);
      if (node) this.selectAccount(node, header);
    });
  }

  scrollToTop() {
    const contentBody = document.querySelector(".content-body");
    if (contentBody) contentBody.scrollTop = 0;
  }

  toggleTheme(forceLight = null) {
    if (forceLight !== null) {
      document.body.classList.toggle("light-mode", forceLight);
    } else {
      document.body.classList.toggle("light-mode");
    }

    const isLight = document.body.classList.contains("light-mode");
    this.themeToggleBtn.innerHTML = isLight
      ? '<i class="fa-solid fa-moon"></i>'
      : '<i class="fa-solid fa-sun"></i>';
    localStorage.setItem("theme", isLight ? "light" : "dark");
  }

  toggleSidebar(show) {
    if (show) {
      this.sidebarEl.classList.add("open");
      this.overlayEl.classList.remove("hidden");
      setTimeout(() => this.overlayEl.classList.add("show"), 10);
    } else {
      this.sidebarEl.classList.remove("open");
      this.overlayEl.classList.remove("show");
      setTimeout(() => this.overlayEl.classList.add("hidden"), 300);
    }
  }

  extractAllTransactions(node = this.data, acc = []) {
    if (node.transactions) {
      node.transactions.forEach((t) => {
        acc.push({ ...t, accountName: node.name });
      });
    }
    if (node.children) {
      node.children.forEach((child) => this.extractAllTransactions(child, acc));
    }
    this.allTransactions = acc.sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    return acc;
  }

  getAccountTransactions(node) {
    let txs = [];
    this.extractAllTransactions(node, txs);
    return txs;
  }

  calculateTotalBalance(node) {
    return calculateTotalBalance(node);
  }
  
  findNodeById(node, id) {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  renderAccountTree() {
    this.data.isOpen = true; // Make root open by default
    this.accountTreeEl.innerHTML = this.accountTreeTemplate(this.data);
  }

  selectAccount(node, headerEl = null) {
    this.currentAccount = node;

    // Update active class
    document
      .querySelectorAll(".account-header")
      .forEach((el) => el.classList.remove("active"));
    if (headerEl) {
      headerEl.classList.add("active");
    } else {
      // Find root header
      const rootHeader = document.querySelector(
        `.account-header[data-id="${node.id}"]`,
      );
      if (rootHeader) rootHeader.classList.add("active");
    }

    this.currentAccountNameEl.textContent =
      node.id === "root" ? "All Accounts" : node.name;

    const balance = this.calculateTotalBalance(node);
    this.totalBalanceEl.textContent = formatCurrency(balance);
    this.totalBalanceEl.className = `amount ${balance >= 0 ? "positive" : "negative"}`;

    if (this.mobileTotalBalanceEl) {
      this.mobileTotalBalanceEl.textContent = formatCurrency(balance);
      this.mobileTotalBalanceEl.className = `amount ${balance >= 0 ? "positive" : "negative"}`;
    }

    // Reset search and pagination
    this.searchInputEl.value = "";
    this.searchQuery = "";
    this.currentPage = 1;

    this.renderTransactions();

    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
      this.toggleSidebar(false);
    }
  }

  renderTransactions() {
    let transactions =
      this.currentAccount.id === "root"
        ? this.allTransactions
        : this.getAccountTransactions(this.currentAccount);

    if (this.searchQuery) {
      transactions = transactions.filter(
        (t) =>
          (t.description && t.description.toLowerCase().includes(this.searchQuery)) ||
          (t.category && t.category.toLowerCase().includes(this.searchQuery)) ||
          (t.accountName && t.accountName.toLowerCase().includes(this.searchQuery)) ||
          (t.memo && t.memo.toLowerCase().includes(this.searchQuery)) ||
          (t.checkNumber && t.checkNumber.toLowerCase().includes(this.searchQuery)) ||
          t.amount.toString().includes(this.searchQuery)
      );
    }

    this.totalTransactionsEl.textContent = transactions.length;

    if (transactions.length === 0) {
      this.transactionsTableEl.classList.add("hidden");
      this.noResultsEl.classList.remove("hidden");
      this.paginationControlsEl.classList.add("hidden");
    } else {
      this.transactionsTableEl.classList.remove("hidden");
      this.noResultsEl.classList.add("hidden");

      const totalPages = Math.ceil(transactions.length / this.itemsPerPage);
      if (this.currentPage > totalPages && totalPages > 0)
        this.currentPage = totalPages;

      if (totalPages > 1) {
        this.paginationControlsEl.classList.remove("hidden");
        this.pageInfoEl.textContent = `Page ${this.currentPage} of ${totalPages}`;
        this.prevPageBtn.disabled = this.currentPage === 1;
        this.nextPageBtn.disabled = this.currentPage === totalPages;
      } else {
        this.paginationControlsEl.classList.add("hidden");
      }

      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const paginatedTransactions = transactions.slice(startIndex, startIndex + this.itemsPerPage);

      let currentYear = null;
      const processedTransactions = paginatedTransactions.map(t => {
          const [year, month, day] = t.date.split("-");
          const showYearDivider = year !== currentYear;
          if (showYearDivider) currentYear = year;
          
          return {
              ...t,
              year, month, day,
              showYearDivider
          };
      });
      
      this.transactionsBodyEl.innerHTML = this.transactionsTemplate({
          paginatedTransactions: processedTransactions,
          isRoot: this.currentAccount.id === "root"
      });
    }
  }
}

// Initialize App
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await App.create();
  } catch (error) {
    console.error("Failed to initialize application:", error);
  }
});
