
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Wallet,
  Target,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { budgetAPI } from "../services/api";
import "./Budgets.css";

const categories = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Education",
  "Health",
  "Entertainment",
  "Other"
];

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(amount);

const currentDate = new Date();

function createEmptyForm(month, year) {
  return {
    category: "Food",
    amount: "",
    month,
    year
  };
}

export default function Budgets() {
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear()
  );

  const [budgets, setBudgets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(
    createEmptyForm(
      currentDate.getMonth() + 1,
      currentDate.getFullYear()
    )
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await budgetAPI.getAll(
        selectedMonth,
        selectedYear
      );

      setBudgets(response.budgets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  function openAddForm() {
    setEditingId(null);
    setForm(createEmptyForm(selectedMonth, selectedYear));
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(budget) {
    setEditingId(budget.id);

    setForm({
      category: budget.category,
      amount: String(budget.amount),
      month: budget.month,
      year: budget.year
    });

    setError("");
    setMessage("");
    setShowForm(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid budget amount greater than zero.");
      return;
    }

    const payload = {
      category: form.category,
      amount,
      month: Number(form.month),
      year: Number(form.year)
    };

    try {
      setSaving(true);

      if (editingId) {
        await budgetAPI.update(editingId, payload);
        setMessage("Budget updated successfully!");
      } else {
        await budgetAPI.create(payload);
        setMessage("Budget created successfully!");
      }

      setShowForm(false);
      setEditingId(null);

      await loadBudgets();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this budget?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await budgetAPI.delete(id);

      setMessage("Budget deleted successfully!");
      await loadBudgets();
    } catch (err) {
      setError(err.message);
    }
  }

  const totalLimit = budgets.reduce(
    (total, budget) => total + budget.amount,
    0
  );

  const totalSpent = budgets.reduce(
    (total, budget) => total + budget.spent,
    0
  );

  const totalRemaining = totalLimit - totalSpent;

  const monthName = new Date(
    selectedYear,
    selectedMonth - 1,
    1
  ).toLocaleString("en-IN", { month: "long" });

  return (
    <div className="budgets-page">
      <header className="budgets-header">
        <Link to="/dashboard" className="budgets-logo">
          <Wallet size={25} />
          <span>SpendWise</span>
        </Link>

        <Link to="/dashboard" className="budgets-back">
          <ArrowLeft size={17} />
          Dashboard
        </Link>
      </header>

      <main className="budgets-content">
        <div className="budgets-heading">
          <div>
            <span className="budgets-eyebrow">
              FINANCIAL PLANNING
            </span>

            <h1>Monthly Budgets</h1>

            <p>
              Set spending limits and track your progress.
            </p>
          </div>

          <button
            className="budgets-add"
            onClick={openAddForm}
          >
            <Plus size={18} />
            Add Budget
          </button>
        </div>

        <div className="budgets-filter">
          <label>
            Month
            <select
              value={selectedMonth}
              onChange={(event) => {
                setSelectedMonth(Number(event.target.value));
                setShowForm(false);
                setMessage("");
              }}
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {new Date(2026, index, 1).toLocaleString(
                    "en-IN",
                    { month: "long" }
                  )}
                </option>
              ))}
            </select>
          </label>

          <label>
            Year
            <input
              type="number"
              min="2000"
              max="2100"
              value={selectedYear}
              onChange={(event) => {
                setSelectedYear(Number(event.target.value));
                setShowForm(false);
                setMessage("");
              }}
            />
          </label>

          <span className="budgets-period">
            Viewing {monthName} {selectedYear}
          </span>
        </div>

        <div className="budgets-summary">
          <div className="budgets-summary-card">
            <span>Total Budget</span>
            <strong>{formatMoney(totalLimit)}</strong>
          </div>

          <div className="budgets-summary-card">
            <span>Total Spent</span>
            <strong className="budgets-spent">
              {formatMoney(totalSpent)}
            </strong>
          </div>

          <div className="budgets-summary-card">
            <span>Remaining</span>
            <strong
              className={
                totalRemaining < 0 ? "budgets-danger" : ""
              }
            >
              {formatMoney(totalRemaining)}
            </strong>
          </div>
        </div>

        {message && (
          <div className="budgets-success">{message}</div>
        )}

        {error && (
          <div className="budgets-error">{error}</div>
        )}

        {showForm && (
          <section className="budgets-form-card">
            <div className="budgets-form-heading">
              <h2>
                {editingId ? "Edit Budget" : "New Budget"}
              </h2>

              <button
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>

            <form
              className="budgets-form"
              onSubmit={handleSubmit}
            >
              <label>
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  {[...new Set([...categories, form.category])].map(
                    (category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                Monthly Limit (₹)
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter budget amount"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </label>

              <div className="budgets-form-period">
                Budget period: {monthName} {selectedYear}
              </div>

              <button
                className="budgets-save"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Create Budget"}
              </button>
            </form>
          </section>
        )}

        <section className="budgets-list-card">
          <div className="budgets-list-heading">
            <h2>Category Budgets</h2>
            <span>{budgets.length} budgets</span>
          </div>

          {loading ? (
            <p className="budgets-empty">
              Loading your budgets...
            </p>
          ) : budgets.length === 0 ? (
            <div className="budgets-empty-state">
              <Target size={36} />
              <h3>No budgets for this month</h3>
              <p>
                Create a budget to start tracking your spending.
              </p>
            </div>
          ) : (
            <div className="budgets-list">
              {budgets.map((budget) => {
                const progress = Math.min(
                  Math.max(budget.percentageUsed, 0),
                  100
                );

                return (
                  <div className="budgets-item" key={budget.id}>
                    <div className="budgets-item-top">
                      <div>
                        <h3>{budget.category}</h3>
                        <p>
                          {formatMoney(budget.spent)} spent of{" "}
                          {formatMoney(budget.amount)}
                        </p>
                      </div>

                      <div className="budgets-actions">
                        <button
                          title="Edit budget"
                          onClick={() => openEditForm(budget)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          title="Delete budget"
                          onClick={() => handleDelete(budget.id)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>

                    <div className="budgets-progress-track">
                      <div
                        className={
                          budget.exceeded
                            ? "budgets-progress-fill exceeded"
                            : "budgets-progress-fill"
                        }
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="budgets-item-bottom">
                      <span>
                        {budget.percentageUsed}% used
                      </span>

                      <span
                        className={
                          budget.remaining < 0
                            ? "budgets-danger"
                            : ""
                        }
                      >
                        {formatMoney(budget.remaining)} remaining
                      </span>
                    </div>

                    {budget.exceeded && (
                      <p className="budgets-warning">
                        <AlertTriangle size={16} />
                        You have exceeded this budget!
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
