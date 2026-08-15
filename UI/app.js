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
    const ul = document.createElement("ul");
    ul.className = "account-item";
    this.buildAccountNode(this.data, ul, true);
    this.accountTreeEl.appendChild(ul);
  }

  buildAccountNode(node, container, isOpen = false) {
    const hasChildren = node.children && node.children.length > 0;

    const header = document.createElement("div");
    header.className = "account-header";
    header.dataset.id = node.id;

    const toggle = document.createElement("div");
    toggle.className = `account-toggle ${hasChildren ? "" : "empty"} ${isOpen ? "open" : ""}`;
    toggle.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';

    const icon = document.createElement("div");
    icon.className = "account-icon";
    icon.innerHTML = `<i class="fa-solid ${getAccountIcon(node.type)}"></i>`;

    const name = document.createElement("div");
    name.className = "account-name";
    name.textContent = node.name;

    const balance = document.createElement("div");
    balance.className = "account-balance";
    const nodeBalance = this.calculateTotalBalance(node);
    balance.textContent = formatCurrency(nodeBalance);
    if (nodeBalance < 0) balance.style.color = "var(--text-main)";
    else if (nodeBalance > 0) balance.style.color = "var(--positive)";

    header.appendChild(toggle);
    header.appendChild(icon);
    header.appendChild(name);
    header.appendChild(balance);

    container.appendChild(header);

    let subContainer = null;
    if (hasChildren) {
      subContainer = document.createElement("div");
      subContainer.className = `sub-accounts ${isOpen ? "open" : ""}`;

      node.children.forEach((child) => {
        const childWrapper = document.createElement("div");
        childWrapper.className = "account-item";
        this.buildAccountNode(child, childWrapper);
        subContainer.appendChild(childWrapper);
      });

      container.appendChild(subContainer);
    }

    // Event Listeners
    header.addEventListener("click", (e) => {
      // If clicked on toggle and has children, just toggle
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

      let currentYear = null;
      let rowsHtml = "";

      paginatedTransactions.forEach((t) => {
        const amountClass = t.amount >= 0 ? "positive" : "negative";
        const descDisplay =
          this.currentAccount.id === "root"
            ? `<div>${t.description}</div><div style="font-size: 0.8rem; color: var(--text-muted);">${t.accountName}</div>`
            : t.description;

        const [year, month, day] = t.date.split("-");

        if (year !== currentYear) {
          rowsHtml += `
                        <tr class="year-divider">
                            <th colspan="5" class="sticky-year">
                                ${year}
                            </th>
                        </tr>
                    `;
          currentYear = year;
        }

        rowsHtml += `
                    <tr>
                        <td>
                            <span class="desktop-date">${t.date}</span>
                            <span class="mobile-date">${month}/${day}</span>
                        </td>
                        <td>${descDisplay}</td>
                        <td><span style="background: var(--tag-bg); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${t.category}</span></td>
                        <td class="amount-col amount ${amountClass}">${formatCurrency(t.amount)}</td>
                        <td class="amount-col">${formatCurrency(t.balance)}</td>
                    </tr>
                `;
      });
      this.transactionsBodyEl.innerHTML = rowsHtml;
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
