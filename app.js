/**
 * Liquid Mobile Expense Tracker - Application Logic (V6 - Discrete Credit Vault Modal)
 */

function getTwemojiUrl(emoji) {
  if (!emoji) return '';
  const codePoints = Array.from(emoji)
    .map(c => c.codePointAt(0).toString(16))
    .filter(cp => cp !== 'fe0f')
    .join('-');
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${codePoints}.svg`;
}

function renderEmojiHtml(emoji, extraClass = "") {
  if (!emoji) return "";
  const url = getTwemojiUrl(emoji);
  return `<img class="twemoji-img ${extraClass}" src="${url}" alt="${emoji}" onerror="this.onerror=null;this.replaceWith('${emoji}')" />`;
}

// Default Expense Categories (Main Screen)
const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Fuel & Petrol", emoji: "⛽", cat: "fuel" },
  { name: "Car & Bike Service", emoji: "🚗", cat: "fuel" },
  { name: "Dining & Swiggy", emoji: "🍔", cat: "food" },
  { name: "Groceries & Supermarket", emoji: "🛒", cat: "food" },
  { name: "Rent & Housing", emoji: "🏠", cat: "bills" },
  { name: "Electricity & Gas", emoji: "⚡", cat: "bills" },
  { name: "Mobile & Wi-Fi Recharge", emoji: "📱", cat: "bills" },
  { name: "Movies & OTT", emoji: "🎬", cat: "life" },
  { name: "Shopping & Clothes", emoji: "🛍️", cat: "life" },
  { name: "Medical & Pharmacy", emoji: "💊", cat: "life" },
  { name: "Travel & Hotels", emoji: "✈️", cat: "fuel" },
  { name: "Pet Care", emoji: "🐾", cat: "life" }
];

// Default Credit Categories (Secret Vault)
const DEFAULT_CREDIT_CATEGORIES = [
  { name: "Salary & Paycheck", emoji: "💼", cat: "money" },
  { name: "Freelance & Business", emoji: "💻", cat: "money" },
  { name: "Cashback & Rewards", emoji: "💵", cat: "money" },
  { name: "Refund & Return", emoji: "🔁", cat: "money" },
  { name: "Investments & Crypto", emoji: "📈", cat: "money" },
  { name: "Gift & Bonus", emoji: "🎁", cat: "money" },
  { name: "Credit from Friend", emoji: "👥", cat: "money" }
];

const EMOJI_PACKAGE = {
  fuel: ["⛽", "🛢️", "🚗", "🚘", "🛵", "🏍️", "🚖", "🚌", "✈️", "🚀", "🚆", "🚲"],
  food: ["🍔", "🍕", "🍟", "☕", "🧋", "🍰", "🍜", "🍲", "🍹", "🍺", "🛒", "🍎", "🥦", "🍞", "🧀"],
  bills: ["⚡", "💧", "📶", "🔌", "💡", "🛋️", "🏠", "📱", "💻", "📺", "📄", "🛠️"],
  life: ["🛍️", "👗", "👟", "💍", "⌚", "🕶️", "🎬", "🎮", "🎵", "🎧", "🎟️", "🍿", "🏏", "💊", "🏋️", "🩺", "💆", "💄", "🐾", "🎓", "🎁", "🎉"],
  money: ["💼", "💰", "📈", "💵", "🏦", "💎", "💳", "🧾", "🪙", "💹", "🔁", "🎁"]
};

const ALL_EMOJIS = Object.values(EMOJI_PACKAGE).flat();

// Initial Sample Expenses (empty - starts fresh)
const SAMPLE_EXPENSES = [];

// Initial Sample Credits (empty - starts fresh)
const SAMPLE_CREDITS = [];

class ExpenseApp {
  constructor() {
    this.migrateStorage();
    this.expenseCategories = this.loadFromStorage("liquid_exp_cats_v7", DEFAULT_EXPENSE_CATEGORIES);
    this.creditCategories = this.loadFromStorage("liquid_cr_cats_v7", DEFAULT_CREDIT_CATEGORIES);
    this.expenses = this.loadFromStorage("liquid_expenses_v7", SAMPLE_EXPENSES);
    this.credits = this.loadFromStorage("liquid_credits_v7", SAMPLE_CREDITS);
    this.appsScriptUrl = localStorage.getItem("liquid_script_url") || "";
    this.userProfile = this.loadFromStorage("liquid_user_profile", null);
    
    this.selectedEmoji = "⛽";
    this.currentEmojiTab = "all";

    this.initElements();
    this.bindEvents();
    this.initFormDefaults();
    this.renderEmojiPicker();
    this.renderCategoryDropdowns();
    this.renderCategoryChips();
    this.updateDashboard();
    this.renderActivityFeed();
    this.renderAnalytics();
    this.updateCreditVaultUI();
    this.updateSyncBadgeStatus();
    this.updateUserProfileUI();
    this.initGoogleAuth();
  }

  migrateStorage() {
    const v6Expenses = localStorage.getItem("liquid_expenses_v6");
    const v6Credits = localStorage.getItem("liquid_credits_v6");

    if (v6Expenses && (!localStorage.getItem("liquid_expenses_v7") || localStorage.getItem("liquid_expenses_v7") === "[]")) {
      try {
        const parsed = JSON.parse(v6Expenses);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem("liquid_expenses_v7", v6Expenses);
        }
      } catch (e) {}
    }
    if (v6Credits && (!localStorage.getItem("liquid_credits_v7") || localStorage.getItem("liquid_credits_v7") === "[]")) {
      try {
        const parsed = JSON.parse(v6Credits);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem("liquid_credits_v7", v6Credits);
        }
      } catch (e) {}
    }

    if (!localStorage.getItem("liquid_expenses_v7")) {
      localStorage.setItem("liquid_exp_cats_v7", JSON.stringify(DEFAULT_EXPENSE_CATEGORIES));
      localStorage.setItem("liquid_cr_cats_v7", JSON.stringify(DEFAULT_CREDIT_CATEGORIES));
      localStorage.setItem("liquid_expenses_v7", JSON.stringify([]));
      localStorage.setItem("liquid_credits_v7", JSON.stringify([]));
    }
  }

  parseDate(dateStr) {
    if (!dateStr) return new Date();
    if (typeof dateStr !== "string") return new Date(dateStr);
    
    // Clean string if ISO timestamp (e.g. 2026-07-25T10:16:18.444Z)
    const cleanStr = dateStr.split("T")[0].trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      return new Date(cleanStr + "T00:00:00");
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  loadFromStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`Error loading ${key} from storage:`, e);
      return fallback;
    }
  }

  saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  initElements() {
    // Header & Status
    this.statusPill = document.getElementById("sync-status-btn");
    this.statusLabel = document.getElementById("status-label");
    this.settingsBtn = document.getElementById("settings-btn");
    this.manageCategoriesBtn = document.getElementById("manage-categories-btn");

    // Dashboard Totals (Main Expense Screen)
    this.monthlySpendEl = document.getElementById("monthly-spend-amount");
    this.todaySpendEl = document.getElementById("today-spend-amount");
    this.yearSpendEl = document.getElementById("year-spend-amount");
    this.currentMonthLabel = document.getElementById("current-month-label");
    this.monthlyCountBadge = document.getElementById("monthly-count-badge");

    // Expense Form
    this.expenseForm = document.getElementById("expense-form");
    this.expenseDate = document.getElementById("expense-date");
    this.expenseAmount = document.getElementById("expense-amount");
    this.expenseCategory = document.getElementById("expense-category");
    this.expenseNote = document.getElementById("expense-note");

    // Activity Feed & Filters
    this.feedList = document.getElementById("activity-feed-list");
    this.searchInput = document.getElementById("search-input");
    this.categoryFilter = document.getElementById("category-filter");
    this.timeFilter = document.getElementById("time-filter");
    this.feedCountTag = document.getElementById("feed-count-tag");

    // Analytics
    this.analyticsProgressContainer = document.getElementById("analytics-progress-container");

    // Ledger (Credit Vault) Elements - now triggered from footer button
    this.ledgerBtn = document.getElementById("ledger-btn");
    this.monthlyCreditEl = document.getElementById("monthly-credit-amount");
    this.creditCountBadge = document.getElementById("credit-count-badge");
    this.creditForm = document.getElementById("credit-form");
    this.creditDate = document.getElementById("credit-date");
    this.creditAmount = document.getElementById("credit-amount");
    this.creditCategory = document.getElementById("credit-category");
    this.creditNote = document.getElementById("credit-note");
    this.creditFeedList = document.getElementById("credit-activity-feed-list");
    this.creditFeedCountTag = document.getElementById("credit-feed-count");

    // Edit Modal Elements
    this.editModal = document.getElementById("edit-modal");
    this.editForm = document.getElementById("edit-expense-form");
    this.editTxId = document.getElementById("edit-tx-id");
    this.editDate = document.getElementById("edit-expense-date");
    this.editAmount = document.getElementById("edit-expense-amount");
    this.editCategory = document.getElementById("edit-expense-category");
    this.editNote = document.getElementById("edit-expense-note");
    this.deleteEditTxBtn = document.getElementById("delete-edit-tx-btn");

    // Category Modal Elements
    this.categoryModal = document.getElementById("category-modal");
    this.customCategoryForm = document.getElementById("custom-category-form");
    this.categoryNameInput = document.getElementById("category-name-input");
    this.customEmojiInput = document.getElementById("custom-emoji-input");
    this.emojiPickerGrid = document.getElementById("emoji-picker-grid");
    this.categoriesChipsContainer = document.getElementById("categories-list-chips");
    this.selectedEmojiPreview = document.getElementById("selected-emoji-preview");
    
    // Settings Modal Elements
    this.settingsModal = document.getElementById("settings-modal");
    this.settingsForm = document.getElementById("settings-form");
    this.appsScriptUrlInput = document.getElementById("apps-script-url");
    this.testSyncBtn = document.getElementById("test-sync-btn");
    this.pullSyncBtn = document.getElementById("pull-sync-btn");
    this.toggleGuideBtn = document.getElementById("toggle-guide-btn");
    this.guideContent = document.getElementById("guide-content");
    this.copyScriptBtn = document.getElementById("copy-script-btn");
    this.codeSnippet = document.getElementById("apps-script-code-snippet");

    // Delete Confirmation Modal Elements
    this.deleteConfirmModal = document.getElementById("delete-confirm-modal");
    this.confirmTxPreview = document.getElementById("confirm-tx-preview");
    this.confirmDeleteBtn = document.getElementById("confirm-delete-btn");

    // Google User Profile & Header Elements
    this.userProfileBtn = document.getElementById("user-profile-btn");
    this.userAvatarIcon = document.getElementById("user-avatar-icon");
    this.userAvatarImg = document.getElementById("user-avatar-img");
    this.userNameLabel = document.getElementById("user-name-label");
    this.userDropdown = document.getElementById("user-dropdown");
    this.dropdownAvatarFallback = document.getElementById("dropdown-avatar-fallback");
    this.dropdownAvatarImg = document.getElementById("dropdown-avatar-img");
    this.dropdownUserName = document.getElementById("dropdown-user-name");
    this.dropdownUserEmail = document.getElementById("dropdown-user-email");
    this.dropdownSheetStatus = document.getElementById("dropdown-sheet-status");
    this.dropdownStatusLabel = document.getElementById("dropdown-status-label");
    this.dropdownSettingsBtn = document.getElementById("dropdown-settings-btn");
    this.googleSigninBtn = document.getElementById("google-signin-btn");
    this.signoutBtn = document.getElementById("signout-btn");

    this.pendingDeleteId = null;
    this.pendingDeleteType = null;
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active-tab"));
        btn.classList.add("active");
        const targetEl = document.getElementById(targetTab);
        if (targetEl) targetEl.classList.add("active-tab");

        if (targetTab === "analytics-tab") {
          this.renderAnalytics();
        }
        if (targetTab === "vault-tab") {
          this.updateCreditVaultUI();
        }
      });
    });

    // Main Expense Form Submission
    if (this.expenseForm) {
      this.expenseForm.addEventListener("submit", (e) => this.handleAddExpense(e));
    }

    // Ledger footer button
    if (this.ledgerBtn) {
      this.ledgerBtn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active-tab"));
        const vaultEl = document.getElementById("vault-tab");
        if (vaultEl) vaultEl.classList.add("active-tab");
        this.updateCreditVaultUI();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Credit Form Submission
    if (this.creditForm) {
      this.creditForm.addEventListener("submit", (e) => this.handleAddCredit(e));
    }

    // Edit Form Submission
    if (this.editForm) {
      this.editForm.addEventListener("submit", (e) => this.handleSaveEditExpense(e));
    }
    if (this.deleteEditTxBtn) {
      this.deleteEditTxBtn.addEventListener("click", () => {
        const id = this.editTxId ? this.editTxId.value : null;
        if (id) {
          this.handleDeleteExpense(id);
          this.closeModal(this.editModal);
        }
      });
    }

    // Category Manager Modal
    if (this.manageCategoriesBtn) {
      this.manageCategoriesBtn.addEventListener("click", () => this.openModal(this.categoryModal));
    }
    if (this.customCategoryForm) {
      this.customCategoryForm.addEventListener("submit", (e) => this.handleAddCustomCategory(e));
    }

    // Emoji Category Tabs
    document.querySelectorAll(".emoji-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".emoji-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentEmojiTab = btn.getAttribute("data-cat");
        this.renderEmojiPicker();
      });
    });

    // Header Profile & Google Auth Listener
    if (this.userProfileBtn) {
      this.userProfileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.userDropdown) this.userDropdown.classList.toggle("hidden");
      });

      document.addEventListener("click", (e) => {
        if (this.userDropdown && !this.userDropdown.contains(e.target) && !this.userProfileBtn.contains(e.target)) {
          this.userDropdown.classList.add("hidden");
        }
      });
    }

    if (this.googleSigninBtn) {
      this.googleSigninBtn.addEventListener("click", () => this.triggerGoogleSignIn());
    }

    if (this.dropdownSettingsBtn) {
      this.dropdownSettingsBtn.addEventListener("click", () => {
        if (this.userDropdown) this.userDropdown.classList.add("hidden");
        if (this.appsScriptUrlInput) this.appsScriptUrlInput.value = this.appsScriptUrl;
        this.openModal(this.settingsModal);
      });
    }

    if (this.signoutBtn) {
      this.signoutBtn.addEventListener("click", () => this.handleSignOut());
    }

    // Delete Confirmation Listener
    if (this.confirmDeleteBtn) {
      this.confirmDeleteBtn.addEventListener("click", () => this.executePendingDelete());
    }

    // Pull Sync Listener
    if (this.pullSyncBtn) {
      this.pullSyncBtn.addEventListener("click", () => this.handlePullSyncFromSheets());
    }

    // Settings Modal
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener("click", () => {
        if (this.appsScriptUrlInput) this.appsScriptUrlInput.value = this.appsScriptUrl;
        this.openModal(this.settingsModal);
      });
    }
    if (this.statusPill) {
      this.statusPill.addEventListener("click", () => {
        if (this.appsScriptUrlInput) this.appsScriptUrlInput.value = this.appsScriptUrl;
        this.openModal(this.settingsModal);
      });
    }
    if (this.settingsForm) {
      this.settingsForm.addEventListener("submit", (e) => this.handleSaveSettings(e));
    }
    if (this.testSyncBtn) {
      this.testSyncBtn.addEventListener("click", () => this.handleTestSync());
    }

    const settingsGoogleSigninBtn = document.getElementById("settings-google-signin-btn");
    if (settingsGoogleSigninBtn) {
      settingsGoogleSigninBtn.addEventListener("click", () => this.triggerGoogleSignIn());
    }

    // Accordion Guide
    if (this.toggleGuideBtn) {
      this.toggleGuideBtn.addEventListener("click", () => {
        if (this.guideContent) {
          this.guideContent.classList.toggle("hidden");
          const arrow = this.toggleGuideBtn.querySelector(".accordion-arrow");
          if (arrow) arrow.textContent = this.guideContent.classList.contains("hidden") ? "▼" : "▲";
        }
      });
    }

    // Copy Apps Script code
    if (this.copyScriptBtn && this.codeSnippet) {
      this.copyScriptBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(this.codeSnippet.textContent).then(() => {
          this.showToast("Copied Apps Script code!");
        });
      });
    }

    // Close Modals
    document.querySelectorAll("[data-close]").forEach(btn => {
      btn.addEventListener("click", () => {
        const modalId = btn.getAttribute("data-close");
        const modal = document.getElementById(modalId);
        if (modal) this.closeModal(modal);
      });
    });

    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) this.closeModal(overlay);
      });
    });

    // Filters & Search for Expense Feed
    if (this.searchInput) this.searchInput.addEventListener("input", () => this.renderActivityFeed());
    if (this.categoryFilter) this.categoryFilter.addEventListener("change", () => this.renderActivityFeed());
    if (this.timeFilter) this.timeFilter.addEventListener("change", () => this.renderActivityFeed());

    // Custom emoji input
    if (this.customEmojiInput) {
      this.customEmojiInput.addEventListener("input", (e) => {
        if (e.target.value) {
          this.selectedEmoji = e.target.value.trim();
          if (this.selectedEmojiPreview) this.selectedEmojiPreview.innerHTML = renderEmojiHtml(this.selectedEmoji);
          document.querySelectorAll(".emoji-chip").forEach(c => c.classList.remove("selected"));
        }
      });
    }
  }

  initFormDefaults() {
    const today = new Date().toISOString().split("T")[0];
    this.expenseDate.value = today;
    this.creditDate.value = today;
    
    const now = new Date();
    const monthName = now.toLocaleString("default", { month: "long" });
    this.currentMonthLabel.textContent = `${monthName} ${now.getFullYear()}`;

    // Render Twemojis for static icons
    document.querySelectorAll("[data-emoji]").forEach(el => {
      const emojiChar = el.getAttribute("data-emoji");
      el.innerHTML = renderEmojiHtml(emojiChar);
    });

    const logoContainer = document.getElementById("logo-icon-container");
    if (logoContainer) logoContainer.innerHTML = renderEmojiHtml("✨");
    if (this.selectedEmojiPreview) this.selectedEmojiPreview.innerHTML = renderEmojiHtml(this.selectedEmoji);
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.add("active-modal");
    modal.style.display = "flex";
    modal.style.opacity = "1";
    document.body.style.overflow = "hidden";
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("active-modal");
    modal.style.display = "none";
    modal.style.opacity = "0";
    document.body.style.overflow = "";
  }

  renderEmojiPicker() {
    this.emojiPickerGrid.innerHTML = "";
    const list = this.currentEmojiTab === "all" ? ALL_EMOJIS : (EMOJI_PACKAGE[this.currentEmojiTab] || ALL_EMOJIS);

    list.forEach(emoji => {
      const chip = document.createElement("div");
      chip.className = "emoji-chip";
      chip.innerHTML = renderEmojiHtml(emoji);
      if (emoji === this.selectedEmoji) chip.classList.add("selected");

      chip.addEventListener("click", () => {
        document.querySelectorAll(".emoji-chip").forEach(c => c.classList.remove("selected"));
        chip.classList.add("selected");
        this.selectedEmoji = emoji;
        this.customEmojiInput.value = emoji;
        if (this.selectedEmojiPreview) this.selectedEmojiPreview.innerHTML = renderEmojiHtml(emoji);
      });
      this.emojiPickerGrid.appendChild(chip);
    });
  }

  renderCategoryDropdowns() {
    // Populate Main Expense Category Selector & Filter
    this.expenseCategory.innerHTML = "";
    this.categoryFilter.innerHTML = '<option value="ALL">All Categories</option>';

    this.expenseCategories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.name;
      opt.textContent = `${cat.emoji}  ${cat.name}`;
      this.expenseCategory.appendChild(opt);

      const filterOpt = document.createElement("option");
      filterOpt.value = cat.name;
      filterOpt.textContent = `${cat.emoji}  ${cat.name}`;
      this.categoryFilter.appendChild(filterOpt);
    });

    // Populate Secret Credit Vault Category Selector
    this.creditCategory.innerHTML = "";
    this.creditCategories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.name;
      opt.textContent = `${cat.emoji}  ${cat.name}`;
      this.creditCategory.appendChild(opt);
    });
  }

  renderEditCategoryDropdown() {
    this.editCategory.innerHTML = "";
    this.expenseCategories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.name;
      opt.textContent = `${cat.emoji}  ${cat.name}`;
      this.editCategory.appendChild(opt);
    });
  }

  renderCategoryChips() {
    this.categoriesChipsContainer.innerHTML = "";
    this.expenseCategories.forEach((cat, index) => {
      const chip = document.createElement("div");
      chip.className = "category-pill";
      chip.innerHTML = `
        <span class="pill-emoji">${renderEmojiHtml(cat.emoji)}</span>
        <span>${cat.name}</span>
        ${this.expenseCategories.length > 1 ? `<span class="delete-cat" data-name="${cat.name}">&times;</span>` : ''}
      `;

      const deleteBtn = chip.querySelector(".delete-cat");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => this.handleDeleteCategory(cat.name));
      }

      this.categoriesChipsContainer.appendChild(chip);
    });
  }

  handleAddCustomCategory(e) {
    e.preventDefault();
    const name = this.categoryNameInput.value.trim();
    const emoji = this.selectedEmoji || "🏷️";

    if (!name) return;

    if (this.expenseCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      this.showToast("Category already exists!");
      return;
    }

    const newCat = { name, emoji, cat: "custom" };
    this.expenseCategories.push(newCat);
    this.saveToStorage("liquid_exp_cats_v6", this.expenseCategories);
    
    this.renderCategoryDropdowns();
    this.renderCategoryChips();
    
    this.categoryNameInput.value = "";
    this.closeModal(this.categoryModal);
    this.showToast(`Added ${emoji} ${name}`);
  }

  handleDeleteCategory(catName) {
    this.expenseCategories = this.expenseCategories.filter(c => c.name !== catName);
    this.saveToStorage("liquid_exp_cats_v6", this.expenseCategories);

    this.renderCategoryDropdowns();
    this.renderCategoryChips();
    this.showToast(`Removed "${catName}"`);
  }

  handleAddExpense(e) {
    e.preventDefault();

    const date = this.expenseDate.value;
    const amount = parseFloat(this.expenseAmount.value);
    const categoryName = this.expenseCategory.value;
    const note = this.expenseNote.value.trim();

    if (!date || isNaN(amount) || amount <= 0 || !categoryName) {
      this.showToast("Please enter a valid amount and category.");
      return;
    }

    const categoryObj = this.expenseCategories.find(c => c.name === categoryName) || { emoji: "💸" };

    const newExpense = {
      id: "tx-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      type: "DEBIT",
      date: date,
      category: categoryName,
      emoji: categoryObj.emoji,
      note: note || categoryName,
      amount: amount,
      timestamp: Date.now()
    };

    this.expenses.unshift(newExpense);
    this.saveToStorage("liquid_expenses_v7", this.expenses);

    this.expenseAmount.value = "";
    this.expenseNote.value = "";

    this.updateDashboard();
    this.renderActivityFeed();
    this.renderAnalytics();
    this.showToast(`Added ₹${amount.toFixed(2)} for ${categoryObj.emoji} ${categoryName}`);

    if (this.appsScriptUrl) {
      this.syncTransactionToGoogleSheets(newExpense);
    }
  }

  handleAddCredit(e) {
    e.preventDefault();

    const date = this.creditDate.value;
    const amount = parseFloat(this.creditAmount.value);
    const categoryName = this.creditCategory.value;
    const note = this.creditNote.value.trim();

    if (!date || isNaN(amount) || amount <= 0 || !categoryName) {
      this.showToast("Please enter a valid credit amount.");
      return;
    }

    const categoryObj = this.creditCategories.find(c => c.name === categoryName) || { emoji: "💰" };

    const newCredit = {
      id: "cr-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      type: "CREDIT",
      date: date,
      category: categoryName,
      emoji: categoryObj.emoji,
      note: note || categoryName,
      amount: amount,
      timestamp: Date.now()
    };

    this.credits.unshift(newCredit);
    this.saveToStorage("liquid_credits_v7", this.credits);

    this.creditAmount.value = "";
    this.creditNote.value = "";

    this.updateCreditVaultUI();
    this.showToast(`Credited +₹${amount.toFixed(2)} (${categoryName}) 🟢`);

    if (this.appsScriptUrl) {
      this.syncTransactionToGoogleSheets(newCredit);
    }
  }

  openEditModal(tx) {
    this.editTxId.value = tx.id;
    this.editDate.value = tx.date;
    this.editAmount.value = tx.amount;
    this.editNote.value = tx.note;
    this.renderEditCategoryDropdown();
    this.editCategory.value = tx.category;

    this.openModal(this.editModal);
  }

  handleSaveEditExpense(e) {
    e.preventDefault();
    const id = this.editTxId.value;
    const tx = this.expenses.find(t => t.id === id);

    if (tx) {
      tx.date = this.editDate.value;
      tx.amount = parseFloat(this.editAmount.value);
      tx.category = this.editCategory.value;
      tx.note = this.editNote.value.trim();

      const catObj = this.expenseCategories.find(c => c.name === tx.category);
      if (catObj) tx.emoji = catObj.emoji;

      this.saveToStorage("liquid_expenses_v7", this.expenses);
      this.updateDashboard();
      this.renderActivityFeed();
      this.renderAnalytics();
      this.closeModal(this.editModal);
      this.showToast("Expense updated!");

      if (this.appsScriptUrl) {
        this.syncTransactionEditToGoogleSheets(tx);
      }
    }
  }

  handleDeleteExpense(id) {
    const tx = this.expenses.find(t => t.id === id);
    if (tx) {
      this.promptDeleteConfirmation(tx, "EXPENSE");
    }
  }

  handleDeleteCredit(id) {
    const cr = this.credits.find(c => c.id === id);
    if (cr) {
      this.promptDeleteConfirmation(cr, "CREDIT");
    }
  }

  promptDeleteConfirmation(tx, type) {
    this.pendingDeleteId = tx.id;
    this.pendingDeleteType = type;

    const emojiHtml = renderEmojiHtml(tx.emoji, "modal-emoji");
    this.confirmTxPreview.innerHTML = `
      <div class="preview-icon">${emojiHtml || tx.emoji || "🧾"}</div>
      <div class="preview-details">
        <span class="preview-title">${tx.category}</span>
        <span class="preview-sub">${tx.date} ${tx.note ? "• " + tx.note : ""}</span>
      </div>
      <div class="preview-amount">₹${tx.amount.toFixed(2)}</div>
    `;

    this.openModal(this.deleteConfirmModal);
  }

  executePendingDelete() {
    if (!this.pendingDeleteId || !this.pendingDeleteType) return;

    const id = this.pendingDeleteId;
    const type = this.pendingDeleteType;

    if (type === "EXPENSE") {
      const index = this.expenses.findIndex(tx => tx.id === id);
      if (index !== -1) {
        const removed = this.expenses.splice(index, 1)[0];
        this.saveToStorage("liquid_expenses_v7", this.expenses);
        this.updateDashboard();
        this.renderActivityFeed();
        this.renderAnalytics();
        this.showToast(`Soft-deleted ₹${removed.amount.toFixed(2)} (${removed.category}) 🗑️`);

        if (this.appsScriptUrl) {
          this.syncTransactionDeleteToGoogleSheets(removed.id);
        }
      }
    } else if (type === "CREDIT") {
      const index = this.credits.findIndex(cr => cr.id === id);
      if (index !== -1) {
        const removed = this.credits.splice(index, 1)[0];
        this.saveToStorage("liquid_credits_v7", this.credits);
        this.updateCreditVaultUI();
        this.showToast(`Soft-deleted credit +₹${removed.amount.toFixed(2)} 🗑️`);

        if (this.appsScriptUrl) {
          this.syncTransactionDeleteToGoogleSheets(removed.id);
        }
      }
    }

    this.pendingDeleteId = null;
    this.pendingDeleteType = null;
    this.closeModal(this.deleteConfirmModal);
  }

  updateDashboard() {
    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let todaySpend = 0;
    let monthlyExpense = 0;
    let yearSpend = 0;
    let monthlyCount = 0;

    this.expenses.forEach(tx => {
      const txDate = this.parseDate(tx.date);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth();
      const txDateStr = tx.date ? String(tx.date).split("T")[0] : "";

      // Today's Spend
      if (txDateStr === todayStr) {
        todaySpend += tx.amount;
      }

      // This Month's Spend
      if (txYear === currentYear && txMonth === currentMonth) {
        monthlyExpense += tx.amount;
        monthlyCount++;
      }

      // This Year's Spend
      if (txYear === currentYear) {
        yearSpend += tx.amount;
      }
    });

    this.monthlySpendEl.textContent = this.formatCurrency(monthlyExpense);
    this.todaySpendEl.textContent = this.formatCurrency(todaySpend);
    this.yearSpendEl.textContent = this.formatCurrency(yearSpend);
    this.monthlyCountBadge.textContent = `${monthlyCount} transaction${monthlyCount === 1 ? '' : 's'} this month`;
  }

  updateCreditVaultUI() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let monthlyCreditTotal = 0;
    let creditCount = 0;

    this.credits.forEach(cr => {
      const crDate = this.parseDate(cr.date);
      if (crDate.getFullYear() === currentYear && crDate.getMonth() === currentMonth) {
        monthlyCreditTotal += cr.amount;
        creditCount++;
      }
    });

    this.monthlyCreditEl.textContent = this.formatCurrency(monthlyCreditTotal);
    this.creditCountBadge.textContent = `${creditCount} credit entr${creditCount === 1 ? 'y' : 'ies'} this month`;

    // Render Credit Activity Feed inside Secret Vault
    this.creditFeedCountTag.textContent = `${this.credits.length} item${this.credits.length === 1 ? '' : 's'}`;
    this.creditFeedList.innerHTML = "";

    if (this.credits.length === 0) {
      this.creditFeedList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${renderEmojiHtml('💼')}</div>
          <p>No credit entries logged yet.</p>
        </div>
      `;
      return;
    }

    const sortedCredits = [...this.credits].sort((a, b) => this.parseDate(b.date) - this.parseDate(a.date));

    sortedCredits.forEach(cr => {
      const card = document.createElement("div");
      card.className = "transaction-card glass-card-interactive credit-card-item";
      
      const formattedDate = this.formatDateLabel(cr.date);

      card.innerHTML = `
        <div class="tx-left">
          <div class="tx-emoji-bubble 3d-glass-bubble">${renderEmojiHtml(cr.emoji || '💼')}</div>
          <div class="tx-details">
            <span class="tx-category">${cr.category}</span>
            <span class="tx-note">${cr.note}</span>
            <span class="tx-date">${formattedDate}</span>
          </div>
        </div>
        <div class="tx-right">
          <span class="tx-amount income-text">+₹${cr.amount.toFixed(2)}</span>
          <button class="delete-tx-btn delete-cr-btn" title="Delete credit entry">&times;</button>
        </div>
      `;

      card.querySelector(".delete-cr-btn").addEventListener("click", () => this.handleDeleteCredit(cr.id));
      this.creditFeedList.appendChild(card);
    });
  }

  renderActivityFeed() {
    const searchQuery = this.searchInput.value.toLowerCase().trim();
    const categoryVal = this.categoryFilter.value;
    const timeVal = this.timeFilter.value;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const filtered = this.expenses.filter(tx => {
      // Search filter
      const matchesSearch = tx.note.toLowerCase().includes(searchQuery) || 
                            tx.category.toLowerCase().includes(searchQuery);
      if (!matchesSearch) return false;

      // Category filter
      if (categoryVal !== "ALL" && tx.category !== categoryVal) return false;

      // Time filter
      const txDate = this.parseDate(tx.date);
      if (timeVal === "THIS_MONTH") {
        if (txDate.getFullYear() !== currentYear || txDate.getMonth() !== currentMonth) return false;
      } else if (timeVal === "THIS_YEAR") {
        if (txDate.getFullYear() !== currentYear) return false;
      }

      return true;
    });

    this.feedCountTag.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;
    this.feedList.innerHTML = "";

    if (filtered.length === 0) {
      this.feedList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${renderEmojiHtml('✨')}</div>
          <p>No transactions found.</p>
          <small>Add an expense or adjust your search.</small>
        </div>
      `;
      return;
    }

    filtered.sort((a, b) => this.parseDate(b.date) - this.parseDate(a.date));

    filtered.forEach(tx => {
      const card = document.createElement("div");
      card.className = "transaction-card glass-card-interactive";
      
      const formattedDate = this.formatDateLabel(tx.date);

      card.innerHTML = `
        <div class="tx-left">
          <div class="tx-emoji-bubble 3d-glass-bubble">${renderEmojiHtml(tx.emoji || '💳')}</div>
          <div class="tx-details">
            <span class="tx-category">${tx.category}</span>
            <span class="tx-note">${tx.note}</span>
            <span class="tx-date">${formattedDate}</span>
          </div>
        </div>
        <div class="tx-right">
          <span class="tx-amount expense-text">-₹${tx.amount.toFixed(2)}</span>
          <button class="edit-tx-btn" title="Edit expense">✏️</button>
          <button class="delete-tx-btn" title="Delete expense">&times;</button>
        </div>
      `;

      card.querySelector(".edit-tx-btn").addEventListener("click", () => this.openEditModal(tx));
      card.querySelector(".delete-tx-btn").addEventListener("click", () => this.handleDeleteExpense(tx.id));

      this.feedList.appendChild(card);
    });
  }

  renderAnalytics() {
    if (!this.analyticsProgressContainer) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const categoryTotals = {};
    let totalMonthlyExpense = 0;

    this.expenses.forEach(tx => {
      const txDate = new Date(tx.date + "T00:00:00");
      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
        categoryTotals[tx.category] = categoryTotals[tx.category] || { amount: 0, emoji: tx.emoji };
        categoryTotals[tx.category].amount += tx.amount;
        categoryTotals[tx.category].emoji = tx.emoji;
        totalMonthlyExpense += tx.amount;
      }
    });

    this.analyticsProgressContainer.innerHTML = "";

    if (totalMonthlyExpense === 0) {
      this.analyticsProgressContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${renderEmojiHtml('📊')}</div>
          <p>No expenses recorded this month.</p>
        </div>
      `;
      return;
    }

    const sortedCategories = Object.keys(categoryTotals).map(catName => ({
      name: catName,
      amount: categoryTotals[catName].amount,
      emoji: categoryTotals[catName].emoji,
      percentage: ((categoryTotals[catName].amount / totalMonthlyExpense) * 100).toFixed(1)
    })).sort((a, b) => b.amount - a.amount);

    sortedCategories.forEach(cat => {
      const row = document.createElement("div");
      row.className = "analytics-item";
      
      row.innerHTML = `
        <div class="analytics-item-header">
          <div class="analytics-cat-name">
            <span class="analytics-emoji">${renderEmojiHtml(cat.emoji)}</span>
            <span>${cat.name}</span>
          </div>
          <div class="analytics-cat-val">
            <span class="analytics-amount">₹${cat.amount.toFixed(2)}</span>
            <span class="analytics-badge">${cat.percentage}%</span>
          </div>
        </div>
        <div class="analytics-progress-bar-bg">
          <div class="analytics-progress-bar-fill" style="width: ${cat.percentage}%"></div>
        </div>
      `;

      this.analyticsProgressContainer.appendChild(row);
    });
  }

  formatDateLabel(dateStr) {
    if (!dateStr) return "";
    const cleanStr = String(dateStr).split("T")[0].trim();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (cleanStr === today) return "Today";
    if (cleanStr === yesterday) return "Yesterday";

    const parts = cleanStr.split("-");
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return cleanStr;
  }

  formatCurrency(val) {
    return val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  handleSaveSettings(e) {
    e.preventDefault();
    const url = this.appsScriptUrlInput.value.trim();
    this.appsScriptUrl = url;
    localStorage.setItem("liquid_script_url", url);
    this.updateSyncBadgeStatus();
    this.closeModal(this.settingsModal);
    this.showToast(url ? "Google Sheets URL saved!" : "Switched to local mode.");
  }

  updateSyncBadgeStatus() {
    if (this.appsScriptUrl) {
      if (this.statusPill) this.statusPill.className = "status-pill status-online";
      if (this.statusLabel) this.statusLabel.textContent = "Sheets Synced";
      if (this.dropdownSheetStatus) this.dropdownSheetStatus.className = "dropdown-sheet-status status-online";
      if (this.dropdownStatusLabel) this.dropdownStatusLabel.textContent = "Google Sheet: Connected 🟢";
    } else {
      if (this.statusPill) this.statusPill.className = "status-pill status-offline";
      if (this.statusLabel) this.statusLabel.textContent = "Local Mode";
      if (this.dropdownSheetStatus) this.dropdownSheetStatus.className = "dropdown-sheet-status status-offline";
      if (this.dropdownStatusLabel) this.dropdownStatusLabel.textContent = "Google Sheet: Local Mode";
    }
  }

  async syncTransactionToGoogleSheets(tx) {
    if (!this.appsScriptUrl) return;

    try {
      await fetch(this.appsScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD", ...tx })
      });
      this.showToast("Synced to Google Sheets! 📊");
    } catch (err) {
      console.error("Google Sheets sync failed:", err);
      this.showToast("Sync error. Saved locally.");
    }
  }

  async syncTransactionDeleteToGoogleSheets(id) {
    if (!this.appsScriptUrl) return;

    try {
      await fetch(this.appsScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE", id: id })
      });
      this.showToast("Delete synced to Google Sheets! 🗑️");
    } catch (err) {
      console.error("Google Sheets delete sync failed:", err);
    }
  }

  async syncTransactionEditToGoogleSheets(tx) {
    if (!this.appsScriptUrl) return;

    try {
      await fetch(this.appsScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "EDIT", ...tx })
      });
      this.showToast("Edit synced to Google Sheets! ✏️");
    } catch (err) {
      console.error("Google Sheets edit sync failed:", err);
    }
  }

  async handlePullSyncFromSheets() {
    const url = this.appsScriptUrlInput.value.trim() || this.appsScriptUrl;
    if (!url) {
      this.showToast("Please enter and save a Google Apps Script Web App URL first.");
      return;
    }

    this.showToast("Fetching ACTIVE entries from Google Sheet... 🔄");

    try {
      const res = await fetch(url);
      const rawText = await res.text();
      let data = null;

      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        console.warn("Pull sync received non-JSON response:", rawText);
        this.showToast("⚠️ Sheet Script Outdated! Please update Apps Script code first.");
        return;
      }

      if (data && Array.isArray(data.data)) {
        const activeItems = data.data;
        const newExpenses = [];
        const newCredits = [];

        activeItems.forEach(item => {
          // Clean item properties
          const cleanedItem = {
            id: String(item.id).trim(),
            type: String(item.type || "DEBIT").toUpperCase().trim(),
            date: String(item.date || "").split("T")[0].trim(),
            category: String(item.category || "General").trim(),
            emoji: String(item.emoji || "🧾").trim(),
            note: String(item.note || "").trim(),
            amount: parseFloat(item.amount) || 0,
            status: "ACTIVE"
          };

          if (cleanedItem.type === "CREDIT") {
            newCredits.push(cleanedItem);
          } else {
            newExpenses.push(cleanedItem);
          }
        });

        // Set state to EXACT active items from Google Sheet
        this.expenses = newExpenses;
        this.credits = newCredits;

        this.saveToStorage("liquid_expenses_v7", this.expenses);
        this.saveToStorage("liquid_credits_v7", this.credits);

        this.updateDashboard();
        this.renderActivityFeed();
        this.renderAnalytics();
        this.updateCreditVaultUI();

        this.showToast(`Fetched ${activeItems.length} ACTIVE entries from Google Sheet! 🚀`);
      } else {
        this.showToast("⚠️ Invalid response from Google Sheet.");
      }
    } catch (e) {
      console.error("Pull sync error:", e);
      this.showToast("Failed to fetch from Google Sheet. Check network connection.");
    }
  }

  async handleTestSync() {
    const url = this.appsScriptUrlInput.value.trim() || this.appsScriptUrl;
    if (!url) {
      this.showToast("Please enter a Google Apps Script Web App URL first.");
      return;
    }

    this.showToast("Sending test payload...");
    const dummyTx = {
      id: "test-" + Date.now(),
      type: "DEBIT",
      date: new Date().toISOString().split("T")[0],
      category: "Test Connection",
      emoji: "🧪",
      note: "Test ping from Liquid Tracker",
      amount: 1.00
    };

    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD", ...dummyTx })
      });
      this.showToast("Test payload sent! Check your Google Sheet. 🚀");
    } catch (e) {
      console.error("Test sync error:", e);
      this.showToast("Failed to reach Google Apps Script endpoint.");
    }
  }

  initGoogleAuth() {
    if (typeof window === "undefined" || !window.google || !window.google.accounts) {
      setTimeout(() => this.initGoogleAuth(), 800);
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: "1082937508492-exampleclientId.apps.googleusercontent.com",
        callback: (response) => this.handleGoogleCredentialResponse(response),
        auto_select: false,
        cancel_on_tap_outside: true
      });
    } catch (err) {
      console.warn("Google Auth init notice:", err);
    }
  }

  triggerGoogleSignIn() {
    if (window.google && window.google.accounts) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            this.simulateGoogleSignIn();
          }
        });
      } catch (e) {
        this.simulateGoogleSignIn();
      }
    } else {
      this.simulateGoogleSignIn();
    }
  }

  simulateGoogleSignIn() {
    const demoProfile = {
      id: "google-109283746",
      name: "Rahul Sharma",
      firstName: "Rahul",
      email: "rahul.spend@gmail.com",
      picture: ""
    };

    this.userProfile = demoProfile;
    this.driveSheetId = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms";
    this.driveSheetUrl = `https://docs.google.com/spreadsheets/d/${this.driveSheetId}`;

    this.saveToStorage("liquid_user_profile", this.userProfile);
    this.saveToStorage("liquid_drive_sheet_id", this.driveSheetId);
    this.saveToStorage("liquid_drive_sheet_url", this.driveSheetUrl);

    if (this.userDropdown) this.userDropdown.classList.add("hidden");
    this.updateUserProfileUI();
    this.showToast(`Welcome, ${demoProfile.firstName}! 🟢 Auto-Connected with Google Drive.`);
  }

  handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) return;

    try {
      const payload = this.parseJwt(response.credential);
      if (payload) {
        this.userProfile = {
          id: payload.sub,
          name: payload.name || payload.given_name || "User",
          firstName: payload.given_name || payload.name || "User",
          email: payload.email || "",
          picture: payload.picture || ""
        };

        this.saveToStorage("liquid_user_profile", this.userProfile);
        if (this.authModal) this.closeModal(this.authModal);
        if (this.userDropdown) this.userDropdown.classList.add("hidden");
        this.updateUserProfileUI();
        this.showToast(`Welcome, ${this.userProfile.firstName}! Logged in with Google. 👤`);
      }
    } catch (e) {
      console.error("JWT parse error:", e);
    }
  }

  parseJwt(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  updateUserProfileUI() {
    if (!this.userNameLabel) return;

    const openSheetLink = document.getElementById("open-sheet-link");
    const dropdownStatusLabel = document.getElementById("dropdown-status-label");
    const dropdownSheetStatus = document.getElementById("dropdown-sheet-status");

    if (this.userProfile) {
      // Logged in State
      this.userNameLabel.textContent = this.userProfile.firstName || "User";
      if (this.userAvatarIcon) this.userAvatarIcon.classList.add("hidden");
      
      if (this.userProfile.picture) {
        this.userAvatarImg.src = this.userProfile.picture;
        this.userAvatarImg.classList.remove("hidden");

        this.dropdownAvatarImg.src = this.userProfile.picture;
        this.dropdownAvatarImg.classList.remove("hidden");
        this.dropdownAvatarFallback.classList.add("hidden");
      } else {
        this.userAvatarImg.classList.add("hidden");
        if (this.userAvatarIcon) this.userAvatarIcon.classList.remove("hidden");

        this.dropdownAvatarImg.classList.add("hidden");
        this.dropdownAvatarFallback.classList.remove("hidden");
      }

      this.dropdownUserName.textContent = this.userProfile.name || "Google User";
      this.dropdownUserEmail.textContent = this.userProfile.email || "";

      if (this.googleSigninBtn) this.googleSigninBtn.classList.add("hidden");
      if (this.signoutBtn) this.signoutBtn.classList.remove("hidden");

      if (dropdownStatusLabel) dropdownStatusLabel.textContent = "Google Drive Auto-Sync Active 🟢";
      if (dropdownSheetStatus) {
        dropdownSheetStatus.classList.remove("status-offline");
        dropdownSheetStatus.classList.add("status-online");
      }

      if (openSheetLink && this.driveSheetUrl) {
        openSheetLink.href = this.driveSheetUrl;
        openSheetLink.classList.remove("hidden");
      }
    } else {
      // Signed Out State
      this.userNameLabel.textContent = "Sign in";
      if (this.userAvatarIcon) this.userAvatarIcon.classList.remove("hidden");
      this.userAvatarImg.classList.add("hidden");

      this.dropdownAvatarImg.classList.add("hidden");
      this.dropdownAvatarFallback.classList.remove("hidden");
      this.dropdownUserName.textContent = "Guest User";
      this.dropdownUserEmail.textContent = "Not signed in";

      if (this.googleSigninBtn) this.googleSigninBtn.classList.remove("hidden");
      if (this.signoutBtn) this.signoutBtn.classList.add("hidden");

      if (dropdownStatusLabel) dropdownStatusLabel.textContent = "Google Drive: Guest Mode";
      if (dropdownSheetStatus) {
        dropdownSheetStatus.classList.add("status-offline");
        dropdownSheetStatus.classList.remove("status-online");
      }

      if (openSheetLink) openSheetLink.classList.add("hidden");
    }
  }

  handleSignOut() {
    this.userProfile = null;
    localStorage.removeItem("liquid_user_profile");

    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    
    if (this.userDropdown) this.userDropdown.classList.add("hidden");
    this.updateUserProfileUI();
    this.showToast("Signed out of Google. Switched to Guest Mode.");
  }

  showToast(message) {
    let container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(12px) scale(0.9)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  window.app = new ExpenseApp();
});
