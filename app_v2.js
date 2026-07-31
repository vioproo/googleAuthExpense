// Default Categories System
const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Fuel & Petrol", emoji: "⛽" },
  { name: "Food & Dining", emoji: "🍔" },
  { name: "Groceries & Supermarket", emoji: "🛒" },
  { name: "Car & Bike Service", emoji: "🚗" },
  { name: "Medical & Pharmacy", emoji: "💊" },
  { name: "Shopping & Clothes", emoji: "🛍️" },
  { name: "Utility Bills & Fastag", emoji: "⚡" },
  { name: "Entertainment & OTT", emoji: "🎬" },
  { name: "General Expense", emoji: "🧾" }
];

const DEFAULT_CREDIT_CATEGORIES = [
  { name: "Salary & Wages", emoji: "💵" },
  { name: "Business Profit", emoji: "📈" },
  { name: "UPI Credit / Refund", emoji: "📲" },
  { name: "Investment Return", emoji: "🏦" },
  { name: "Gift & Bonus", emoji: "🎁" },
  { name: "Other Credit", emoji: "💰" }
];

// Rich Emoji Catalog for Category Creation
const EMOJI_CATEGORIES = {
  transport: ["⛽", "🚗", "🛺", "🚕", "🚌", "🚆", "✈️", "🛵", "🚲", "🅿️", "🛠️", "🔧"],
  food: ["🍔", "🍕", "☕", "🧋", "🍲", "🍇", "🍏", "🥐", "🍦", "🍫", "🍿", "🍹"],
  shopping: ["🛒", "🛍️", "👟", "👗", "👓", "📱", "💻", "⌚", "🎒", "💍", "💄", "🎁"],
  bills: ["⚡", "💧", "📶", "📡", "🏠", "💳", "🧾", "🏦", "📄", "🏷️", "⛽", "📮"],
  health: ["💊", "🩺", "🏋️", "🧘", "🍏", "🧪", "🩹", "🦷", "🚴", "🧼", "🧴", "❤️"],
  fun: ["🎬", "🎮", "🎟️", "🎨", "🎵", "📷", "⚽", "🎳", "✈️", "🏖️", "🎉", "📚"]
};

// Initial Sample Data (for fresh preview)
const SAMPLE_EXPENSES = [];

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
    this.driveSheetId = localStorage.getItem("liquid_drive_sheet_id") || "";
    this.driveSheetUrl = localStorage.getItem("liquid_drive_sheet_url") || "";
    this.accessToken = localStorage.getItem("liquid_google_access_token") || "";

    this.selectedEmoji = "⛽";
    this.currentEmojiTab = "all";

    // Trips Feature State
    this.trips = this.loadFromStorage("liquid_trips_v1", []);
    this.activeTripId = localStorage.getItem("liquid_active_trip_id") || "";
    this.selectedTripIdForModal = null;

    this.initElements();
    this.initFormDefaults();
    this.renderEmojiPicker();
    this.renderCategoryDropdowns();
    this.renderCategoryChips();
    this.renderTripDropdown();
    this.renderTripsUI();
    this.updateDashboard();
    this.renderActivityFeed();
    this.renderAnalytics();
    this.updateCreditVaultUI();
    this.updateSyncBadgeStatus();
    this.updateUserProfileUI();
    this.bindEvents();
    this.initGoogleAuth();
    window.app = this;
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
      } catch (e) { }
    }
    if (v6Credits && (!localStorage.getItem("liquid_credits_v7") || localStorage.getItem("liquid_credits_v7") === "[]")) {
      try {
        const parsed = JSON.parse(v6Credits);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem("liquid_credits_v7", v6Credits);
        }
      } catch (e) { }
    }
  }

  loadFromStorage(key, defaultVal) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      console.error(`Error loading ${key} from storage:`, e);
      return defaultVal;
    }
  }

  saveToStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  initElements() {
    // Navigation Tabs
    this.tabBtns = document.querySelectorAll(".tab-btn");
    this.tabContents = document.querySelectorAll(".tab-content");
    this.ledgerBtn = document.getElementById("ledger-btn");

    // Stat & Total Cards
    this.monthlyTotalEl = document.getElementById("monthly-spend-amount");
    this.totalExpensesCount = document.getElementById("monthly-count-badge");
    this.todaySpendEl = document.getElementById("today-spend-amount");
    this.yearSpendEl = document.getElementById("year-spend-amount");

    this.monthlyCreditEl = document.getElementById("monthly-credit-amount");
    this.creditCountBadge = document.getElementById("credit-count-badge");
    this.totalBalanceEl = document.getElementById("total-balance");

    // Forms
    this.expenseForm = document.getElementById("expense-form");
    this.expenseDate = document.getElementById("expense-date");
    this.expenseAmount = document.getElementById("expense-amount");
    this.expenseCategory = document.getElementById("expense-category");
    this.expenseNote = document.getElementById("expense-note");

    this.creditForm = document.getElementById("credit-form");
    this.creditDate = document.getElementById("credit-date");
    this.creditAmount = document.getElementById("credit-amount");
    this.creditCategory = document.getElementById("credit-category");
    this.creditNote = document.getElementById("credit-note");

    // Feeds & Lists
    this.feedList = document.getElementById("activity-feed-list");
    this.feedCountTag = document.getElementById("feed-count-tag");
    this.searchInput = document.getElementById("search-input");
    this.categoryFilter = document.getElementById("category-filter");
    this.timeFilter = document.getElementById("time-filter");

    this.creditFeedList = document.getElementById("credit-activity-feed-list") || document.getElementById("credit-feed-list");
    this.creditFeedCountTag = document.getElementById("credit-feed-count") || document.getElementById("credit-feed-count-tag");

    // Analytics & Funnel
    // Inline Glass Dropdowns
    this.categoryPickerTrigger = document.getElementById("category-picker-trigger");
    this.tripPickerTrigger = document.getElementById("trip-picker-trigger");
    this.selectedCategoryDisplay = document.getElementById("selected-category-display");
    this.selectedTripDisplay = document.getElementById("selected-trip-display");
    this.inlineCategoryDropdown = document.getElementById("inline-category-dropdown");
    this.inlineTripDropdown = document.getElementById("inline-trip-dropdown");
    this.inlineCategoryOptionsList = document.getElementById("inline-category-options-list");
    this.inlineTripOptionsList = document.getElementById("inline-trip-options-list");
    this.analyticsTimeFilter = document.getElementById("analytics-time-filter");
    this.funnelStagesContainer = document.getElementById("funnel-stages-container");
    this.analyticsProgressContainer = document.getElementById("analytics-progress-container");

    // Modals
    this.editModal = document.getElementById("edit-modal");
    this.editForm = document.getElementById("edit-expense-form");
    this.editTxId = document.getElementById("edit-tx-id");
    this.editDate = document.getElementById("edit-expense-date");
    this.editAmount = document.getElementById("edit-expense-amount");
    this.editCategory = document.getElementById("edit-expense-category");
    this.editNote = document.getElementById("edit-expense-note");
    this.deleteEditTxBtn = document.getElementById("delete-edit-tx-btn");

    this.categoryModal = document.getElementById("category-modal");
    this.manageCategoriesBtn = document.getElementById("manage-categories-btn");
    this.customCategoryForm = document.getElementById("custom-category-form");
    this.categoryNameInput = document.getElementById("category-name-input");
    this.categoriesChipsContainer = document.getElementById("categories-list-chips");
    this.emojiPickerGrid = document.getElementById("emoji-picker-grid");
    this.customEmojiInput = document.getElementById("custom-emoji-input");
    this.selectedEmojiPreview = document.getElementById("selected-emoji-preview");

    // Settings Modal & Status Pill (optional elements)
    this.settingsModal = document.getElementById("settings-modal");
    this.settingsBtn = document.getElementById("settings-btn") || null;
    this.statusPill = document.getElementById("status-pill") || null;
    this.statusLabel = document.getElementById("status-label") || null;
    this.settingsForm = document.getElementById("settings-form");
    this.appsScriptUrlInput = document.getElementById("apps-script-url-input");
    this.testSyncBtn = document.getElementById("test-sync-btn") || null;
    this.pullSyncBtn = document.getElementById("pull-sync-btn");

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
    this.dropdownRepairBtn = document.getElementById("dropdown-repair-btn");
    this.repairSheetBtn = document.getElementById("repair-sheet-btn");
    this.googleSigninBtn = document.getElementById("google-signin-btn");
    this.signoutBtn = document.getElementById("signout-btn");

    // Trips Elements
    this.expenseTripSelect = document.getElementById("expense-trip");
    this.tripsListContainer = document.getElementById("trips-list-container");
    this.activeTripBanner = document.getElementById("active-trip-banner");
    this.activeTripTitle = document.getElementById("active-trip-title");
    this.activeTripSub = document.getElementById("active-trip-sub");
    this.activeTripTotal = document.getElementById("active-trip-total");
    this.activeTripFinishBtn = document.getElementById("active-trip-finish-btn");
    this.createTripModalBtn = document.getElementById("create-trip-modal-btn");
    this.newTripModal = document.getElementById("new-trip-modal");
    this.newTripForm = document.getElementById("new-trip-form");
    this.tripDestinationInput = document.getElementById("trip-destination");
    this.tripNameInput = document.getElementById("trip-name");
    this.tripDetailsModal = document.getElementById("trip-details-modal");
    this.tripDetailName = document.getElementById("trip-detail-name");
    this.tripDetailStatusBadge = document.getElementById("trip-detail-status-badge");
    this.tripDetailTotal = document.getElementById("trip-detail-total");
    this.tripDetailAvg = document.getElementById("trip-detail-avg");
    this.tripDetailDuration = document.getElementById("trip-detail-duration");
    this.tripDetailMeta = document.getElementById("trip-detail-meta");
    this.tripTimelineContainer = document.getElementById("trip-timeline-container");
    this.deleteTripBtn = document.getElementById("delete-trip-btn");

    this.pendingDeleteId = null;
    this.pendingDeleteType = null;
  }

  bindEvents() {
    const safeListen = (el, event, handler) => {
      if (el && typeof el.addEventListener === "function") {
        try {
          el.addEventListener(event, handler);
        } catch (e) { }
      }
    };

    try {
      // Tab switching
      Array.from(document.querySelectorAll(".tab-btn")).forEach(btn => {
        safeListen(btn, "click", () => {
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
          if (targetTab === "trips-tab") {
            this.renderTripsUI();
          }
        });
      });

      // Main Expense Form Submission
      safeListen(this.expenseForm, "submit", (e) => this.handleAddExpense(e));

      // Ledger footer button
      safeListen(this.ledgerBtn, "click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active-tab"));
        const vaultEl = document.getElementById("vault-tab");
        if (vaultEl) vaultEl.classList.add("active-tab");
        this.updateCreditVaultUI();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      // Credit Form Submission
      safeListen(this.creditForm, "submit", (e) => this.handleAddCredit(e));

      // Inline Glass Dropdown Triggers
      safeListen(this.categoryPickerTrigger, "click", (e) => {
        e.stopPropagation();
        if (this.inlineTripDropdown) this.inlineTripDropdown.classList.add("hidden");
        if (this.inlineCategoryDropdown) this.inlineCategoryDropdown.classList.toggle("hidden");
      });

      safeListen(this.tripPickerTrigger, "click", (e) => {
        e.stopPropagation();
        if (this.inlineCategoryDropdown) this.inlineCategoryDropdown.classList.add("hidden");
        if (this.inlineTripDropdown) this.inlineTripDropdown.classList.toggle("hidden");
      });

      document.addEventListener("click", (e) => {
        if (this.inlineCategoryDropdown && !this.inlineCategoryDropdown.contains(e.target) && !this.categoryPickerTrigger.contains(e.target)) {
          this.inlineCategoryDropdown.classList.add("hidden");
        }
        if (this.inlineTripDropdown && !this.inlineTripDropdown.contains(e.target) && !this.tripPickerTrigger.contains(e.target)) {
          this.inlineTripDropdown.classList.add("hidden");
        }
      });

      // Edit Form Submission
      safeListen(this.editForm, "submit", (e) => this.handleSaveEditExpense(e));
      safeListen(this.deleteEditTxBtn, "click", () => {
        const id = this.editTxId ? this.editTxId.value : null;
        if (id) {
          this.handleDeleteExpense(id);
          this.closeModal(this.editModal);
        }
      });

      // Category Manager Modal
      safeListen(this.manageCategoriesBtn, "click", () => this.openModal(this.categoryModal));
      safeListen(this.customCategoryForm, "submit", (e) => this.handleAddCustomCategory(e));

      // Trips Event Listeners
      safeListen(this.createTripModalBtn, "click", () => this.openModal(this.newTripModal));
      safeListen(this.newTripForm, "submit", (e) => this.handleCreateTrip(e));
      safeListen(this.activeTripFinishBtn, "click", () => this.finishActiveTrip());
      safeListen(this.deleteTripBtn, "click", () => this.handleDeleteTrip());

      // Repair Sheet Listeners
      safeListen(this.repairSheetBtn, "click", () => this.handleRepairSheet());
      safeListen(this.dropdownRepairBtn, "click", () => {
        if (this.userDropdown) this.userDropdown.classList.add("hidden");
        this.handleRepairSheet();
      });

      // Emoji Category Tabs
      document.querySelectorAll(".emoji-tab-btn").forEach(btn => {
        safeListen(btn, "click", () => {
          document.querySelectorAll(".emoji-tab-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          this.currentEmojiTab = btn.getAttribute("data-cat");
          this.renderEmojiPicker();
        });
      });

      // Header Profile & Google Auth Listener
      safeListen(this.userProfileBtn, "click", (e) => {
        e.stopPropagation();
        if (this.userDropdown) this.userDropdown.classList.toggle("hidden");
      });

      document.addEventListener("click", (e) => {
        if (this.userDropdown && !this.userDropdown.contains(e.target) && this.userProfileBtn && !this.userProfileBtn.contains(e.target)) {
          this.userDropdown.classList.add("hidden");
        }
      });

      safeListen(this.googleSigninBtn, "click", () => this.triggerGoogleSignIn());
      safeListen(document.getElementById("modal-google-signin-btn"), "click", () => this.triggerGoogleSignIn());

      safeListen(this.dropdownSettingsBtn, "click", () => {
        if (this.userDropdown) this.userDropdown.classList.add("hidden");
        if (this.appsScriptUrlInput) this.appsScriptUrlInput.value = this.appsScriptUrl;
        this.openModal(this.settingsModal);
      });

      safeListen(this.signoutBtn, "click", () => this.handleSignOut());

      // Delete Confirmation Listener
      safeListen(this.confirmDeleteBtn, "click", () => this.executePendingDelete());

      // Pull Sync Listener
      safeListen(this.pullSyncBtn, "click", () => this.handlePullSyncFromSheets());

      // Settings Modal
      safeListen(this.settingsBtn, "click", () => {
        if (this.appsScriptUrlInput) this.appsScriptUrlInput.value = this.appsScriptUrl;
        this.openModal(this.settingsModal);
      });
      safeListen(this.statusPill, "click", () => {
        if (this.appsScriptUrlInput) this.appsScriptUrlInput.value = this.appsScriptUrl;
        this.openModal(this.settingsModal);
      });
      safeListen(this.settingsForm, "submit", (e) => this.handleSaveSettings(e));
      safeListen(this.testSyncBtn, "click", () => this.handleTestSync());

      const googleClientIdForm = document.getElementById("google-client-id-form");
      const googleClientIdInput = document.getElementById("google-client-id-input");
      if (googleClientIdInput) {
        googleClientIdInput.value = localStorage.getItem("liquid_google_client_id") || "";
      }
      safeListen(googleClientIdForm, "submit", (e) => {
        e.preventDefault();
        const val = googleClientIdInput ? googleClientIdInput.value.trim() : "";
        localStorage.setItem("liquid_google_client_id", val);
        this.initGoogleAuth();
        this.showToast(val ? "OAuth Client ID saved! Click 'Sign in with Google' now." : "Client ID cleared.");
      });

      // Close Modals
      document.querySelectorAll("[data-close]").forEach(btn => {
        safeListen(btn, "click", () => {
          const modalId = btn.getAttribute("data-close");
          const modal = document.getElementById(modalId);
          if (modal) this.closeModal(modal);
        });
      });

      document.querySelectorAll(".modal-overlay").forEach(overlay => {
        safeListen(overlay, "click", (e) => {
          if (e.target === overlay) this.closeModal(overlay);
        });
      });

      // Filters & Search for Expense Feed & Analytics
      safeListen(this.searchInput, "input", () => this.renderActivityFeed());
      safeListen(this.categoryFilter, "change", () => this.renderActivityFeed());
      safeListen(this.timeFilter, "change", () => this.renderActivityFeed());
      safeListen(this.analyticsTimeFilter, "change", () => this.renderAnalytics());

      // Custom emoji input
      safeListen(this.customEmojiInput, "input", (e) => {
        if (e.target.value) {
          this.selectedEmoji = e.target.value.trim();
          if (this.selectedEmojiPreview) this.selectedEmojiPreview.innerHTML = renderEmojiHtml(this.selectedEmoji);
          document.querySelectorAll(".emoji-chip").forEach(c => c.classList.remove("selected"));
        }
      });
    } catch (bindErr) {
      console.warn("bindEvents safely caught notice:", bindErr);
    }
  }

  updateCreditVaultUI() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyCredits = (this.credits || []).filter(c => {
      const d = this.parseDate(c.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyTotal = monthlyCredits.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

    if (this.monthlyCreditEl) this.monthlyCreditEl.textContent = monthlyTotal.toFixed(2);
    if (this.creditCountBadge) {
      this.creditCountBadge.textContent = `${monthlyCredits.length} credit entries this month`;
    }

    const feedContainer = this.creditFeedList || document.getElementById("credit-activity-feed-list") || document.getElementById("credit-feed-list");
    const countTag = this.creditFeedCountTag || document.getElementById("credit-feed-count") || document.getElementById("credit-feed-count-tag");

    if (countTag) {
      countTag.textContent = `${(this.credits || []).length} items`;
    }

    if (!feedContainer) return;

    feedContainer.innerHTML = "";

    if (!this.credits || this.credits.length === 0) {
      feedContainer.innerHTML = `
        <div class="empty-state" style="padding: 24px; text-align: center;">
          <span style="font-size: 2rem; display: block; margin-bottom: 8px;">💰</span>
          <p style="font-size: 0.86rem; color: var(--text-secondary); margin: 0;">No credit entries recorded yet.</p>
        </div>
      `;
      return;
    }

    this.credits.forEach(cr => {
      const card = document.createElement("div");
      card.className = "tx-card credit-card";

      const amt = parseFloat(cr.amount) || 0;

      card.innerHTML = `
        <div class="tx-card-left">
          <div class="tx-emoji-bubble">${renderEmojiHtml(cr.emoji || '💰')}</div>
          <div class="tx-info">
            <div class="tx-title-row">
              <span class="tx-category">${cr.category}</span>
            </div>
            <div class="tx-sub-row">
              <span class="tx-date">${cr.date}</span>
              ${cr.note ? `<span class="tx-note">• ${cr.note}</span>` : ""}
            </div>
          </div>
        </div>
        <div class="tx-card-right">
          <span class="tx-amount tx-credit">+₹${amt.toFixed(2)}</span>
          <button type="button" class="tx-delete-btn" title="Delete Credit" data-id="${cr.id}">&times;</button>
        </div>
      `;

      const deleteBtn = card.querySelector(".tx-delete-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.handleDeleteCredit(cr.id);
        });
      }

      feedContainer.appendChild(card);
    });
  }

  initFormDefaults() {
    const today = new Date().toISOString().split("T")[0];
    if (this.expenseDate) this.expenseDate.value = today;
    if (this.creditDate) this.creditDate.value = today;
  }

  renderEmojiPicker() {
    if (!this.emojiPickerGrid) return;
    this.emojiPickerGrid.innerHTML = "";

    let emojis = [];
    if (this.currentEmojiTab === "all") {
      Object.values(EMOJI_CATEGORIES).forEach(list => emojis.push(...list));
    } else if (EMOJI_CATEGORIES[this.currentEmojiTab]) {
      emojis = EMOJI_CATEGORIES[this.currentEmojiTab];
    }

    emojis.forEach(emoji => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `emoji-chip ${emoji === this.selectedEmoji ? "selected" : ""}`;
      chip.innerHTML = renderEmojiHtml(emoji);
      chip.addEventListener("click", () => {
        this.selectedEmoji = emoji;
        if (this.customEmojiInput) this.customEmojiInput.value = emoji;
        if (this.selectedEmojiPreview) this.selectedEmojiPreview.innerHTML = renderEmojiHtml(emoji);
      });
      this.emojiPickerGrid.appendChild(chip);
    });
  }

  renderCategoryDropdowns(selectedCatName) {
    if (!this.expenseCategory) return;

    const currentVal = selectedCatName || this.expenseCategory.value || (this.expenseCategories[0] ? this.expenseCategories[0].name : "");

    this.expenseCategory.innerHTML = "";
    if (this.inlineCategoryOptionsList) this.inlineCategoryOptionsList.innerHTML = "";
    if (this.categoryFilter) this.categoryFilter.innerHTML = '<option value="ALL">All Categories</option>';

    this.expenseCategories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.name;
      opt.textContent = `${cat.emoji}  ${cat.name}`;
      if (cat.name === currentVal) opt.selected = true;
      this.expenseCategory.appendChild(opt);

      if (this.categoryFilter) {
        const filterOpt = document.createElement("option");
        filterOpt.value = cat.name;
        filterOpt.textContent = `${cat.emoji}  ${cat.name}`;
        this.categoryFilter.appendChild(filterOpt);
      }

      if (this.inlineCategoryOptionsList) {
        const isSelected = cat.name === currentVal;
        const item = document.createElement("div");
        item.className = `inline-option-item ${isSelected ? 'selected' : ''}`;
        item.innerHTML = `
          <div class="inline-option-left">
            <span>${renderEmojiHtml(cat.emoji)}</span>
            <span>${cat.name}</span>
          </div>
          ${isSelected ? '<span class="inline-option-checkmark">✓</span>' : ''}
        `;
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          this.expenseCategory.value = cat.name;
          if (this.selectedCategoryDisplay) this.selectedCategoryDisplay.textContent = `${cat.emoji}  ${cat.name}`;
          if (this.inlineCategoryDropdown) this.inlineCategoryDropdown.classList.add("hidden");
          this.renderCategoryDropdowns(cat.name);
        });
        this.inlineCategoryOptionsList.appendChild(item);
      }
    });

    this.expenseCategory.value = currentVal;
    const selectedCatObj = this.expenseCategories.find(c => c.name === currentVal) || this.expenseCategories[0];
    if (selectedCatObj && this.selectedCategoryDisplay) {
      this.selectedCategoryDisplay.textContent = `${selectedCatObj.emoji}  ${selectedCatObj.name}`;
    }

    if (this.creditCategory) {
      this.creditCategory.innerHTML = "";
      this.creditCategories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.name;
        opt.textContent = `${cat.emoji}  ${cat.name}`;
        this.creditCategory.appendChild(opt);
      });
    }
  }

  renderEditCategoryDropdown() {
    if (!this.editCategory) return;
    this.editCategory.innerHTML = "";
    this.expenseCategories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.name;
      opt.textContent = `${cat.emoji}  ${cat.name}`;
      this.editCategory.appendChild(opt);
    });
  }

  renderCategoryChips() {
    if (!this.categoriesChipsContainer) return;
    this.categoriesChipsContainer.innerHTML = "";
    this.expenseCategories.forEach((cat) => {
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

  /* ==========================================
     Trips Management & Helper Methods
     ========================================== */
  handleCreateTrip(e) {
    if (e) e.preventDefault();
    const city = this.tripDestinationInput ? this.tripDestinationInput.value.trim() : "";
    let name = this.tripNameInput ? this.tripNameInput.value.trim() : "";

    if (!city) {
      this.showToast("Please enter a destination city.");
      return;
    }

    if (!name) {
      const cityTripsCount = (this.trips || []).filter(t => t.city && t.city.toLowerCase() === city.toLowerCase()).length;
      name = `${city} Visit #${cityTripsCount + 1}`;
    }

    (this.trips || []).forEach(t => { if (t.status === "active") t.status = "completed"; });

    const newTrip = {
      id: "trip-" + Date.now(),
      name: name,
      city: city,
      status: "active",
      createdAt: Date.now()
    };

    this.trips.unshift(newTrip);
    this.activeTripId = newTrip.id;
    this.saveToStorage("liquid_trips_v1", this.trips);
    localStorage.setItem("liquid_active_trip_id", this.activeTripId);

    if (this.tripDestinationInput) this.tripDestinationInput.value = "";
    if (this.tripNameInput) this.tripNameInput.value = "";

    this.closeModal(this.newTripModal);
    this.renderTripDropdown();
    this.renderTripsUI();
    this.showToast(`Trip '${name}' created & active! ✈️`);
  }

  renderTripDropdown(selectedTripId) {
    if (!this.expenseTripSelect) return;

    const currentTripVal = (selectedTripId !== undefined) ? selectedTripId : (this.expenseTripSelect.value !== undefined ? this.expenseTripSelect.value : (this.activeTripId || ""));

    this.expenseTripSelect.innerHTML = '<option value="">None (Daily Expense)</option>';
    if (this.inlineTripOptionsList) this.inlineTripOptionsList.innerHTML = "";

    const isNoneSelected = !currentTripVal;
    if (this.selectedTripDisplay) {
      if (isNoneSelected) {
        this.selectedTripDisplay.textContent = "✈️  None (Daily Expense)";
      }
    }

    if (this.inlineTripOptionsList) {
      const noneItem = document.createElement("div");
      noneItem.className = `inline-option-item ${isNoneSelected ? 'selected' : ''}`;
      noneItem.innerHTML = `
        <div class="inline-option-left">
          <span>✈️</span>
          <span>None (Daily Expense)</span>
        </div>
        ${isNoneSelected ? '<span class="inline-option-checkmark">✓</span>' : ''}
      `;
      noneItem.addEventListener("click", (e) => {
        e.stopPropagation();
        this.expenseTripSelect.value = "";
        if (this.selectedTripDisplay) this.selectedTripDisplay.textContent = "✈️  None (Daily Expense)";
        if (this.inlineTripDropdown) this.inlineTripDropdown.classList.add("hidden");
        this.renderTripDropdown("");
      });
      this.inlineTripOptionsList.appendChild(noneItem);
    }

    if (!this.trips || this.trips.length === 0) return;

    const activeTrips = this.trips.filter(t => t.status === "active");

    const addTripOptionToPicker = (t, statusEmoji, badgeText) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `${statusEmoji} ${t.name} (${t.city})`;
      if (t.id === currentTripVal) {
        opt.selected = true;
        if (this.selectedTripDisplay) this.selectedTripDisplay.textContent = `${statusEmoji}  ${t.name}`;
      }
      this.expenseTripSelect.appendChild(opt);

      if (this.inlineTripOptionsList) {
        const isSelected = currentTripVal === t.id;
        const item = document.createElement("div");
        item.className = `inline-option-item ${isSelected ? 'selected' : ''}`;
        item.innerHTML = `
          <div class="inline-option-left">
            <span>${statusEmoji}</span>
            <div>
              <span style="font-size:0.86rem; font-weight:700;">${t.name}</span>
              <small style="color:var(--text-secondary); margin-left:4px;">(${t.city})</small>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="inline-option-badge">${badgeText}</span>
            ${isSelected ? '<span class="inline-option-checkmark">✓</span>' : ''}
          </div>
        `;
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          this.expenseTripSelect.value = t.id;
          if (this.selectedTripDisplay) this.selectedTripDisplay.textContent = `${statusEmoji}  ${t.name}`;
          if (this.inlineTripDropdown) this.inlineTripDropdown.classList.add("hidden");
          this.renderTripDropdown(t.id);
        });
        this.inlineTripOptionsList.appendChild(item);
      }
    };

    activeTrips.forEach(t => addTripOptionToPicker(t, "🟢", "ACTIVE"));
    this.expenseTripSelect.value = currentTripVal;
  }

  calculateTripMetrics(trip) {
    const txList = (this.expenses || []).filter(tx => tx.tripId === trip.id || (tx.tripName && tx.tripName === trip.name));
    const total = txList.reduce((sum, t) => sum + (t.amount || 0), 0);

    let startDate = new Date(trip.createdAt).toISOString().split("T")[0];
    let endDate = startDate;

    if (txList.length > 0) {
      const dates = txList.map(t => t.date).sort();
      startDate = dates[0];
      endDate = dates[dates.length - 1];
    }

    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const timeDiff = Math.abs(d2.getTime() - d1.getTime());
    const days = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);
    const avg = total / days;

    return { total, startDate, endDate, days, avg, txList };
  }

  checkSmartAutoEndTripOnNewExpense(selectedTripId) {
    if (!this.activeTripId) return;

    const activeTrip = (this.trips || []).find(t => t.id === this.activeTripId && t.status === "active");
    if (!activeTrip) return;

    if (selectedTripId === activeTrip.id) return;

    const metrics = this.calculateTripMetrics(activeTrip);
    const lastExpenseDate = new Date(metrics.endDate);
    const today = new Date();
    const daysDiff = Math.floor((today - lastExpenseDate) / (1000 * 3600 * 24));

    if (daysDiff >= 2 || !selectedTripId) {
      activeTrip.status = "completed";
      this.activeTripId = "";
      this.saveToStorage("liquid_trips_v1", this.trips);
      localStorage.removeItem("liquid_active_trip_id");
      this.renderTripDropdown();
      this.renderTripsUI();
      this.showToast(`Trip '${activeTrip.name}' auto-completed 🏁`);
    }
  }

  renderTripsUI() {
    if (!this.tripsListContainer) return;

    const activeTrip = (this.trips || []).find(t => t.id === this.activeTripId && t.status === "active");

    if (activeTrip && this.activeTripBanner) {
      this.activeTripBanner.classList.remove("hidden");
      const metrics = this.calculateTripMetrics(activeTrip);
      if (this.activeTripTitle) this.activeTripTitle.textContent = activeTrip.name;
      if (this.activeTripSub) this.activeTripSub.textContent = `📍 ${activeTrip.city} • Started ${metrics.startDate} • Last spent ${metrics.endDate}`;
      if (this.activeTripTotal) this.activeTripTotal.textContent = `₹${metrics.total.toFixed(2)}`;
    } else if (this.activeTripBanner) {
      this.activeTripBanner.classList.add("hidden");
    }

    this.tripsListContainer.innerHTML = "";

    if (!this.trips || this.trips.length === 0) {
      this.tripsListContainer.innerHTML = `
        <div class="glass-card" style="padding: 24px; text-align: center;">
          <span style="font-size: 2rem; display: block; margin-bottom: 8px;">✈️</span>
          <h3 style="font-size: 1rem; font-weight: 700; margin: 0; color: var(--text-primary);">No Trips Created Yet</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0 16px 0;">Track your vacation & travel expenses easily date-wise!</p>
          <button type="button" class="primary-btn mini-btn" onclick="window.app.openModal(window.app.newTripModal)">+ Create First Trip</button>
        </div>
      `;
      return;
    }

    this.trips.forEach(trip => {
      const metrics = this.calculateTripMetrics(trip);
      const card = document.createElement("div");
      card.className = "glass-card trip-card";
      const isActive = trip.status === "active";

      card.innerHTML = `
        <div class="trip-card-header">
          <div>
            <h4 class="trip-card-title">${trip.name}</h4>
            <p class="trip-card-city">📍 ${trip.city}</p>
          </div>
          <span class="trip-status-badge ${isActive ? "status-active" : "status-completed"}">
            ${isActive ? "Active 🟢" : "Completed 🏁"}
          </span>
        </div>
        <div class="trip-card-footer">
          <div style="display:flex; flex-direction:column;">
            <span style="font-size:0.7rem; color:var(--text-muted); font-weight:700;">TOTAL SPENT</span>
            <span class="trip-total-amount">₹${metrics.total.toFixed(2)}</span>
          </div>
          <span class="trip-date-range">📅 ${metrics.startDate} ➔ ${metrics.endDate}</span>
        </div>
      `;

      card.addEventListener("click", () => this.showTripDetails(trip.id));
      this.tripsListContainer.appendChild(card);
    });
  }

  showTripDetails(tripId) {
    const trip = (this.trips || []).find(t => t.id === tripId);
    if (!trip) return;

    this.selectedTripIdForModal = tripId;
    const metrics = this.calculateTripMetrics(trip);
    const isActive = trip.status === "active";

    if (this.tripDetailName) this.tripDetailName.textContent = trip.name;
    if (this.tripDetailStatusBadge) {
      this.tripDetailStatusBadge.className = `trip-status-badge ${isActive ? "status-active" : "status-completed"}`;
      this.tripDetailStatusBadge.textContent = isActive ? "Active 🟢" : "Completed 🏁";
    }
    if (this.tripDetailTotal) this.tripDetailTotal.textContent = `₹${metrics.total.toFixed(2)}`;
    if (this.tripDetailAvg) this.tripDetailAvg.textContent = `₹${metrics.avg.toFixed(2)}/day`;
    if (this.tripDetailDuration) this.tripDetailDuration.textContent = `${metrics.days} ${metrics.days === 1 ? 'Day' : 'Days'}`;
    if (this.tripDetailMeta) this.tripDetailMeta.textContent = `📍 Destination: ${trip.city} • Dates: ${metrics.startDate} to ${metrics.endDate}`;

    if (this.tripTimelineContainer) {
      this.tripTimelineContainer.innerHTML = "";
      if (metrics.txList.length === 0) {
        this.tripTimelineContainer.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:12px 0;">No expenses logged for this trip yet.</p>`;
      } else {
        metrics.txList.forEach(tx => {
          const item = document.createElement("div");
          item.className = "trip-timeline-item";
          item.innerHTML = `
            <div>
              <span class="trip-timeline-date">${tx.date}</span>
              <div class="trip-timeline-note">${tx.emoji || "🧾"} ${tx.note || tx.category}</div>
            </div>
            <span class="trip-timeline-amt">₹${tx.amount.toFixed(2)}</span>
          `;
          this.tripTimelineContainer.appendChild(item);
        });
      }
    }

    this.openModal(this.tripDetailsModal);
  }

  finishActiveTrip() {
    if (!this.activeTripId) return;
    const trip = (this.trips || []).find(t => t.id === this.activeTripId);
    if (trip) {
      trip.status = "completed";
      this.activeTripId = "";
      this.saveToStorage("liquid_trips_v1", this.trips);
      localStorage.removeItem("liquid_active_trip_id");
      this.renderTripDropdown();
      this.renderTripsUI();
      this.showToast(`Trip '${trip.name}' finished 🏁`);
    }
  }

  handleDeleteTrip() {
    if (!this.selectedTripIdForModal) return;
    const tripId = this.selectedTripIdForModal;
    this.trips = (this.trips || []).filter(t => t.id !== tripId);
    if (this.activeTripId === tripId) {
      this.activeTripId = "";
      localStorage.removeItem("liquid_active_trip_id");
    }
    (this.expenses || []).forEach(tx => {
      if (tx.tripId === tripId) {
        delete tx.tripId;
        tx.tripName = "-";
      }
    });
    this.saveToStorage("liquid_expenses_v7", this.expenses);
    this.saveToStorage("liquid_trips_v1", this.trips);
    this.closeModal(this.tripDetailsModal);
    this.renderTripDropdown();
    this.renderTripsUI();
    this.showToast("Trip deleted! 🗑️");
  }

  handleAddCustomCategory(e) {
    e.preventDefault();
    const name = this.categoryNameInput ? this.categoryNameInput.value.trim() : "";
    const emoji = this.selectedEmoji || "🏷️";

    if (!name) return;

    if (this.expenseCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      this.showToast("Category already exists.");
      return;
    }

    this.expenseCategories.push({ name, emoji });
    this.saveToStorage("liquid_exp_cats_v7", this.expenseCategories);

    this.renderCategoryDropdowns();
    this.renderCategoryChips();
    if (this.categoryNameInput) this.categoryNameInput.value = "";
    this.closeModal(this.categoryModal);
    this.showToast(`Added category "${name}" ${emoji}`);
  }

  handleDeleteCategory(catName) {
    if (this.expenseCategories.length <= 1) {
      this.showToast("At least one category is required.");
      return;
    }

    this.expenseCategories = this.expenseCategories.filter(c => c.name !== catName);
    this.saveToStorage("liquid_exp_cats_v7", this.expenseCategories);

    this.renderCategoryDropdowns();
    this.renderCategoryChips();
    this.showToast(`Removed "${catName}"`);
  }

  handleAddExpense(e) {
    e.preventDefault();

    const date = this.expenseDate.value;
    const amount = parseFloat(this.expenseAmount.value);
    const categoryName = this.expenseCategory.value;
    const note = this.expenseNote ? this.expenseNote.value.trim() : "";
    const selectedTripId = this.expenseTripSelect ? this.expenseTripSelect.value : "";

    if (!date || isNaN(amount) || amount <= 0 || !categoryName) {
      this.showToast("Please enter a valid amount and category.");
      return;
    }

    let tripName = "-";
    if (selectedTripId) {
      const tr = this.trips.find(t => t.id === selectedTripId);
      if (tr) tripName = tr.name;
    }

    this.checkSmartAutoEndTripOnNewExpense(selectedTripId);

    const categoryObj = this.expenseCategories.find(c => c.name === categoryName) || { emoji: "💸" };

    const newExpense = {
      id: "tx-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      type: "DEBIT",
      date: date,
      category: categoryName,
      emoji: categoryObj.emoji,
      note: note || categoryName,
      amount: amount,
      tripId: selectedTripId || "",
      tripName: tripName,
      timestamp: Date.now()
    };

    this.expenses.unshift(newExpense);
    this.saveToStorage("liquid_expenses_v7", this.expenses);

    if (this.expenseAmount) this.expenseAmount.value = "";
    if (this.expenseNote) this.expenseNote.value = "";

    this.updateDashboard();
    this.renderActivityFeed();
    this.renderAnalytics();
    this.renderTripsUI();
    this.showToast(`Added ₹${amount.toFixed(2)} for ${categoryObj.emoji} ${categoryName}`);

    if (this.appsScriptUrl || (this.accessToken && this.driveSheetId)) {
      this.syncTransactionToGoogleSheets(newExpense);
    }
  }

  handleAddCredit(e) {
    e.preventDefault();

    const date = this.creditDate.value;
    const amount = parseFloat(this.creditAmount.value);
    const categoryName = this.creditCategory.value;
    const note = this.creditNote ? this.creditNote.value.trim() : "";

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

    if (this.creditAmount) this.creditAmount.value = "";
    if (this.creditNote) this.creditNote.value = "";

    this.updateCreditVaultUI();
    this.showToast(`Credited +₹${amount.toFixed(2)} (${categoryName}) 🟢`);

    if (this.appsScriptUrl || (this.accessToken && this.driveSheetId)) {
      this.syncTransactionToGoogleSheets(newCredit);
    }
  }

  openEditModal(tx) {
    this.renderEditCategoryDropdown();
    if (this.editTxId) this.editTxId.value = tx.id;
    if (this.editDate) this.editDate.value = tx.date;
    if (this.editAmount) this.editAmount.value = tx.amount;
    if (this.editCategory) this.editCategory.value = tx.category;
    if (this.editNote) this.editNote.value = tx.note;

    this.openModal(this.editModal);
  }

  handleSaveEditExpense(e) {
    e.preventDefault();
    const id = this.editTxId ? this.editTxId.value : "";
    const date = this.editDate ? this.editDate.value : "";
    const amount = parseFloat(this.editAmount ? this.editAmount.value : 0);
    const categoryName = this.editCategory ? this.editCategory.value : "";
    const note = this.editNote ? this.editNote.value.trim() : "";

    if (!id || !date || isNaN(amount) || amount <= 0 || !categoryName) return;

    const index = this.expenses.findIndex(t => t.id === id);
    if (index !== -1) {
      const catObj = this.expenseCategories.find(c => c.name === categoryName) || { emoji: "💳" };
      this.expenses[index] = {
        ...this.expenses[index],
        date,
        amount,
        category: categoryName,
        emoji: catObj.emoji,
        note: note || categoryName
      };

      this.saveToStorage("liquid_expenses_v7", this.expenses);
      this.updateDashboard();
      this.renderActivityFeed();
      this.renderAnalytics();
      this.closeModal(this.editModal);
      this.showToast("Expense updated! ✏️");

      this.syncTransactionEditToGoogleSheets(this.expenses[index]);
    }
  }

  handleDeleteExpense(id) {
    const tx = this.expenses.find(t => t.id === id);
    if (!tx) return;

    this.pendingDeleteId = id;
    this.pendingDeleteType = "EXPENSE";

    const amt = parseFloat(tx.amount) || 0;
    if (this.confirmTxPreview) {
      this.confirmTxPreview.innerHTML = `
        <div class="confirm-tx-card">
          <span class="preview-emoji">${renderEmojiHtml(tx.emoji || '🧾')}</span>
          <div class="preview-info">
            <strong>${tx.category}</strong>
            <small>${tx.note} • -₹${amt.toFixed(2)}</small>
          </div>
        </div>
      `;
    }

    this.openModal(this.deleteConfirmModal);
  }

  handleDeleteCredit(id) {
    const cr = this.credits.find(t => t.id === id);
    if (!cr) return;

    this.pendingDeleteId = id;
    this.pendingDeleteType = "CREDIT";

    const amt = parseFloat(cr.amount) || 0;
    if (this.confirmTxPreview) {
      this.confirmTxPreview.innerHTML = `
        <div class="confirm-tx-card">
          <span class="preview-emoji">${renderEmojiHtml(cr.emoji || '💰')}</span>
          <div class="preview-info">
            <strong>${cr.category}</strong>
            <small>${cr.note} • +₹${amt.toFixed(2)}</small>
          </div>
        </div>
      `;
    }

    this.openModal(this.deleteConfirmModal);
  }

  executePendingDelete() {
    if (!this.pendingDeleteId) return;

    if (this.pendingDeleteType === "EXPENSE") {
      this.expenses = this.expenses.filter(t => t.id !== this.pendingDeleteId);
      this.saveToStorage("liquid_expenses_v7", this.expenses);
      this.updateDashboard();
      this.renderActivityFeed();
      this.renderAnalytics();
      this.syncTransactionDeleteToGoogleSheets(this.pendingDeleteId);
      this.showToast("Expense deleted.");
    } else if (this.pendingDeleteType === "CREDIT") {
      this.credits = this.credits.filter(t => t.id !== this.pendingDeleteId);
      this.saveToStorage("liquid_credits_v7", this.credits);
      this.updateCreditVaultUI();
      this.syncTransactionDeleteToGoogleSheets(this.pendingDeleteId);
      this.showToast("Credit deleted.");
    }

    this.pendingDeleteId = null;
    this.pendingDeleteType = null;
    this.closeModal(this.deleteConfirmModal);
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("active-modal");
    document.body.style.overflow = "hidden";
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("active-modal");
    document.body.style.overflow = "";
  }

  parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? new Date(0) : dateStr;

    const str = String(dateStr).trim();
    if (!str) return new Date(0);

    const cleanStr = str.split("T")[0].trim();

    if (cleanStr.includes("/") || cleanStr.includes("-")) {
      const delim = cleanStr.includes("/") ? "/" : "-";
      const parts = cleanStr.split(delim);

      if (parts.length === 3) {
        // YYYY-MM-DD or YYYY/MM/DD
        if (parts[0].length === 4) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          return new Date(y, m, d);
        }
        // DD-MM-YYYY or MM-DD-YYYY or DD-Mon-YYYY
        if (parts[2].length === 4) {
          const dOrM = parseInt(parts[0], 10);
          const mOrD = parseInt(parts[1], 10);
          const y = parseInt(parts[2], 10);

          if (isNaN(mOrD)) {
            const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
            const m = monthMap[String(parts[1]).toLowerCase().substring(0, 3)] ?? 0;
            return new Date(y, m, dOrM);
          }

          // Handle DD/MM/YYYY (standard Indian format)
          if (dOrM > 12) {
            return new Date(y, mOrD - 1, dOrM);
          } else {
            return new Date(y, mOrD - 1, dOrM);
          }
        }
      }
    }

    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
  }

  updateDashboard() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayStr = now.toISOString().split("T")[0];

    let monthlyTotal = 0;
    let todayTotal = 0;
    let yearTotal = 0;
    let totalExpenseSum = 0;
    let monthlyCount = 0;

    this.expenses.forEach(tx => {
      const amt = parseFloat(tx.amount) || 0;
      const txDate = this.parseDate(tx.date);
      totalExpenseSum += amt;

      if (tx.date === todayStr) {
        todayTotal += amt;
      }

      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
        monthlyTotal += amt;
        monthlyCount++;
      }

      if (txDate.getFullYear() === currentYear) {
        yearTotal += amt;
      }
    });

    if (this.monthlyTotalEl) this.monthlyTotalEl.textContent = this.formatCurrency(monthlyTotal);
    if (this.totalExpensesCount) this.totalExpensesCount.textContent = `${monthlyCount} transaction${monthlyCount === 1 ? '' : 's'} this month`;
    if (this.todaySpendEl) this.todaySpendEl.textContent = this.formatCurrency(todayTotal);
    if (this.yearSpendEl) this.yearSpendEl.textContent = this.formatCurrency(yearTotal);

    let totalCreditSum = 0;
    this.credits.forEach(cr => {
      totalCreditSum += parseFloat(cr.amount) || 0;
    });

    const netBalance = totalCreditSum - totalExpenseSum;
    if (this.totalBalanceEl) {
      this.totalBalanceEl.textContent = `${netBalance >= 0 ? '+' : ''}${this.formatCurrency(netBalance)}`;
      this.totalBalanceEl.className = netBalance >= 0 ? "balance-amount positive" : "balance-amount negative";
    }
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
        monthlyCreditTotal += parseFloat(cr.amount) || 0;
        creditCount++;
      }
    });

    if (this.monthlyCreditEl) this.monthlyCreditEl.textContent = this.formatCurrency(monthlyCreditTotal);
    if (this.creditCountBadge) this.creditCountBadge.textContent = `${creditCount} credit entr${creditCount === 1 ? 'y' : 'ies'} this month`;

    if (this.creditFeedCountTag) this.creditFeedCountTag.textContent = `${this.credits.length} item${this.credits.length === 1 ? '' : 's'}`;
    if (!this.creditFeedList) return;
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
          <span class="tx-amount income-text">+₹${(parseFloat(cr.amount) || 0).toFixed(2)}</span>
          <button class="delete-tx-btn delete-cr-btn" title="Delete credit entry">&times;</button>
        </div>
      `;

      const deleteBtn = card.querySelector(".delete-cr-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => this.handleDeleteCredit(cr.id));
      }
      this.creditFeedList.appendChild(card);
    });
  }

  renderActivityFeed() {
    const searchQuery = this.searchInput ? this.searchInput.value.toLowerCase().trim() : "";
    const categoryVal = this.categoryFilter ? this.categoryFilter.value : "ALL";
    const timeVal = this.timeFilter ? this.timeFilter.value : "ALL";

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const filtered = this.expenses.filter(tx => {
      const matchesSearch = tx.note.toLowerCase().includes(searchQuery) ||
        tx.category.toLowerCase().includes(searchQuery);
      if (!matchesSearch) return false;

      if (categoryVal !== "ALL" && tx.category !== categoryVal) return false;

      const txDate = this.parseDate(tx.date);
      if (timeVal === "THIS_MONTH") {
        if (txDate.getFullYear() !== currentYear || txDate.getMonth() !== currentMonth) return false;
      } else if (timeVal === "THIS_YEAR") {
        if (txDate.getFullYear() !== currentYear) return false;
      }

      return true;
    });

    if (this.feedCountTag) this.feedCountTag.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;
    if (!this.feedList) return;
    this.feedList.innerHTML = "";

    if (filtered.length === 0) {
      this.feedList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${renderEmojiHtml('🔍')}</div>
          <p>No transactions match your filter.</p>
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
          <span class="tx-amount expense-text">-₹${(parseFloat(tx.amount) || 0).toFixed(2)}</span>
          <button class="edit-tx-btn" title="Edit expense">✏️</button>
          <button class="delete-tx-btn" title="Delete expense">&times;</button>
        </div>
      `;

      const editBtn = card.querySelector(".edit-tx-btn");
      const delBtn = card.querySelector(".delete-tx-btn");
      if (editBtn) editBtn.addEventListener("click", () => this.openEditModal(tx));
      if (delBtn) delBtn.addEventListener("click", () => this.handleDeleteExpense(tx.id));

      this.feedList.appendChild(card);
    });
  }

  renderAnalytics() {
    if (!this.analyticsProgressContainer) return;
    this.analyticsProgressContainer.innerHTML = "";
    if (this.funnelStagesContainer) this.funnelStagesContainer.innerHTML = "";

    const timeVal = this.analyticsTimeFilter ? this.analyticsTimeFilter.value : "THIS_MONTH";
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Filter Expenses
    const filteredExpenses = this.expenses.filter(tx => {
      const txDate = this.parseDate(tx.date);
      if (timeVal === "THIS_MONTH") {
        return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
      } else if (timeVal === "THIS_YEAR") {
        return txDate.getFullYear() === currentYear;
      }
      return true;
    });

    // Filter Credits / Income
    const filteredCredits = this.credits.filter(cr => {
      const crDate = this.parseDate(cr.date);
      if (timeVal === "THIS_MONTH") {
        return crDate.getFullYear() === currentYear && crDate.getMonth() === currentMonth;
      } else if (timeVal === "THIS_YEAR") {
        return crDate.getFullYear() === currentYear;
      }
      return true;
    });

    let totalCreditSum = 0;
    filteredCredits.forEach(cr => { totalCreditSum += parseFloat(cr.amount) || 0; });

    let totalExpenseSum = 0;
    const categoryTotals = {};

    filteredExpenses.forEach(tx => {
      const amt = parseFloat(tx.amount) || 0;
      totalExpenseSum += amt;
      categoryTotals[tx.category] = categoryTotals[tx.category] || { amount: 0, emoji: tx.emoji };
      categoryTotals[tx.category].amount += amt;
      categoryTotals[tx.category].emoji = tx.emoji;
    });

    const netSavings = totalCreditSum - totalExpenseSum;
    const expenseRatio = totalCreditSum > 0 ? ((totalExpenseSum / totalCreditSum) * 100).toFixed(1) : (totalExpenseSum > 0 ? "100.0" : "0.0");
    const savingsRatio = totalCreditSum > 0 ? ((netSavings / totalCreditSum) * 100).toFixed(1) : "0.0";

    // 1. Render Financial Funnel Stage Cards
    if (this.funnelStagesContainer) {
      this.funnelStagesContainer.innerHTML = `
        <div class="funnel-stage-card">
          <div class="funnel-stage-left">
            <div class="funnel-icon-bubble">🟢</div>
            <div class="funnel-stage-info">
              <span class="funnel-stage-title">Stage 1: Total Credit Inflow</span>
              <span class="funnel-stage-subtitle">${filteredCredits.length} credit entries</span>
            </div>
          </div>
          <div class="funnel-stage-right">
            <span class="funnel-stage-amount" style="color: #10b981;">₹${this.formatCurrency(totalCreditSum)}</span>
            <span class="funnel-conversion-pill" style="background: rgba(16, 185, 129, 0.12); color: #047857;">100% Inflow</span>
          </div>
        </div>

        <div class="funnel-flow-connector">↓ Outflow Conversion ↓</div>

        <div class="funnel-stage-card">
          <div class="funnel-stage-left">
            <div class="funnel-icon-bubble">💸</div>
            <div class="funnel-stage-info">
              <span class="funnel-stage-title">Stage 2: Total Expense Outflow</span>
              <span class="funnel-stage-subtitle">${filteredExpenses.length} expense entries</span>
            </div>
          </div>
          <div class="funnel-stage-right">
            <span class="funnel-stage-amount" style="color: #ef4444;">₹${this.formatCurrency(totalExpenseSum)}</span>
            <span class="funnel-conversion-pill" style="background: rgba(239, 68, 68, 0.12); color: #b91c1c;">${expenseRatio}% of Income</span>
          </div>
        </div>

        <div class="funnel-flow-connector">↓ Net Retention ↓</div>

        <div class="funnel-stage-card" style="background: ${netSavings >= 0 ? 'rgba(240, 253, 244, 0.85)' : 'rgba(254, 242, 242, 0.85)'};">
          <div class="funnel-stage-left">
            <div class="funnel-icon-bubble">${netSavings >= 0 ? '🏦' : '⚠️'}</div>
            <div class="funnel-stage-info">
              <span class="funnel-stage-title">Stage 3: Net Remaining / Savings</span>
              <span class="funnel-stage-subtitle">${netSavings >= 0 ? 'Positive Cashflow' : 'Deficit / Overbudget'}</span>
            </div>
          </div>
          <div class="funnel-stage-right">
            <span class="funnel-stage-amount" style="color: ${netSavings >= 0 ? '#047857' : '#b91c1c'};">${netSavings >= 0 ? '+' : ''}₹${this.formatCurrency(netSavings)}</span>
            <span class="funnel-conversion-pill" style="background: ${netSavings >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${netSavings >= 0 ? '#047857' : '#b91c1c'};">${savingsRatio}% Retained</span>
          </div>
        </div>
      `;
    }

    // 2. Render Category Spending Breakdown
    if (totalExpenseSum === 0) {
      this.analyticsProgressContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${renderEmojiHtml('📊')}</div>
          <p>No expenses recorded for this period.</p>
        </div>
      `;
      return;
    }

    const sortedCategories = Object.keys(categoryTotals).map(catName => ({
      name: catName,
      amount: categoryTotals[catName].amount,
      emoji: categoryTotals[catName].emoji,
      percentage: ((categoryTotals[catName].amount / totalExpenseSum) * 100).toFixed(1)
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
    return (parseFloat(val) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getFormattedTimestamp() {
    const d = new Date();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  }

  async handleRepairSheet() {
    if (!this.accessToken || !this.driveSheetId) {
      this.showToast("Please sign in with Google first.");
      return;
    }
    this.showToast("Formatting & Repairing Google Sheet headers... 🛠️");
    await this.ensureExecutiveSheetStructure(this.driveSheetId);
    this.showToast("Google Sheet headers & structure repaired! 🎨");
  }

  async ensureExecutiveSheetStructure(spreadsheetId) {
    if (!this.accessToken || !spreadsheetId) return;

    try {
      // 1. Fetch Row 1 to check if headers exist
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:J1`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      const data = await res.json();
      const firstRow = (data.values && data.values[0]) ? data.values[0] : [];
      const firstCell = String(firstRow[0] || "").trim();

      if (firstCell !== "ID") {
        // If row 1 contains transaction data like 'tx-...' or 'cr-...', insert a top header row
        if (firstCell.startsWith("tx-") || firstCell.startsWith("cr-") || firstCell.length > 0) {
          await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              requests: [
                {
                  insertDimension: {
                    range: { sheetId: 0, dimension: "ROWS", startIndex: 0, endIndex: 1 },
                    inheritFromBefore: false
                  }
                }
              ]
            })
          });
        }
      }

      // Explicitly set executive headers on Row 1
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:J1?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          values: [["ID", "Type", "Date", "Category", "Emoji", "Note", "Amount (INR ₹)", "Trip Name", "Timestamp", "Status"]]
        })
      });

      await this.applyExecutiveSheetStyling(spreadsheetId);
    } catch (err) {
      console.warn("Ensure executive sheet structure notice:", err);
    }
  }

  async applyExecutiveSheetStyling(spreadsheetId) {
    if (!this.accessToken || !spreadsheetId) return;

    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              updateSheetProperties: {
                properties: { gridProperties: { columnCount: 10, frozenRowCount: 1 } },
                fields: "gridProperties.columnCount,gridProperties.frozenRowCount"
              }
            },
            // Clear Data Validation from Column I (index 8)
            {
              setDataValidation: {
                range: { startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 8, endColumnIndex: 9 }
              }
            },
            {
              repeatCell: {
                range: { startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 10 },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.31, green: 0.27, blue: 0.90 },
                    textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 11 },
                    horizontalAlignment: "CENTER"
                  }
                },
                fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
              }
            },
            {
              repeatCell: {
                range: { startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 6, endColumnIndex: 7 },
                cell: {
                  userEnteredFormat: {
                    numberFormat: { type: "CURRENCY", pattern: "₹#,##0.00" },
                    textFormat: { bold: true },
                    horizontalAlignment: "RIGHT"
                  }
                },
                fields: "userEnteredFormat(numberFormat,textFormat,horizontalAlignment)"
              }
            },
            {
              repeatCell: {
                range: { startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 1, endColumnIndex: 3 },
                cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
                fields: "userEnteredFormat.horizontalAlignment"
              }
            },
            {
              repeatCell: {
                range: { startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 4, endColumnIndex: 5 },
                cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
                fields: "userEnteredFormat.horizontalAlignment"
              }
            },
            {
              repeatCell: {
                range: { startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 7, endColumnIndex: 10 },
                cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
                fields: "userEnteredFormat.horizontalAlignment"
              }
            },
            {
              setDataValidation: {
                range: { startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 9, endColumnIndex: 10 },
                rule: {
                  condition: {
                    type: "ONE_OF_LIST",
                    values: [{ userEnteredValue: "ACTIVE" }, { userEnteredValue: "INACTIVE" }]
                  },
                  showCustomUi: true,
                  strict: true
                }
              }
            },
            {
              addConditionalFormatRule: {
                rule: {
                  ranges: [{ startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 9, endColumnIndex: 10 }],
                  booleanRule: {
                    condition: { type: "TEXT_EQ", values: [{ userEnteredValue: "ACTIVE" }] },
                    format: {
                      backgroundColor: { red: 0.86, green: 0.98, blue: 0.90 },
                      textFormat: { foregroundColor: { red: 0.08, green: 0.50, blue: 0.23 }, bold: true }
                    }
                  }
                },
                index: 0
              }
            },
            {
              addConditionalFormatRule: {
                rule: {
                  ranges: [{ startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 9, endColumnIndex: 10 }],
                  booleanRule: {
                    condition: { type: "TEXT_EQ", values: [{ userEnteredValue: "INACTIVE" }] },
                    format: {
                      backgroundColor: { red: 0.99, green: 0.88, blue: 0.88 },
                      textFormat: { foregroundColor: { red: 0.72, green: 0.11, blue: 0.11 }, bold: true }
                    }
                  }
                },
                index: 1
              }
            }
          ]
        })
      });
    } catch (styleErr) {
      console.warn("Executive styling API notice:", styleErr);
    }
  }

  handleSaveSettings(e) {
    if (e) e.preventDefault();
    const url = this.appsScriptUrlInput ? this.appsScriptUrlInput.value.trim() : "";
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

  async ensureValidAccessToken() {
    if (!this.userProfile || !this.userProfile.id) return false;
    const expiresAt = parseInt(localStorage.getItem("liquid_google_token_expires") || "0", 10);

    if (!this.accessToken || Date.now() >= expiresAt) {
      if (this.tokenClient) {
        try {
          this.isSilentRenewal = true;
          this.tokenClient.requestAccessToken({ prompt: "none" });
          return true;
        } catch (e) {
          console.warn("Silent OAuth renewal notice:", e);
        }
      }
    }
    return true;
  }

  async syncTransactionToGoogleSheets(tx, silent = false) {
    if (!tx || !tx.id) return;
    if (!this.syncingTxIds) this.syncingTxIds = new Set();

    if (this.syncingTxIds.has(tx.id)) {
      console.log(`Sync already in progress for transaction ${tx.id}. Skipping duplicate call.`);
      return;
    }

    this.syncingTxIds.add(tx.id);

    try {
      if (this.accessToken && this.driveSheetId) {
        try {
          await this.ensureValidAccessToken();

          // Check if ID already exists in Google Sheet to prevent duplicates
          const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.driveSheetId}/values/A1:A1000`, {
            headers: { Authorization: `Bearer ${this.accessToken}` }
          });
          const checkData = await checkRes.json();
          if (checkData.values && Array.isArray(checkData.values)) {
            const exists = checkData.values.some(row => row[0] && String(row[0]).trim() === String(tx.id).trim());
            if (exists) {
              console.log(`Transaction ID ${tx.id} already exists in Sheet. Skipping append.`);
              return;
            }
          }

          const formattedTimestamp = this.getFormattedTimestamp();
          let res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.driveSheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              values: [[
                tx.id || "",
                tx.type || "DEBIT",
                tx.date || "",
                tx.category || "",
                tx.emoji || "🧾",
                tx.note || "",
                tx.amount || 0,
                tx.tripName || "-",
                formattedTimestamp,
                "ACTIVE"
              ]]
            })
          });

          if (res.status === 401) {
            await this.ensureValidAccessToken();
            res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.driveSheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                values: [[
                  tx.id || "",
                  tx.type || "DEBIT",
                  tx.date || "",
                  tx.category || "",
                  tx.emoji || "🧾",
                  tx.note || "",
                  tx.amount || 0,
                  tx.tripName || "-",
                  formattedTimestamp,
                  "ACTIVE"
                ]]
              })
            });
          }

          const data = await res.json();
          if (res.ok) {
            if (!silent) this.showToast("Synced to your Google Drive Sheet! 📊");
            return;
          } else {
            console.warn("Drive Sheets API Sync Error:", data);
            if (res.status === 404 || (data && data.error && (data.error.code === 404 || String(data.error.message).toLowerCase().includes("not found")))) {
              console.warn("Drive Sheet ID not found. Relinking Google Sheet...");
              localStorage.removeItem("liquid_drive_sheet_id");
              this.driveSheetId = "";
              await this.autoConnectGoogleDriveSheet();
              return;
            }
            if (data && data.error && data.error.message && !silent) {
              this.showToast(`Sheets Sync: ${data.error.message}`);
            }
          }
        } catch (err) {
          console.error("Drive Sheets REST sync failed:", err);
        }
      }

      if (!this.appsScriptUrl) return;

      try {
        await fetch(this.appsScriptUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ADD", ...tx })
        });
        if (!silent) this.showToast("Synced to Google Sheets! 📊");
      } catch (err) {
        console.error("Google Sheets sync failed:", err);
        if (!silent) this.showToast("Sync error. Saved locally.");
      }
    } finally {
      this.syncingTxIds.delete(tx.id);
    }
  }

  async syncTransactionDeleteToGoogleSheets(id) {
    if (this.accessToken && this.driveSheetId) {
      try {
        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.driveSheetId}/values/A1:A1000`, {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        });
        const data = await res.json();

        if (data.values && Array.isArray(data.values)) {
          let rowIndex = -1;
          for (let i = 0; i < data.values.length; i++) {
            if (String(data.values[i][0]).trim() === String(id).trim()) {
              rowIndex = i + 1;
              break;
            }
          }

          if (rowIndex > 1) {
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.driveSheetId}/values/J${rowIndex}?valueInputOption=USER_ENTERED`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ values: [["INACTIVE"]] })
            });
            this.showToast("Marked as INACTIVE in your Google Sheet! 🗑️");
            return;
          }
        }
      } catch (err) {
        console.error("Drive Sheets delete sync failed:", err);
      }
    }

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
    if (this.accessToken && this.driveSheetId) {
      try {
        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.driveSheetId}/values/A1:A1000`, {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        });
        const data = await res.json();

        if (data.values && Array.isArray(data.values)) {
          let rowIndex = -1;
          for (let i = 0; i < data.values.length; i++) {
            if (String(data.values[i][0]).trim() === String(tx.id).trim()) {
              rowIndex = i + 1;
              break;
            }
          }

          if (rowIndex > 1) {
            const formattedTimestamp = this.getFormattedTimestamp();
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.driveSheetId}/values/B${rowIndex}:I${rowIndex}?valueInputOption=USER_ENTERED`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                values: [[
                  tx.type || "DEBIT",
                  tx.date || "",
                  tx.category || "",
                  tx.emoji || "🧾",
                  tx.note || "",
                  tx.amount || 0,
                  tx.tripName || "-",
                  formattedTimestamp
                ]]
              })
            });
            this.showToast("Updated entry in your Google Sheet! ✏️");
            return;
          }
        }
      } catch (err) {
        console.error("Drive Sheets edit sync failed:", err);
      }
    }

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
    if (this.accessToken && this.driveSheetId) {
      try {
        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.driveSheetId}/values/A2:J1000`, {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        });
        const data = await res.json();

        if (data.values && Array.isArray(data.values)) {
          const expensesMap = new Map();
          const creditsMap = new Map();

          data.values.forEach(row => {
            if (!row[0]) return;
            const itemId = String(row[0]).trim();
            const isTenCol = row.length >= 10 || (row[7] && String(row[7]).indexOf(":") === -1);
            const status = String((isTenCol ? row[9] : row[8]) || "ACTIVE").toUpperCase().trim();
            if (status !== "ACTIVE") return;

            const rawDateStr = String(row[2] || "").trim();
            const parsedDateObj = this.parseDate(rawDateStr);
            const formattedIsoDate = parsedDateObj.getTime() > 0
              ? `${parsedDateObj.getFullYear()}-${String(parsedDateObj.getMonth() + 1).padStart(2, '0')}-${String(parsedDateObj.getDate()).padStart(2, '0')}`
              : (rawDateStr.split("T")[0] || new Date().toISOString().split("T")[0]);

            const tripName = isTenCol && row[7] && String(row[7]).trim() !== "-" ? String(row[7]).trim() : "-";

            const item = {
              id: itemId,
              type: String(row[1] || "DEBIT").toUpperCase().trim(),
              date: formattedIsoDate,
              category: String(row[3] || "General Expense").trim(),
              emoji: String(row[4] || "🧾").trim(),
              note: String(row[5] || "").trim(),
              amount: parseFloat(String(row[6]).replace(/[^0-9.]/g, "")) || 0,
              tripName: tripName,
              timestamp: Date.now()
            };

            if (item.type === "CREDIT") {
              creditsMap.set(itemId, item);
            } else {
              expensesMap.set(itemId, item);
            }
          });

          this.expenses = Array.from(expensesMap.values());
          this.credits = Array.from(creditsMap.values());
          this.saveToStorage("liquid_expenses_v7", this.expenses);
          this.saveToStorage("liquid_credits_v7", this.credits);

          this.updateDashboard();
          this.renderActivityFeed();
          this.renderAnalytics();
          this.renderTripsUI();
          this.updateCreditVaultUI();
          this.showToast(`Fetched ${this.expenses.length + this.credits.length} ACTIVE entries from your Google Sheet! 🚀`);
          return;
        }
      } catch (err) {
        console.error("Drive Sheets pull sync failed:", err);
      }
    }

    const url = (this.appsScriptUrlInput ? this.appsScriptUrlInput.value.trim() : "") || this.appsScriptUrl;
    if (!url) {
      this.showToast("Please sign in with Google or save an Apps Script URL.");
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
          const rawDateStr = String(item.date || "").trim();
          const parsedDateObj = this.parseDate(rawDateStr);
          const formattedIsoDate = parsedDateObj.getTime() > 0
            ? `${parsedDateObj.getFullYear()}-${String(parsedDateObj.getMonth() + 1).padStart(2, '0')}-${String(parsedDateObj.getDate()).padStart(2, '0')}`
            : (rawDateStr.split("T")[0] || new Date().toISOString().split("T")[0]);

          const cleanedItem = {
            id: String(item.id).trim(),
            type: String(item.type || "DEBIT").toUpperCase().trim(),
            date: formattedIsoDate,
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

        this.expenses = newExpenses;
        this.credits = newCredits;
        this.saveToStorage("liquid_expenses_v7", this.expenses);
        this.saveToStorage("liquid_credits_v7", this.credits);

        this.updateDashboard();
        this.renderActivityFeed();
        this.renderAnalytics();
        this.updateCreditVaultUI();

        this.showToast(`Fetched ${activeItems.length} ACTIVE entries from Google Sheet! 🚀`);
      }
    } catch (e) {
      console.error("Pull sync error:", e);
    }
  }

  async handleTestSync() {
    if (this.accessToken && this.driveSheetId) {
      const dummyTx = {
        id: "test-" + Date.now(),
        type: "DEBIT",
        date: new Date().toISOString().split("T")[0],
        category: "Fuel & Petrol",
        emoji: "⛽",
        note: "Test connection ping",
        amount: 100.00
      };
      await this.syncTransactionToGoogleSheets(dummyTx);
      return;
    }

    const url = this.appsScriptUrlInput ? this.appsScriptUrlInput.value.trim() : this.appsScriptUrl;
    if (!url) {
      this.showToast("Please sign in with Google or save an Apps Script URL first.");
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
    }
  }

  initGoogleAuth() {
    if (typeof window === "undefined" || !window.google || !window.google.accounts) {
      setTimeout(() => this.initGoogleAuth(), 500);
      return;
    }

    const savedClientId = localStorage.getItem("liquid_google_client_id") || "177900383625-5479kmja9i36pbqmokk5tdp7t64h0hep.apps.googleusercontent.com";

    try {
      window.google.accounts.id.initialize({
        client_id: savedClientId,
        callback: (response) => this.handleGoogleCredentialResponse(response),
        auto_select: false,
        cancel_on_tap_outside: true
      });
    } catch (err) {
      console.warn("GSI init notice:", err);
    }

    try {
      if (window.google.accounts.oauth2) {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: savedClientId,
          scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
          callback: (tokenResponse) => this.handleOAuthTokenResponse(tokenResponse)
        });
      }
    } catch (err) {
      console.warn("OAuth2 token client notice:", err);
    }
  }

  triggerGoogleSignIn() {
    if (this.userDropdown) this.userDropdown.classList.add("hidden");

    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: "select_account" });
    } else if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt();
    } else {
      this.showToast("Google OAuth SDK loading... Please wait.");
    }
  }

  async handleOAuthTokenResponse(tokenResponse) {
    if (!tokenResponse || !tokenResponse.access_token) {
      this.showToast("Google Sign-In cancelled.");
      return;
    }

    this.accessToken = tokenResponse.access_token;
    const expiresIn = tokenResponse.expires_in || 3600;
    this.tokenExpiresAt = Date.now() + (expiresIn - 300) * 1000;
    localStorage.setItem("liquid_google_access_token", this.accessToken);
    localStorage.setItem("liquid_google_token_expires", this.tokenExpiresAt);

    const isSilent = this.isSilentRenewal;
    this.isSilentRenewal = false;

    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      const profile = await res.json();

      if (profile && profile.sub) {
        this.userProfile = {
          id: profile.sub,
          name: profile.name || "Google User",
          firstName: profile.given_name || profile.name || "User",
          email: profile.email || "",
          picture: profile.picture || ""
        };

        this.saveToStorage("liquid_user_profile", this.userProfile);
        if (this.userDropdown) this.userDropdown.classList.add("hidden");
        this.updateUserProfileUI();
        if (!isSilent) {
          this.showToast(`Welcome, ${this.userProfile.firstName}! Logged in with Google. 👤`);
        }

        if (!isSilent || !this.driveSheetId) {
          this.autoConnectGoogleDriveSheet();
        }
      }
    } catch (err) {
      console.error("Failed to fetch Google profile:", err);
    }
  }

  async syncAllUnsyncedTransactionsToGoogleSheets() {
    if (!this.accessToken || !this.driveSheetId || this.isSyncingAll) return;
    this.isSyncingAll = true;

    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.driveSheetId}/values/A1:A1000`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      const data = await res.json();
      const existingIds = new Set();
      if (data.values && Array.isArray(data.values)) {
        data.values.forEach(row => {
          if (row[0]) existingIds.add(String(row[0]).trim());
        });
      }

      const allTxs = [...this.expenses, ...this.credits];
      const unsynced = allTxs.filter(tx => tx.id && !existingIds.has(String(tx.id).trim()));

      if (unsynced.length > 0) {
        let syncedCount = 0;
        for (const tx of unsynced) {
          await this.syncTransactionToGoogleSheets(tx, true);
          syncedCount++;
        }
        this.showToast(`Synced ${syncedCount} new entries to your Google Sheet! 📊`);
      }
    } catch (err) {
      console.warn("Unsynced transactions sync check error:", err);
    } finally {
      this.isSyncingAll = false;
    }
  }

  async autoConnectGoogleDriveSheet() {
    if (!this.accessToken || this.isAutoConnecting) return;
    this.isAutoConnecting = true;

    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='Liquid Spend Expenses (INR ₹)' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      const searchData = await searchRes.json();

      if (searchData.files && searchData.files.length > 0) {
        this.driveSheetId = searchData.files[0].id;
        await this.ensureExecutiveSheetStructure(this.driveSheetId);
        this.showToast("Connected to your Google Drive Sheet! 📄");
      } else {
        const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            properties: { title: "Liquid Spend Expenses (INR ₹)" }
          })
        });
        const newSheetData = await createRes.json();
        if (newSheetData && newSheetData.spreadsheetId) {
          this.driveSheetId = newSheetData.spreadsheetId;

          try {
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.driveSheetId}/values/A1:J1?valueInputOption=USER_ENTERED`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                values: [["ID", "Type", "Date", "Category", "Emoji", "Note", "Amount (₹)", "Trip Name", "Timestamp", "Status"]]
              })
            });
            await this.applyExecutiveSheetStyling(this.driveSheetId);
          } catch (headerErr) {
            console.warn("Header setup notice:", headerErr);
          }

          this.showToast("Created Google Sheet 'Liquid Spend Expenses (INR ₹)' in your Drive! 📄");
        } else {
          console.warn("Sheets API create warning:", newSheetData);
          if (newSheetData.error && newSheetData.error.message) {
            this.showToast(`Google Sheets API: ${newSheetData.error.message}`);
          }
        }
      }

      this.driveSheetUrl = `https://docs.google.com/spreadsheets/d/${this.driveSheetId}`;
      this.saveToStorage("liquid_drive_sheet_id", this.driveSheetId);
      this.saveToStorage("liquid_drive_sheet_url", this.driveSheetUrl);
      this.updateUserProfileUI();

      if (this.driveSheetId && this.accessToken) {
        await this.syncAllUnsyncedTransactionsToGoogleSheets();
        await this.handlePullSyncFromSheets();
      }
    } catch (err) {
      console.error("Auto-connect Drive error:", err);
    } finally {
      this.isAutoConnecting = false;
    }
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

    if (this.userProfile && this.userProfile.name) {
      this.userNameLabel.textContent = this.userProfile.firstName || this.userProfile.name;
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
    localStorage.removeItem("liquid_google_access_token");

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

    // Prevent notification spam by capping max active toasts to 2
    while (container.children.length >= 2) {
      container.removeChild(container.firstChild);
    }

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

// Helper render function for emoji HTML
function renderEmojiHtml(emojiStr) {
  if (!emojiStr) return "🧾";
  return emojiStr;
}

function getFormattedTimestamp() {
  const d = new Date();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  window.app = new ExpenseApp();
});
