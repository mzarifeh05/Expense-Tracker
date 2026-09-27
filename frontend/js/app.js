// Expense Tracker - frontend logic

const API_URL = "http://localhost:3000/api/expenses";

// Bootstrap badge class per category, so it's easy to see the category at a glance.
const categoryBadgeClass = {
  Food: "bg-success",
  Transport: "bg-primary",
  Bills: "bg-warning text-dark",
  Entertainment: "bg-info text-dark",
  Other: "bg-secondary"
};

// Holds the full list returned by the API, so the category filter can
// re-render without a network round trip.
let allExpenses = [];

// Elements
const expenseForm = document.getElementById("expenseForm");
const expenseIdInput = document.getElementById("expenseId");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const submitBtn = document.getElementById("submitBtn");
const submitBtnText = document.getElementById("submitBtnText");
const submitSpinner = document.getElementById("submitSpinner");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const categoryFilter = document.getElementById("categoryFilter");
const expensesBody = document.getElementById("expensesBody");
const alertPlaceholder = document.getElementById("alertPlaceholder");

const summaryTotal = document.getElementById("summaryTotal");
const summaryCount = document.getElementById("summaryCount");
const summaryHighest = document.getElementById("summaryHighest");
const summaryHighestTitle = document.getElementById("summaryHighestTitle");

// --- API calls ---

async function getExpenses() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch expenses.");
  }

  return response.json();
}

async function addExpense(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Failed to add expense.");
  }

  return response.json();
}

async function updateExpense(id, data) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Failed to update expense.");
  }

  return response.json();
}

async function deleteExpense(id) {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Failed to delete expense.");
  }

  return response.json();
}

// --- Rendering ---

function renderTable(list) {
  expensesBody.innerHTML = "";

  if (list.length === 0) {
    expensesBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">No expenses found.</td>
      </tr>
    `;
    return;
  }

  list.forEach((expense) => {
    const row = document.createElement("tr");
    const badgeClass = categoryBadgeClass[expense.category] || "bg-secondary";

    row.innerHTML = `
      <td>${expense.title}</td>
      <td class="text-end">${expense.amount.toFixed(2)}</td>
      <td><span class="badge ${badgeClass}">${expense.category}</span></td>
      <td>${expense.date}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-secondary edit-btn" data-id="${expense.id}">Edit</button>
        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${expense.id}">Delete</button>
      </td>
    `;

    expensesBody.appendChild(row);
  });
}

function renderSummary(list) {
  const total = list.reduce((sum, expense) => sum + expense.amount, 0);

  summaryTotal.textContent = total.toFixed(2);
  summaryCount.textContent = list.length;

  if (list.length === 0) {
    summaryHighest.textContent = "0.00";
    summaryHighestTitle.textContent = "-";
    return;
  }

  const highest = list.reduce((max, expense) =>
    expense.amount > max.amount ? expense : max
  );

  summaryHighest.textContent = highest.amount.toFixed(2);
  summaryHighestTitle.textContent = highest.title;
}

function showAlert(message) {
  alertPlaceholder.innerHTML = `
    <div class="alert alert-danger alert-dismissible fade show mt-3" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

function showTableLoading() {
  expensesBody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center">
        <div class="spinner-border spinner-border-sm" role="status"></div>
      </td>
    </tr>
  `;
}

// --- Filtering ---

function applyFilter() {
  const selected = categoryFilter.value;

  const filtered = selected === "All"
    ? allExpenses
    : allExpenses.filter((expense) => expense.category === selected);

  renderTable(filtered);
}

// --- Refresh (single source of truth: always re-fetch from the server) ---

async function refresh() {
  showTableLoading();

  try {
    allExpenses = await getExpenses();
    renderSummary(allExpenses);
    applyFilter();
  } catch (err) {
    showAlert(err.message);
    expensesBody.innerHTML = "";
  }
}

// --- Form handling ---

function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  submitSpinner.classList.toggle("d-none", !isSubmitting);
}

function resetForm() {
  expenseForm.reset();
  expenseIdInput.value = "";
  submitBtnText.textContent = "Add expense";
  cancelEditBtn.classList.add("d-none");
}

function enterEditMode(expense) {
  expenseIdInput.value = expense.id;
  titleInput.value = expense.title;
  amountInput.value = expense.amount;
  categoryInput.value = expense.category;
  dateInput.value = expense.date;
  submitBtnText.textContent = "Update expense";
  cancelEditBtn.classList.remove("d-none");
  titleInput.focus();
}

expenseForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = {
    title: titleInput.value,
    amount: amountInput.value,
    category: categoryInput.value,
    date: dateInput.value
  };

  const editingId = expenseIdInput.value;

  setSubmitting(true);

  try {
    if (editingId) {
      await updateExpense(editingId, data);
    } else {
      await addExpense(data);
    }

    resetForm();
    await refresh();
  } catch (err) {
    showAlert(err.message);
  } finally {
    setSubmitting(false);
  }
});

cancelEditBtn.addEventListener("click", resetForm);

categoryFilter.addEventListener("change", applyFilter);

expensesBody.addEventListener("click", async (event) => {
  const editBtn = event.target.closest(".edit-btn");
  const deleteBtn = event.target.closest(".delete-btn");

  if (editBtn) {
    const id = editBtn.dataset.id;
    const expense = allExpenses.find((item) => String(item.id) === id);

    if (expense) {
      enterEditMode(expense);
    }

    return;
  }

  if (deleteBtn) {
    const id = deleteBtn.dataset.id;

    if (!confirm("Delete this expense?")) {
      return;
    }

    try {
      await deleteExpense(id);
      await refresh();
    } catch (err) {
      showAlert(err.message);
    }
  }
});

// --- Init ---

refresh();