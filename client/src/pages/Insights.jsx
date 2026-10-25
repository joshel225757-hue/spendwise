
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Lightbulb,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

import {
  dashboardAPI,
  transactionAPI,
  budgetAPI
} from "../services/api";

import "./Insights.css";

const COLORS = [
  "#4ade80",
  "#60a5fa",
  "#fbbf24",
  "#c084fc",
  "#fb7185",
  "#2dd4bf",
  "#fb923c",
  "#a3e635"
];

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  })}`;

function Insights() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  async function loadInsights() {
    setLoading(true);
    setError("");

    try {
      const [summaryResult, transactionsResult, budgetsResult] =
        await Promise.all([
          dashboardAPI.getSummary(),
          transactionAPI.getAll(),
          budgetAPI.getAll(currentMonth, currentYear)
        ]);

      setSummary(summaryResult.summary || {});
      setTransactions(
        Array.isArray(transactionsResult)
          ? transactionsResult
          : transactionsResult.transactions || []
      );
      setBudgets(
        Array.isArray(budgetsResult)
          ? budgetsResult
          : budgetsResult.budgets || []
      );
    } catch (err) {
      setError(err.message || "Unable to load insights");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInsights();
  }, []);

  const income = Number(summary?.totalIncome || 0);
  const expenses = Number(summary?.totalExpenses || 0);
  const balance = Number(summary?.balance || 0);

  const incomeExpenseData = [
    { name: "Income", amount: income },
    { name: "Expenses", amount: expenses }
  ];

  const categoryTotals = {};

  transactions.forEach((transaction) => {
    if (transaction.type !== "expense") return;

    const category = transaction.category || "Other";

    categoryTotals[category] =
      (categoryTotals[category] || 0) +
      Number(transaction.amount || 0);
  });

  const categoryData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const monthlyTotals = {};

  transactions.forEach((transaction) => {
    if (!transaction.date) return;

    const date = new Date(transaction.date);
    if (Number.isNaN(date.getTime())) return;

    const key = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!monthlyTotals[key]) {
      monthlyTotals[key] = {
        month: key,
        income: 0,
        expenses: 0
      };
    }

    const amount = Number(transaction.amount || 0);

    if (transaction.type === "income") {
      monthlyTotals[key].income += amount;
    } else if (transaction.type === "expense") {
      monthlyTotals[key].expenses += amount;
    }
  });

  const monthlyData = Object.values(monthlyTotals)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
    .map((item) => ({
      ...item,
      label: new Date(
        `${item.month}-01T00:00:00`
      ).toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit"
      })
    }));

  const exceededBudgets = budgets.filter(
    (budget) => Number(budget.spent || 0) >
      Number(budget.amount || 0)
  );

  const nearLimitBudgets = budgets.filter((budget) => {
    const amount = Number(budget.amount || 0);
    const spent = Number(budget.spent || 0);

    return amount > 0 &&
      spent >= amount * 0.8 &&
      spent <= amount;
  });

  const topCategory = categoryData[0];

  const suggestions = [];

  if (expenses > income && (income > 0 || expenses > 0)) {
    suggestions.push({
      title: "Spending exceeds income",
      description:
        "Your recorded expenses are higher than your income. Review your spending to improve your balance.",
      warning: true
    });
  }

  exceededBudgets.forEach((budget) => {
    suggestions.push({
      title: `${budget.category} budget exceeded`,
      description: `You have spent ${money(
        budget.spent
      )} against a budget of ${money(budget.amount)}.`,
      warning: true
    });
  });

  nearLimitBudgets.forEach((budget) => {
    suggestions.push({
      title: `${budget.category} budget almost reached`,
      description: `You've used ${Math.round(
        Number(budget.percentageUsed || 0)
      )}% of this month's budget.`,
      warning: true
    });
  });

  if (topCategory) {
    suggestions.push({
      title: `Highest spending: ${topCategory.name}`,
      description: `Your largest recorded expense category is ${
        topCategory.name
      }, totaling ${money(topCategory.value)}.`,
      warning: false
    });
  }

  if (!transactions.length) {
    suggestions.push({
      title: "Start tracking your finances",
      description:
        "Add your first transaction to unlock spending patterns and personalized financial insights.",
      warning: false
    });
  } else if (!suggestions.length) {
    suggestions.push({
      title: "Your finances are looking steady",
      description:
        "No budget warnings were detected in your current records. Keep tracking your income and expenses.",
      warning: false
    });
  }

  return (
    <div className="insights-page">
      <div className="insights-heading">
        <div>
          <span className="insights-eyebrow">
            FINANCIAL ANALYTICS
          </span>
          <h1>Spending Insights</h1>
          <p>
            Understand your money and make smarter
            financial decisions.
          </p>
        </div>

        <button
          className="insights-refresh"
          onClick={loadInsights}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="insights-error">{error}</div>
      )}

      {loading ? (
        <div className="insights-loading">
          Loading your financial insights...
        </div>
      ) : (
        <>
          <div className="insights-stats">
            <div className="insights-stat-card">
              <div className="insights-stat-label">
                <span>Total Income</span>
                <TrendingUp size={20} />
              </div>
              <strong>{money(income)}</strong>
              <small>All recorded income</small>
            </div>

            <div className="insights-stat-card">
              <div className="insights-stat-label">
                <span>Total Expenses</span>
                <TrendingDown size={20} />
              </div>
              <strong>{money(expenses)}</strong>
              <small>All recorded expenses</small>
            </div>

            <div className="insights-stat-card">
              <div className="insights-stat-label">
                <span>Current Balance</span>
                <Wallet size={20} />
              </div>
              <strong>{money(balance)}</strong>
              <small>Income minus expenses</small>
            </div>

            <div className="insights-stat-card">
              <div className="insights-stat-label">
                <span>Active Budgets</span>
                <Target size={20} />
              </div>
              <strong>{budgets.length}</strong>
              <small>This month's budgets</small>
            </div>
          </div>

          <div className="insights-chart-grid">
            <section className="insights-panel">
              <div className="insights-panel-heading">
                <h2>Income vs Expenses</h2>
                <p>Overall financial comparison</p>
              </div>

              {income === 0 && expenses === 0 ? (
                <div className="insights-empty">
                  Add transactions to display this chart.
                </div>
              ) : (
                <div className="insights-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeExpenseData}>
                      <CartesianGrid
                        stroke="#29313d"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#8793a5"
                      />
                      <YAxis
                        stroke="#8793a5"
                        tickFormatter={(value) =>
                          `₹${value}`
                        }
                      />
                      <Tooltip
                        formatter={(value) => money(value)}
                        contentStyle={{
                          background: "#1a202b",
                          border: "1px solid #343c49",
                          borderRadius: "10px",
                          color: "#fff"
                        }}
                      />
                      <Bar
                        dataKey="amount"
                        radius={[7, 7, 0, 0]}
                      >
                        {incomeExpenseData.map((item, index) => (
                          <Cell
                            key={item.name}
                            fill={
                              index === 0
                                ? "#4ade80"
                                : "#fb7185"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="insights-panel">
              <div className="insights-panel-heading">
                <h2>Spending by Category</h2>
                <p>Distribution of your expenses</p>
              </div>

              {categoryData.length === 0 ? (
                <div className="insights-empty">
                  No expenses recorded yet.
                </div>
              ) : (
                <div className="insights-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {categoryData.map((item, index) => (
                          <Cell
                            key={item.name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => money(value)}
                        contentStyle={{
                          background: "#1a202b",
                          border: "1px solid #343c49",
                          borderRadius: "10px",
                          color: "#fff"
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          fontSize: "12px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          <section className="insights-panel insights-wide-panel">
            <div className="insights-panel-heading">
              <h2>Monthly Financial Trends</h2>
              <p>
                Income and expenses across your latest
                six recorded months
              </p>
            </div>

            {monthlyData.length === 0 ? (
              <div className="insights-empty">
                Monthly trends will appear after you add transactions.
              </div>
            ) : (
              <div className="insights-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid
                      stroke="#29313d"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="#8793a5"
                    />
                    <YAxis
                      stroke="#8793a5"
                    />
                    <Tooltip
                      formatter={(value) => money(value)}
                      contentStyle={{
                        background: "#1a202b",
                        border: "1px solid #343c49",
                        borderRadius: "10px",
                        color: "#fff"
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="#4ade80"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      fill="#fb7185"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="insights-panel insights-wide-panel">
            <div className="insights-panel-heading">
              <h2>
                <Lightbulb size={21} />
                Smart Financial Insights
              </h2>
              <p>
                Suggestions based on your recorded financial data
              </p>
            </div>

            <div className="insights-suggestions">
              {suggestions.map((item, index) => (
                <div
                  key={index}
                  className={`insights-suggestion ${
                    item.warning
                      ? "insights-suggestion-warning"
                      : ""
                  }`}
                >
                  <div className="insights-suggestion-icon">
                    {item.warning ? (
                      <AlertTriangle size={20} />
                    ) : (
                      <Lightbulb size={20} />
                    )}
                  </div>

                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Insights;
