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
    if (node.balance !== undefined) return node.balance;
    if (!node.children || node.children.length === 0) return 0;
    return node.children.reduce(
      (sum, child) => sum + this.calculateTotalBalance(child),
      0,
    );
  }

  renderAccountTree() {
    this.accountTreeEl.innerHTML = "";
    this.buildAccountNode(this.data, this.accountTreeEl, true);
  }

  buildAccountNode(node, container, isOpen = false) {
    const hasChildren = node.children && node.children.length > 0;

    const template = document.getElementById("tpl-account-node").content;
    const clone = document.importNode(template, true);

    const itemWrapper = clone.querySelector(".account-item");
    const header = clone.querySelector(".account-header");
    const toggle = clone.querySelector(".account-toggle");
    const icon = clone.querySelector(".account-icon i");
    const name = clone.querySelector(".account-name");
    const balance = clone.querySelector(".account-balance");
    const subContainer = clone.querySelector(".sub-accounts");

    header.dataset.id = node.id;

    if (!hasChildren) toggle.classList.add("empty");
    if (isOpen) toggle.classList.add("open");

    icon.className = `fa-solid ${getAccountIcon(node.type)}`;
    name.textContent = node.name;

    const nodeBalance = this.calculateTotalBalance(node);
    balance.textContent = formatCurrency(nodeBalance);
    if (nodeBalance < 0) balance.style.color = "var(--text-main)";
    else if (nodeBalance > 0) balance.style.color = "var(--positive)";

    if (hasChildren) {
      if (isOpen) subContainer.classList.add("open");
      node.children.forEach((child) => {
        this.buildAccountNode(child, subContainer);
      });
    }

    // Event Listeners
    header.addEventListener("click", (e) => {
      if (
        hasChildren &&
        (e.target.closest(".account-toggle") ||
          e.target.classList.contains("account-toggle"))
      ) {
        toggle.classList.toggle("open");
        subContainer.classList.toggle("open");
        e.stopPropagation();
        return;
      }
      this.selectAccount(node, header);
    });

    container.appendChild(itemWrapper);
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
          t.description.toLowerCase().includes(this.searchQuery) ||
          t.category.toLowerCase().includes(this.searchQuery) ||
          (t.accountName &&
            t.accountName.toLowerCase().includes(this.searchQuery)) ||
          t.amount.toString().includes(this.searchQuery),
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
      const paginatedTransactions = transactions.slice(
        startIndex,
        startIndex + this.itemsPerPage,
      );

      this.transactionsBodyEl.innerHTML = "";
      const fragment = document.createDocumentFragment();
      const rowTemplate = document.getElementById(
        "tpl-transaction-row",
      ).content;
      const yearTemplate = document.getElementById("tpl-year-divider").content;

      let currentYear = null;

      paginatedTransactions.forEach((t) => {
        const amountClass = t.amount >= 0 ? "positive" : "negative";
        const [year, month, day] = t.date.split("-");

        if (year !== currentYear) {
          const yearClone = document.importNode(yearTemplate, true);
          yearClone.querySelector(".sticky-year").textContent = year;
          fragment.appendChild(yearClone);
          currentYear = year;
        }

        const clone = document.importNode(rowTemplate, true);
        clone.querySelector(".desktop-date").textContent = t.date;
        clone.querySelector(".mobile-date").textContent = `${month}/${day}`;

        const descCol = clone.querySelector(".desc-col");
        if (this.currentAccount.id === "root") {
          descCol.innerHTML = `<div>${t.description}</div><div style="font-size: 0.8rem; color: var(--text-muted);">${t.accountName}</div>`;
        } else {
          descCol.textContent = t.description;
        }

        clone.querySelector(".category-tag").textContent = t.category;

        const amountEl = clone.querySelector(".amount-col.amount");
        amountEl.textContent = formatCurrency(t.amount);
        amountEl.classList.add(amountClass);

        clone.querySelector(".amount-col.balance").textContent = formatCurrency(
          t.balance,
        );

        fragment.appendChild(clone);
      });

      this.transactionsBodyEl.appendChild(fragment);
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
