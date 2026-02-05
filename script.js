// --- Globals ---
const API_BASE_URL = 'http://localhost:5001'; // The Flask server URL

// --- DOM Elements ---
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const loginContainer = document.getElementById('login-container');
const signupBtn = document.getElementById('signup-btn');
const appContent = document.getElementById('app-content');
const logoutBtn = document.getElementById('logout-btn');

// Other app-content elements
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

// Category Modal Elements
const incomeCategoryList = document.getElementById('income-category-list');
const expenseCategoryList = document.getElementById('expense-category-list');
const addIncomeCategoryForm = document.getElementById('add-income-category-form');
const addExpenseCategoryForm = document.getElementById('add-expense-category-form');
const newIncomeCategoryName = document.getElementById('new-income-category-name');
const newExpenseCategoryName = document.getElementById('new-expense-category-name');

// Edit Transaction Modal Elements
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

// Savings Elements
const savingsBalance = document.getElementById('savings-balance');
const savingsList = document.getElementById('savings-list');
const savingsModal = $('#savings-modal');
const savingsForm = document.getElementById('savings-form');
const savingsId = document.getElementById('savings-id');
const savingsName = document.getElementById('savings-name');
const savingsAmount = document.getElementById('savings-amount');
const savingsGoal = document.getElementById('savings-goal');
const cancelSavingsEditBtn = document.getElementById('cancel-savings-edit');
const savingsListModal = document.getElementById('savings-list-modal');
const addSavingsBtn = document.getElementById('add-savings-btn');

// --- APP STATE ---
let transactions = [];
let categories = [];
let budgets = [];
let memos = [];
let savings = [];
let viewedDate = new Date();
let isLoggedIn = false;

// --- API HELPERS ---
// Generic fetch helper to include credentials
async function apiFetch(endpoint, options = {}) {
    const defaultOptions = {
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for sending cookies
    };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...defaultOptions, ...options });
    if (!response.ok) {
        // Try to parse error from backend, otherwise use status text
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { error: response.statusText };
        }
        throw new Error(errorData.error || 'API 요청에 실패했습니다.');
    }
    // Handle cases with no content in response
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return {}; // Return empty object for non-json responses
}


// --- LOGIN/LOGOUT LOGIC ---
async function checkLoginStatus() {
    try {
        await apiFetch('/api/auth/me');
        isLoggedIn = true;
        loginContainer.style.display = 'none';
        appContent.classList.remove('d-none');
        init();
    } catch (error) {
        isLoggedIn = false;
        loginContainer.style.display = 'block';
        appContent.classList.add('d-none');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    try {
        const payload = {
            username: usernameInput.value,
            password: passwordInput.value,
        };
        const data = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        loginError.classList.add('d-none');
        await checkLoginStatus(); // Re-check status to init the app
    } catch (error) {
        loginError.textContent = error.message;
        loginError.classList.remove('d-none');
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    try {
        const payload = {
            username: usernameInput.value,
            password: passwordInput.value,
        };
        const data = await apiFetch('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        // After successful signup, attempt to log in
        await handleLogin(e);
    } catch (error) {
        loginError.textContent = error.message;
        loginError.classList.remove('d-none');
    }
}

async function handleLogout() {
    try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
        window.location.reload(); // Easiest way to reset state
    } catch (error) {
        alert('로그아웃 실패: ' + error.message);
    }
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


// --- DATA LOADING & SAVING ---
async function loadAllData() {
    try {
        [transactions, categories, budgets, memos, savings] = await Promise.all([
            apiFetch('/api/transactions'),
            apiFetch('/api/categories'),
            apiFetch('/api/budgets'),
            apiFetch('/api/memos'),
            apiFetch('/api/savings')
        ]);
    } catch (error) {
        console.error('데이터 로딩 실패:', error);
        if (error.message.includes('404')) {
            // If savings endpoint doesn't exist, just continue without it
            [transactions, categories, budgets, memos] = await Promise.all([
                apiFetch('/api/transactions'),
                apiFetch('/api/categories'),
                apiFetch('/api/budgets'),
                apiFetch('/api/memos')
            ]);
            savings = [];
        } else {
            alert('데이터를 불러오는 데 실패했습니다. 다시 로그인해주세요.');
            handleLogout();
        }
    }
}

async function addTransaction(e) {
    e.preventDefault();
    const payload = {
        description: description.value,
        amount: incomeRadio.checked ? +amount.value : -Math.abs(amount.value),
        type: incomeRadio.checked ? 'income' : 'expense',
        date: dateInput.value,
        category_id: +categorySelect.value,
    };

    if (!payload.description || !payload.amount || !payload.date || !payload.category_id) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
    try {
        await apiFetch('/api/transactions', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        form.reset();
        dateInput.value = toYYYYMMDD(new Date());
        await init();
    } catch (error) {
        alert('내역 추가 실패: ' + error.message);
    }
}

async function removeTransaction(id) {
    if (confirm('정말 이 거래 내역을 삭제하시겠습니까?')) {
        try {
            await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
            dayDetailsModal.modal('hide');
            await init();
        } catch (error) {
            alert('삭제 실패: ' + error.message);
        }
    }
}

async function saveTransactionChanges(e) {
    e.preventDefault();
    const id = +editTransactionId.value;
    const payload = {
        description: editDescription.value,
        amount: editIncomeRadio.checked ? +editAmount.value : -Math.abs(editAmount.value),
        type: editIncomeRadio.checked ? 'income' : 'expense',
        date: editDate.value,
        category_id: +editCategorySelect.value,
    };
    
    try {
        await apiFetch(`/api/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        editTransactionModal.modal('hide');
        await init();
    } catch (error) {
        alert('저장 실패: ' + error.message);
    }
}


// --- UI & RENDER FUNCTIONS --- (Largely unchanged, but depend on async loaded data)

function updateOverallValues() {
    const total = transactions.reduce((acc, t) => acc + t.amount, 0);
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    balance.innerText = `${total.toLocaleString()} 원`;
    incomeEl.innerText = `${income.toLocaleString()} 원`;
    expenseEl.innerText = `${Math.abs(expense).toLocaleString()} 원`;
}

function renderUI() {
    dateInput.value = toYYYYMMDD(new Date());
    renderMemos();
    renderSavings();
    updateOverallValues();
    updateCategoryDropdowns();
    populateFilterCategoryDropdown();
    renderCategoryManagementModal();
    renderMonthlyCalendar();
}


// --- INITIALIZATION ---
async function init() {
    await loadAllData();
    renderUI();
}

// Initial Load & Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
});
loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
signupBtn.addEventListener('click', handleSignUp);

form.addEventListener('submit', addTransaction);
editTransactionForm.addEventListener('submit', saveTransactionChanges);
savingsForm.addEventListener('submit', handleSavingsSubmit);
cancelSavingsEditBtn.addEventListener('click', resetSavingsForm);
addSavingsBtn.addEventListener('click', () => {
    resetSavingsForm();
    savingsModal.modal('show');
});

// Other listeners remain the same for now, they trigger functions that will be refactored
// or call init() which now re-fetches data.


// Helper functions that are mostly UI logic and remain unchanged
function getCategoryById(id) { return categories.find(c => c.id === id); }
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
                <button class="btn btn-sm btn-outline-primary memo-edit-btn" onclick="editMemo(${memo.id})">&times;</button>
                <button class="memo-delete-btn" onclick="removeMemo(${memo.id})">&times;</button>
            </div>
        `;
        memoList.appendChild(item);
    });
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
function updateCategoryDropdowns(type = null) {
    const mainFormType = incomeRadio.checked ? 'income' : 'expense';
    populateCategorySelect(categorySelect, mainFormType);
    const editFormType = type ? type : (editIncomeRadio.checked ? 'income' : 'expense');
    populateCategorySelect(editCategorySelect, editFormType);
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

document.getElementById('monthly-tab').addEventListener('click', renderMonthlyCalendar);
// ... other similar event listeners

// --- Savings Functions ---
function renderSavings() {
    // Update total savings balance
    const totalSavings = savings.reduce((acc, s) => acc + s.amount, 0);
    savingsBalance.innerText = `${totalSavings.toLocaleString()} 원`;

    // Render savings in the main tab
    savingsList.innerHTML = '';
    savings.forEach(s => {
        const item = document.createElement('div');
        item.className = 'list-group-item';
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${s.name}</h5>
                <small>${new Date(s.last_updated).toLocaleDateString()}</small>
            </div>
            <p class="mb-1">현재 잔액: ${s.amount.toLocaleString()} 원</p>
            ${s.goal ? `<p class="mb-1">목표 금액: ${s.goal.toLocaleString()} 원</p>` : ''}
        `;
        savingsList.appendChild(item);
    });
    
    // Render savings in the modal list
    savingsListModal.innerHTML = '';
    savings.forEach(s => {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        item.innerHTML = `
            <div>
                <strong>${s.name}</strong>: ${s.amount.toLocaleString()} 원
            </div>
            <div>
                <button class="btn btn-sm btn-outline-primary" onclick="editSavings(${s.id})">수정</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteSavings(${s.id})">삭제</button>
            </div>
        `;
        savingsListModal.appendChild(item);
    });
}

async function handleSavingsSubmit(e) {
    e.preventDefault();
    const id = savingsId.value;
    const payload = {
        name: savingsName.value,
        amount: +savingsAmount.value,
        goal: savingsGoal.value ? +savingsGoal.value : null
    };

    if (!payload.name || !payload.amount) {
        alert('적금 이름과 현재 잔액을 입력해주세요.');
        return;
    }

    try {
        if (id) {
            // Update existing saving
            await apiFetch(`/api/savings/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
        } else {
            // Add new saving
            await apiFetch('/api/savings', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        }
        resetSavingsForm();
        await init();
    } catch (error) {
        alert('적금 저장 실패: ' + error.message);
    }
}

function editSavings(id) {
    const saving = savings.find(s => s.id === id);
    if (!saving) return;

    savingsId.value = saving.id;
    savingsName.value = saving.name;
    savingsAmount.value = saving.amount;
    savingsGoal.value = saving.goal;
    
    cancelSavingsEditBtn.classList.remove('d-none');
}

async function deleteSavings(id) {
    if (confirm('정말 이 적금 내역을 삭제하시겠습니까?')) {
        try {
            await apiFetch(`/api/savings/${id}`, { method: 'DELETE' });
            await init();
        } catch (error) {
            alert('적금 삭제 실패: ' + error.message);
        }
    }
}

function resetSavingsForm() {
    savingsForm.reset();
    savingsId.value = '';
    cancelSavingsEditBtn.classList.add('d-none');
}
