
import { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  LogOut,
  RefreshCw
} from "lucide-react";

import {
  dashboardAPI,
  transactionAPI,
  removeToken
} from "../services/api";

import "./Dashboard.css";

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(amount);

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [summaryResponse, transactionResponse] =
        await Promise.all([
          dashboardAPI.getSummary(),
          transactionAPI.getAll()
        ]);

      setSummary(summaryResponse.summary);
      setTransactions(transactionResponse.transactions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function handleLogout() {
    removeToken();
    window.location.href = "/";
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <Wallet size={25} />
          <span>SpendWise</span>
        </div>

        <button
          className="dashboard-logout"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-heading">
          <div>
            <span className="dashboard-eyebrow">
              FINANCIAL OVERVIEW
            </span>

            <h1>Your Dashboard</h1>

            <p>
              Track your money and stay in control
              of your finances.
            </p>
          </div>

          <button
            className="dashboard-refresh"
            onClick={loadDashboard}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {loading && (
          <p className="dashboard-status">
            Loading your financial data...
          </p>
        )}

        {error && (
          <p className="dashboard-error">
            {error}
          </p>
        )}

        {!loading && summary && (
          <>
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <div className="dashboard-card-top">
                  <span>Total Balance</span>
                  <Wallet size={21} />
                </div>

                <h2>{formatMoney(summary.balance)}</h2>
                <p>Income minus expenses</p>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-top">
                  <span>Total Income</span>
                  <TrendingUp size={21} />
                </div>

                <h2 className="dashboard-income">
                  {formatMoney(summary.totalIncome)}
                </h2>
                <p>All recorded income</p>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-top">
                  <span>Total Expenses</span>
                  <TrendingDown size={21} />
                </div>

                <h2 className="dashboard-expense">
                  {formatMoney(summary.totalExpenses)}
                </h2>
                <p>All recorded expenses</p>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-top">
                  <span>Transactions</span>
                  <ArrowLeftRight size={21} />
                </div>

                <h2>{summary.transactionCount}</h2>
                <p>Total recorded transactions</p>
              </div>
            </div>

            <section className="dashboard-section">
              <h2>Recent Transactions</h2>

              {transactions.length === 0 ? (
                <p className="dashboard-empty">
                  No transactions yet.
                </p>
              ) : (
                <div className="dashboard-transaction-list">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      className="dashboard-transaction"
                      key={transaction._id}
                    >
                      <div>
                        <strong>{transaction.category}</strong>
                        <p>
                          {transaction.description ||
                            "No description"}
                        </p>
                      </div>

                      <span
                        className={
                          transaction.type === "income"
                            ? "dashboard-income"
                            : "dashboard-expense"
                        }
                      >
                        {transaction.type === "income"
                          ? "+"
                          : "-"}
                        {formatMoney(transaction.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
