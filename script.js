// DOM Elements
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username'); // New ID input
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const loginContainer = document.getElementById('login-container');
const appContent = document.getElementById('app-content');
const logoutBtn = document.getElementById('logout-btn');
const signupBtn = document.getElementById('signup-btn'); 

const balance = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const form = document.getElementById('transaction-form');
const description = document.getElementById('description');
const amount = document.getElementById('amount');
const dateInput = document.getElementById('date');
const incomeRadio = document.getElementById('income-radio');
const expenseRadio = document.getElementById('expense-radio');
const categorySelect = document.getElementById('transaction-category');
const calendarContainer = document.getElementById('calendar-container');
const weeklyCalendarContainer = document.getElementById('weekly-calendar-container');
const incomeCategoryList = document.getElementById('income-category-list');
const expenseCategoryList = document.getElementById('expense-category-list');
const addIncomeCategoryForm = document.getElementById('add-income-category-form');
const addExpenseCategoryForm = document.getElementById('add-expense-category-form');
const newIncomeCategoryName = document.getElementById('new-income-category-name');
const newExpenseCategoryName = document.getElementById('new-expense-category-name');

// Edit Modal Elements
const editTransactionModal = $('#edit-transaction-modal');
const editTransactionForm = document.getElementById('edit-transaction-form');
const editTransactionId = document.getElementById('edit-transaction-id');
const editDate = document.getElementById('edit-date');
const editDescription = document.getElementById('edit-description');
const editAmount = document.getElementById('edit-amount');
const editIncomeRadio = document.getElementById('edit-income-radio');
const editExpenseRadio = document.getElementById('edit-expense-radio');
const editCategorySelect = document.getElementById('edit-transaction-category');

// Day Details Modal Elements
const dayDetailsModal = $('#day-details-modal');
const dayDetailsModalTitle = document.getElementById('day-details-modal-title');
const dayDetailsModalBody = document.getElementById('day-details-modal-body');

// Search/Filter Elements
const searchDescriptionInput = document.getElementById('search-description');
const filterCategorySelect = document.getElementById('filter-category');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const clearFiltersBtn = document.getElementById('clear-filters');
const searchResultsContainer = document.getElementById('search-results-container');
const filterForm = document.getElementById('filter-form');

// Budget Elements
const budgetListContainer = document.getElementById('budget-list-container');
const totalMonthlyIncomeInput = document.getElementById('total-monthly-income');
const totalAllocatedBudgetSpan = document.getElementById('total-allocated-budget');
const unallocatedAmountSpan = document.getElementById('unallocated-amount');

// Memo Elements
const memoInput = document.getElementById('memo-input');
const addMemoBtn = document.getElementById('add-memo-btn');
const memoList = document.getElementById('memo-list');

// --- APP STATE ---
let currentUser = null;
let transactions = [];
let categories = [];
let budgets = [];
let memos = [];
let viewedDate = new Date();

const defaultCategories = {
    income: [{ id: 1, name: '월급' }, { id: 2, name: '용돈' }, { id: 3, name: '부수입' }],
    expense: [{ id: 4, name: '식비' }, { id: 5, name: '교통' }, { id: 6, name: '쇼핑' }, { id: 7, name: '기타' }]
};

// --- LOGIN/LOGOUT LOGIC ---
function checkLogin() {
    const lastUser = localStorage.getItem('money_app_lastUser');
    if (lastUser) {
        currentUser = lastUser;
        loginContainer.style.display = 'none'; // Hide instead of d-none for Tailwind
        appContent.classList.remove('d-none');
        init(); // Initialize the app for the logged-in user
    } else {
        loginContainer.style.display = 'block';
        appContent.classList.add('d-none');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const enteredUsername = usernameInput.value.trim();

    if (!enteredUsername) {
        loginError.textContent = '아이디를 입력해주세요.';
        loginError.classList.remove('d-none');
        return;
    }

    // Check if account exists
    const storedCategories = localStorage.getItem(`money_app_categories_${enteredUsername}`);
    if (storedCategories === null) {
        loginError.textContent = '존재하지 않는 계정입니다. 회원가입 해주세요.';
        loginError.classList.remove('d-none');
        usernameInput.value = '';
        passwordInput.value = '';
        return;
    }

    currentUser = enteredUsername;
    localStorage.setItem('money_app_lastUser', currentUser);
    
    loginContainer.style.display = 'none';
    appContent.classList.remove('d-none');
    init();
    loginError.classList.add('d-none');
    usernameInput.value = '';
    passwordInput.value = '';
}

function handleSignUp(e) {
    e.preventDefault();
    const enteredUsername = usernameInput.value.trim();

    if (!enteredUsername) {
        loginError.textContent = '사용할 아이디를 입력해주세요.';
        loginError.classList.remove('d-none');
        return;
    }

    const storedCategories = localStorage.getItem(`money_app_categories_${enteredUsername}`);
    if (storedCategories !== null) {
        loginError.textContent = '이미 존재하는 아이디입니다. 로그인해주세요.';
        loginError.classList.remove('d-none');
        return;
    }

    // New user, just log them in. `init` will create default data.
    currentUser = enteredUsername;
    localStorage.setItem('money_app_lastUser', currentUser);
    
    loginContainer.style.display = 'none';
    appContent.classList.remove('d-none');
    init();
    loginError.classList.add('d-none');
    usernameInput.value = '';
    passwordInput.value = '';
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('money_app_lastUser');
    
    transactions = [];
    categories = [];
    budgets = [];
    memos = [];

    appContent.classList.add('d-none');
    loginContainer.style.display = 'block';
    usernameInput.value = '';
    passwordInput.value = '';
}

// --- DATE HELPER ---
function toYYYYMMDD(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function toYYYYMM(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
}


// --- CATEGORY FUNCTIONS ---
function loadCategories() {
    if (!currentUser) return;
    const storedCategories = localStorage.getItem(`money_app_categories_${currentUser}`);
    if (storedCategories) {
        categories = JSON.parse(storedCategories);
    } else {
        categories = [...defaultCategories.income.map(c => ({...c, type: 'income'})), ...defaultCategories.expense.map(c => ({...c, type: 'expense'}))];
        saveCategories();
    }
}
function saveCategories() {
    if (!currentUser) return;
    localStorage.setItem(`money_app_categories_${currentUser}`, JSON.stringify(categories));
}
function getCategoryById(id) { return categories.find(c => c.id === id); }

function addCategory(e) {
    e.preventDefault();
    const isIncome = e.target.id.includes('income');
    const type = isIncome ? 'income' : 'expense';
    const nameInput = isIncome ? newIncomeCategoryName : newExpenseCategoryName;
    const name = nameInput.value.trim();
    if (!name) { alert('카테고리 이름을 입력하세요.'); return; }
    const newCategory = { id: Date.now(), name: name, type: type };
    categories.push(newCategory);
    saveCategories();
    renderCategoryManagementModal();
    updateCategoryDropdowns();
    populateFilterCategoryDropdown();
    nameInput.value = '';
    init();
}
function removeCategory(id) {
    const isUsed = transactions.some(t => t.categoryId === id);
    if (isUsed) { alert('이 카테고리를 사용하는 거래 내역이 있어 삭제할 수 없습니다.'); return; }
    if (confirm('정말 이 카테고리를 삭제하시겠습니까?')) {
        categories = categories.filter(c => c.id !== id);
        budgets = budgets.filter(b => b.categoryId !== id);
        saveCategories();
        saveBudgets();
        renderCategoryManagementModal();
        updateCategoryDropdowns();
        populateFilterCategoryDropdown();
        init();
    }
}
function updateCategory(id) {
    const category = getCategoryById(id);
    const newName = prompt('새 카테고리 이름을 입력하세요:', category.name);
    if (newName && newName.trim() !== '') {
        category.name = newName.trim();
        saveCategories();
        renderCategoryManagementModal();
        updateCategoryDropdowns();
        populateFilterCategoryDropdown();
        init();
    }
}
function renderCategoryManagementModal() {
    incomeCategoryList.innerHTML = '';
    expenseCategoryList.innerHTML = '';
    categories.forEach(c => {
        const listEl = c.type === 'income' ? incomeCategoryList : expenseCategoryList;
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        item.innerHTML = `
            ${c.name}
            <div>
                <button class="btn btn-sm btn-outline-primary" onclick="updateCategory(${c.id})">수정</button>
                <button class="btn btn-sm btn-outline-danger" onclick="removeCategory(${c.id})">삭제</button>
            </div>`;
        listEl.appendChild(item);
    });
}
function updateCategoryDropdowns(type = null) {
    const mainFormType = incomeRadio.checked ? 'income' : 'expense';
    populateCategorySelect(categorySelect, mainFormType);
    const editFormType = type ? type : (editIncomeRadio.checked ? 'income' : 'expense');
    populateCategorySelect(editCategorySelect, editFormType);
}
function populateCategorySelect(selectElement, type) {
    const currentVal = selectElement.value;
    selectElement.innerHTML = '';
    categories.filter(c => c.type === type).forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.name;
        selectElement.appendChild(option);
    });
    selectElement.value = currentVal;
}

function populateFilterCategoryDropdown() {
    filterCategorySelect.innerHTML = '<option value="">모든 카테고리</option>';
    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    const incomeOptGroup = document.createElement('optgroup');
    incomeOptGroup.label = '수입';
    incomeCategories.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.name;
        incomeOptGroup.appendChild(option);
    });
    filterCategorySelect.appendChild(incomeOptGroup);

    const expenseOptGroup = document.createElement('optgroup');
    expenseOptGroup.label = '지출';
    expenseCategories.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.name;
        expenseOptGroup.appendChild(option);
    });
    filterCategorySelect.appendChild(expenseOptGroup);
}

// --- BUDGET FUNCTIONS ---
function loadBudgets() {
    if (!currentUser) return;
    const storedBudgets = localStorage.getItem(`money_app_budgets_${currentUser}`);
    budgets = storedBudgets ? JSON.parse(storedBudgets) : [];
}

function saveBudgets() {
    if (!currentUser) return;
    localStorage.setItem(`money_app_budgets_${currentUser}`, JSON.stringify(budgets));
}

function getBudgetForCategoryAndMonth(categoryId, yearMonth) {
    return budgets.find(b => b.categoryId === categoryId && b.yearMonth === yearMonth);
}

function updateBudget(categoryId, newAmount) {
    const yearMonth = toYYYYMM(viewedDate);
    const existingBudgetIndex = budgets.findIndex(b => b.categoryId === categoryId && b.yearMonth === yearMonth);

    if (existingBudgetIndex > -1) {
        budgets[existingBudgetIndex].amount = newAmount;
    } else {
        budgets.push({ categoryId, yearMonth, amount: newAmount });
    }
    saveBudgets();
    renderBudgetView();
}

function renderBudgetView() {
    budgetListContainer.innerHTML = '';
    const currentYearMonth = toYYYYMM(viewedDate);

    const expenseCategories = categories.filter(c => c.type === 'expense');
    if (expenseCategories.length === 0) {
        budgetListContainer.innerHTML = '<p class="text-muted text-center mt-4">지출 카테고리를 먼저 추가해주세요.</p>';
        return;
    }

    const currentMonthExpenses = transactions.filter(t => t.type === 'expense' && toYYYYMM(t.date) === currentYearMonth);

    expenseCategories.forEach(category => {
        const budget = getBudgetForCategoryAndMonth(category.id, currentYearMonth);
        const budgetedAmount = budget ? budget.amount : 0;
        const actualSpent = currentMonthExpenses
            .filter(t => t.categoryId === category.id)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const remaining = budgetedAmount - actualSpent;

        const budgetItem = document.createElement('div');
        budgetItem.className = 'list-group-item d-flex flex-column mb-3';
        budgetItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5>${category.name}</h5>
                <input type="number" class="form-control budget-input" 
                       data-category-id="${category.id}" 
                       value="${budgetedAmount}" min="0" placeholder="예산 설정 (원)"
                       style="width: 150px;">
            </div>
            <div class="d-flex justify-content-between">
                <span>예산: ${budgetedAmount.toLocaleString()} 원</span>
                <span>지출: ${actualSpent.toLocaleString()} 원</span>
                <span class="${remaining < 0 ? 'text-danger' : 'text-success'}">
                    남은 금액: ${remaining.toLocaleString()} 원
                </span>
            </div>
            <div class="progress mt-2" style="height: 10px;">
                <div class="progress-bar ${actualSpent > budgetedAmount ? 'bg-danger' : 'bg-primary'}" 
                     role="progressbar" 
                     style="width: ${Math.min(100, (actualSpent / budgetedAmount) * 100)}%;" 
                     aria-valuenow="${actualSpent}" 
                     aria-valuemin="0" 
                     aria-valuemax="${budgetedAmount}"></div>
            </div>
        `;
        budgetListContainer.appendChild(budgetItem);
    });
}


// --- MEMO FUNCTIONS ---
function loadMemos() {
    if (!currentUser) return;
    const storedMemos = localStorage.getItem(`money_app_memos_${currentUser}`);
    memos = storedMemos ? JSON.parse(storedMemos) : [];
}

function saveMemos() {
    if (!currentUser) return;
    localStorage.setItem(`money_app_memos_${currentUser}`, JSON.stringify(memos));
}

function addMemo() {
    const memoText = memoInput.value.trim();
    if (memoText === '') {
        alert('메모 내용을 입력해주세요.');
        return;
    }
    const newMemo = { id: Date.now(), text: memoText, date: toYYYYMMDD(new Date()) };
    memos.push(newMemo);
    saveMemos();
    memoInput.value = '';
    renderMemos();
}

function removeMemo(id) {
    if (confirm('정말 이 메모를 삭제하시겠습니까?')) {
        memos = memos.filter(memo => memo.id !== id);
        saveMemos();
        renderMemos();
    }
}

function editMemo(id) {
    const memoToEdit = memos.find(memo => memo.id === id);
    if (!memoToEdit) return;

    const newText = prompt('메모 내용을 수정하세요:', memoToEdit.text);
    if (newText !== null && newText.trim() !== '') {
        memoToEdit.text = newText.trim();
        saveMemos();
        renderMemos();
    }
}

function renderMemos() {
    memoList.innerHTML = '';
    memos.forEach(memo => {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        item.innerHTML = `
            <div>
                <small class="text-muted">${memo.date}</small>
                <p>${memo.text}</p>
            </div>
            <div>
                <button class="btn btn-sm btn-outline-primary memo-edit-btn" onclick="editMemo(${memo.id})">수정</button>
                <button class="memo-delete-btn" onclick="removeMemo(${memo.id})">&times;</button>
            </div>
        `;
        memoList.appendChild(item);
    });
}


// --- TRANSACTION FUNCTIONS ---

function loadTransactions() {
    if (!currentUser) return;
    const storedTransactions = localStorage.getItem(`money_app_transactions_${currentUser}`);
    transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
}
function saveTransactions() {
    if (!currentUser) return;
    localStorage.setItem(`money_app_transactions_${currentUser}`, JSON.stringify(transactions));
}

function addTransaction(e) {
    e.preventDefault();
    if ([description.value, amount.value, dateInput.value, categorySelect.value].some(val => !val || val.trim() === '')) {
        alert('모든 필드를 입력해주세요.'); return;
    }
    const type = incomeRadio.checked ? 'income' : 'expense';
    const newTransaction = { id: Date.now(), description: description.value, amount: type === 'income' ? +amount.value : -Math.abs(amount.value), type: type, date: dateInput.value, categoryId: +categorySelect.value };
    transactions.push(newTransaction);
    saveTransactions();
    init();
    form.reset();
    dateInput.value = toYYYYMMDD(new Date());
    updateCategoryDropdowns();
}

function removeTransaction(id) {
    if (confirm('정말 이 거래 내역을 삭제하시겠습니까?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        dayDetailsModal.modal('hide');
        init();
    }
}

function openEditTransactionModal(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    editTransactionId.value = transaction.id;
    editDate.value = transaction.date;
    editDescription.value = transaction.description;
    editAmount.value = Math.abs(transaction.amount);
    if (transaction.type === 'income') { editIncomeRadio.checked = true; } else { editExpenseRadio.checked = true; }
    populateCategorySelect(editCategorySelect, transaction.type);
    editCategorySelect.value = transaction.categoryId;
    
    $('#search-view').removeClass('active show');
    dayDetailsModal.modal('hide'); 

    editTransactionModal.modal('show');
}

function saveTransactionChanges(e) {
    e.preventDefault();
    const id = +editTransactionId.value;
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    const newType = editIncomeRadio.checked ? 'income' : 'expense';
    transaction.date = editDate.value;
    transaction.description = editDescription.value;
    transaction.amount = newType === 'income' ? +editAmount.value : -Math.abs(editAmount.value);
    transaction.type = newType;
    transaction.categoryId = +editCategorySelect.value;
    saveTransactions();
    editTransactionModal.modal('hide');
    init();
}

// --- RENDER FUNCTIONS ---
function renderSearchResults() {
    let filteredTransactions = [...transactions];

    const searchTerm = searchDescriptionInput.value.toLowerCase();
    const categoryId = filterCategorySelect.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (searchTerm) {
        filteredTransactions = filteredTransactions.filter(t => t.description.toLowerCase().includes(searchTerm));
    }
    if (categoryId) {
        filteredTransactions = filteredTransactions.filter(t => t.categoryId == categoryId);
    }
    if (startDate) {
        filteredTransactions = filteredTransactions.filter(t => t.date >= startDate);
    }
    if (endDate) {
        filteredTransactions = filteredTransactions.filter(t => t.date <= endDate);
    }

    searchResultsContainer.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        searchResultsContainer.innerHTML = '<p class="text-muted text-center mt-4">검색 결과가 없습니다.</p>';
        return;
    }

    const list = document.createElement('ul');
    list.className = 'list-group';
    
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filteredTransactions.forEach(t => {
        const category = getCategoryById(t.categoryId);
        const item = document.createElement('li');
        item.className = `list-group-item ${t.type}`;
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <div>
                    <small class="text-muted">${t.date}</small><br>
                    <span class="badge badge-secondary category-badge">${category ? category.name : '미분류'}</span>
                    <span class="transaction-description">${t.description}</span>
                </div>
                <div class="d-flex align-items-center">
                    <span class="transaction-amount">${(t.amount < 0 ? '' : '+')}${t.amount.toLocaleString()} 원</span>
                    <button class="btn btn-sm btn-outline-primary ml-2 edit-btn" onclick="openEditTransactionModal(${t.id})">수정</button>
                    <button class="delete-btn" onclick="removeTransaction(${t.id})">x</button>
                </div>
            </div>`;
        list.appendChild(item);
    });
    searchResultsContainer.appendChild(list);
}


function showDayDetails(dateString) {
    const dayTransactions = transactions.filter(t => t.date === dateString).sort((a,b) => b.id - a.id);
    dayDetailsModalTitle.textContent = `${dateString} 내역`;
    dayDetailsModalBody.innerHTML = '';

    if (dayTransactions.length === 0) {
        dayDetailsModalBody.innerHTML = '<p class="text-muted text-center">이 날짜에 거래 내역이 없습니다.</p>';
    } else {
        const list = document.createElement('ul');
        list.className = 'list-group';
        dayTransactions.forEach(t => {
            const category = getCategoryById(t.categoryId);
            const item = document.createElement('li');
            item.className = `list-group-item ${t.type}`;
            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <div>
                        <span class="badge badge-secondary category-badge">${category ? category.name : '미분류'}</span>
                        <span class="transaction-description">${t.description}</span>
                    </div>
                    <div class="d-flex align-items-center">
                        <span class="transaction-amount">${(t.amount < 0 ? '' : '+')}${t.amount.toLocaleString()} 원</span>
                        <button class="btn btn-sm btn-outline-primary ml-2 edit-btn" onclick="openEditTransactionModal(${t.id})">수정</button>
                        <button class="delete-btn" onclick="removeTransaction(${t.id})">x</button>
                    </div>
                </div>`;
            list.appendChild(item);
        });
        dayDetailsModalBody.appendChild(list);
    }
    dayDetailsModal.modal('show');
}

function renderWeeklyCalendar() {
    weeklyCalendarContainer.innerHTML = '';
    const year = viewedDate.getFullYear();
    const month = viewedDate.getMonth();
    const day = viewedDate.getDate();

    const startOfWeek = new Date(year, month, day - viewedDate.getDay());
    const endOfWeek = new Date(year, month, day + (6 - viewedDate.getDay()));
    
    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.innerHTML = `
        <button id="prev-week" class="btn btn-sm btn-outline-secondary">&lt;</button>
        <h4>${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}</h4>
        <button id="next-week" class="btn btn-sm btn-outline-secondary">&gt;</button>
    `;
    weeklyCalendarContainer.appendChild(header);

    const dailySummaries = transactions.reduce((acc, t) => {
        if (!acc[t.date]) acc[t.date] = { income: 0, expense: 0 };
        if (t.type === 'income') acc[t.date].income += t.amount;
        else acc[t.date].expense += t.amount;
        return acc;
    }, {});
    
    const weekView = document.createElement('div');
    weekView.className = 'weekly-view';

    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);
        const dateString = toYYYYMMDD(currentDay);
        const summary = dailySummaries[dateString];

        const dayContainer = document.createElement('div');
        dayContainer.className = 'weekly-day card card-body';
        dayContainer.setAttribute('onclick', `showDayDetails('${dateString}')`);

        let content = `<h6>${currentDay.toLocaleDateString('ko-KR', { weekday: 'short', month: 'long', day: 'numeric' })}</h6>`;
        if (summary) {
            if (summary.income > 0) content += `<div class="day-income">+${summary.income.toLocaleString()}</div>`;
            if (summary.expense < 0) content += `<div class="day-expense">${summary.expense.toLocaleString()}</div>`;
        } else {
            content += `<p class="text-muted small">내역 없음</p>`;
        }
        dayContainer.innerHTML = content;
        weekView.appendChild(dayContainer);
    }
    weeklyCalendarContainer.appendChild(weekView);
}

function renderMonthlyCalendar() {
    calendarContainer.innerHTML = '';
    const year = viewedDate.getFullYear();
    const month = viewedDate.getMonth();

    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.innerHTML = `
        <button id="prev-month" class="btn btn-sm btn-outline-secondary">&lt;</button>
        <h4>${year}년 ${month + 1}월</h4>
        <button id="next-month" class="btn btn-sm btn-outline-secondary">&gt;</button>
    `;
    calendarContainer.appendChild(header);

    const dailySummaries = transactions.reduce((acc, t) => {
        if (!acc[t.date]) acc[t.date] = { income: 0, expense: 0 };
        if(t.type === 'income') acc[t.date].income += t.amount; else acc[t.date].expense += t.amount;
        return acc;
    }, {});

    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    days.forEach(day => { grid.innerHTML += `<div class="calendar-day-header">${day}</div>`; });
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) { grid.innerHTML += `<div class="calendar-day empty"></div>`; }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = toYYYYMMDD(date);
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.setAttribute('onclick', `showDayDetails('${dateString}')`);

        let content = `<div class="day-number">${day}</div>`;
        const summary = dailySummaries[dateString];
        if (summary) {
            if (summary.income > 0) content += `<div class="day-income">+${summary.income.toLocaleString()}</div>`;
            if (summary.expense < 0) content += `<div class="day-expense">${summary.expense.toLocaleString()}</div>`;
        }
        dayCell.innerHTML = content;
        grid.appendChild(dayCell);
    }
    
    calendarContainer.appendChild(grid);
}

function updateOverallValues() {
    const total = transactions.reduce((acc, t) => acc + t.amount, 0);
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    balance.innerText = `${total.toLocaleString()} 원`;
    incomeEl.innerText = `${income.toLocaleString()} 원`;
    expenseEl.innerText = `${Math.abs(expense).toLocaleString()} 원`;
}

// --- INITIALIZATION ---
function init() {
    // Reset data arrays before loading
    transactions = [];
    categories = [];
    budgets = [];
    memos = [];

    loadTransactions();
    loadCategories();
    loadBudgets();
    loadMemos();
    dateInput.value = toYYYYMMDD(new Date());
    renderMemos();
    updateOverallValues();
    updateCategoryDropdowns();
    populateFilterCategoryDropdown();
    renderCategoryManagementModal();
    const activeTabId = document.querySelector('.nav-tabs .nav-link.active').id;
    
    $('.nav-tabs a[href="#' + activeTabId.replace('-tab', '-view') + '"]').tab('show');

    switch (activeTabId) {
        case 'monthly-tab': renderMonthlyCalendar(); break;
        case 'weekly-tab': renderWeeklyCalendar(); break;
        case 'search-tab': renderSearchResults(); break;
        case 'budget-tab': renderBudgetView(); break;
        default: renderMonthlyCalendar();
    }
}

// Initial Load & Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
});
loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
signupBtn.addEventListener('click', handleSignUp);

form.addEventListener('submit', addTransaction);
editTransactionForm.addEventListener('submit', saveTransactionChanges);
addIncomeCategoryForm.addEventListener('submit', addCategory);
addExpenseCategoryForm.addEventListener('submit', addCategory);
incomeRadio.addEventListener('change', () => updateCategoryDropdowns());
expenseRadio.addEventListener('change', () => updateCategoryDropdowns());
editIncomeRadio.addEventListener('change', () => populateCategorySelect(editCategorySelect, 'income'));
editExpenseRadio.addEventListener('change', () => populateCategorySelect(editCategorySelect, 'expense'));

document.getElementById('monthly-tab').addEventListener('click', renderMonthlyCalendar);
document.getElementById('weekly-tab').addEventListener('click', renderWeeklyCalendar);
document.getElementById('search-tab').addEventListener('click', renderSearchResults);
document.getElementById('budget-tab').addEventListener('click', renderBudgetView);
document.getElementById('memo-tab').addEventListener('click', renderMemos);


calendarContainer.addEventListener('click', e => {
    if (e.target.id === 'prev-month') {
        viewedDate.setMonth(viewedDate.getMonth() - 1);
        init();
    }
    if (e.target.id === 'next-month') {
        viewedDate.setMonth(viewedDate.getMonth() + 1);
        init();
    }
});

weeklyCalendarContainer.addEventListener('click', e => {
    if (e.target.id === 'prev-week') {
        viewedDate.setDate(viewedDate.getDate() - 7);
        init();
    }
    if (e.target.id === 'next-week') {
        viewedDate.setDate(viewedDate.getDate() + 7);
        init();
    }
});

// Search and Filter Listeners
filterForm.addEventListener('input', renderSearchResults);
clearFiltersBtn.addEventListener('click', () => {
    filterForm.reset();
    renderSearchResults();
});

// Budget Listeners (Delegated)
budgetListContainer.addEventListener('change', e => {
    if (e.target.classList.contains('budget-input')) {
        const categoryId = parseInt(e.target.dataset.categoryId);
        const newAmount = parseInt(e.target.value);
        if (!isNaN(newAmount) && newAmount >= 0) {
            updateBudget(categoryId, newAmount);
        } else {
            alert('유효한 예산 금액을 입력해주세요.');
            e.target.value = getBudgetForCategoryAndMonth(categoryId, toYYYYMM(viewedDate))?.amount || 0;
        }
    }
});

// Memo Listeners
addMemoBtn.addEventListener('click', addMemo);

// When modals are hidden, refresh the calendar behind them
$('body').on('hidden.bs.modal', function () {
    if (!$('.modal.show').length){
        init();
    }
});