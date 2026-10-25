
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Pencil,
  Plus,
  Trash2,
  Wallet
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { transactionAPI } from "../services/api";
import "./Transactions.css";

const emptyForm = {
  type: "expense",
  amount: "",
  category: "Food",
  description: "",
  date: new Date().toLocaleDateString("en-CA")
};

const categories = {
  expense: [
    "Food",
    "Travel",
    "Shopping",
    "Bills",
    "Education",
    "Health",
    "Entertainment",
    "Other"
  ],
  income: [
    "Salary",
    "Freelance",
    "Allowance",
    "Business",
    "Gift",
    "Other"
  ]
};

function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(amount);
}

export default function Transactions() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await transactionAPI.getAll();
      setTransactions(response.transactions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(transaction) {
    setEditingId(transaction._id);

    setForm({
      type: transaction.type,
      amount: String(transaction.amount),
      category: transaction.category,
      description: transaction.description || "",
      date: transaction.date.slice(0, 10)
    });

    setError("");
    setMessage("");
    setShowForm(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "type"
        ? { category: categories[value][0] }
        : {})
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    const payload = {
      type: form.type,
      amount,
      category: form.category,
      description: form.description,
      date: form.date
    };

    try {
      setSaving(true);

      if (editingId) {
        await transactionAPI.update(editingId, payload);
        setMessage("Transaction updated successfully!");
      } else {
        await transactionAPI.create(payload);
        setMessage("Transaction added successfully!");
      }

      setShowForm(false);
      setEditingId(null);
      await loadTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");
      await transactionAPI.delete(id);
      setMessage("Transaction deleted successfully!");
      await loadTransactions();
    } catch (err) {
      setError(err.message);
    }
  }

  const totalIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  const totalExpenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  return (
    <div className="transactions-page">
      <header className="transactions-header">
        <Link to="/dashboard" className="transactions-logo">
          <Wallet size={25} />
          <span>SpendWise</span>
        </Link>

        <button
          className="transactions-back"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={17} />
          Dashboard
        </button>
      </header>

      <main className="transactions-content">
        <div className="transactions-heading">
          <div>
            <span className="transactions-eyebrow">
              MONEY MANAGEMENT
            </span>

            <h1>Transactions</h1>

            <p>
              Manage your income and expenses in one place.
            </p>
          </div>

          <button
            className="transactions-add"
            onClick={openAddForm}
          >
            <Plus size={18} />
            Add Transaction
          </button>
        </div>

        <div className="transactions-summary">
          <div className="transactions-summary-card">
            <span>Total Income</span>
            <strong className="transactions-income">
              {formatMoney(totalIncome)}
            </strong>
          </div>

          <div className="transactions-summary-card">
            <span>Total Expenses</span>
            <strong className="transactions-expense">
              {formatMoney(totalExpenses)}
            </strong>
          </div>

          <div className="transactions-summary-card">
            <span>Balance</span>
            <strong>
              {formatMoney(totalIncome - totalExpenses)}
            </strong>
          </div>
        </div>

        {message && (
          <div className="transactions-success">{message}</div>
        )}

        {error && (
          <div className="transactions-error">{error}</div>
        )}

        {showForm && (
          <section className="transactions-form-card">
            <div className="transactions-form-heading">
              <h2>
                {editingId
                  ? "Edit Transaction"
                  : "New Transaction"}
              </h2>

              <button
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>

            <form
              className="transactions-form"
              onSubmit={handleSubmit}
            >
              <label>
                Type
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>

              <label>
                Amount (₹)
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  {[
                    ...new Set([
                      ...categories[form.type],
                      form.category
                    ])
                  ].map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Date
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="transactions-description">
                Description
                <input
                  name="description"
                  type="text"
                  placeholder="What was this transaction for?"
                  value={form.description}
                  onChange={handleChange}
                />
              </label>

              <button
                type="submit"
                className="transactions-save"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Add Transaction"}
              </button>
            </form>
          </section>
        )}

        <section className="transactions-list-card">
          <div className="transactions-list-heading">
            <h2>Transaction History</h2>
            <span>{transactions.length} transactions</span>
          </div>

          {loading ? (
            <p className="transactions-empty">
              Loading transactions...
            </p>
          ) : transactions.length === 0 ? (
            <p className="transactions-empty">
              No transactions yet. Add your first one!
            </p>
          ) : (
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <div
                  className="transactions-item"
                  key={transaction._id}
                >
                  <div
                    className={
                      transaction.type === "income"
                        ? "transactions-item-icon income"
                        : "transactions-item-icon expense"
                    }
                  >
                    {transaction.type === "income" ? (
                      <ArrowDownRight size={20} />
                    ) : (
                      <ArrowUpRight size={20} />
                    )}
                  </div>

                  <div className="transactions-item-details">
                    <strong>{transaction.category}</strong>
                    <p>
                      {transaction.description ||
                        "No description"}
                    </p>
                    <small>
                      {transaction.date.slice(0, 10)}
                    </small>
                  </div>

                  <strong
                    className={
                      transaction.type === "income"
                        ? "transactions-income"
                        : "transactions-expense"
                    }
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatMoney(transaction.amount)}
                  </strong>

                  <div className="transactions-actions">
                    <button
                      title="Edit transaction"
                      onClick={() => openEditForm(transaction)}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      title="Delete transaction"
                      onClick={() =>
                        handleDelete(transaction._id)
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
