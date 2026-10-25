
const API_BASE_URL = "http://localhost:5000/api";

// Save login token
export function saveToken(token) {
  localStorage.setItem("spendwise_token", token);
}

// Get saved token
export function getToken() {
  return localStorage.getItem("spendwise_token");
}

// Remove token when logging out
export function removeToken() {
  localStorage.removeItem("spendwise_token");
}

// Reusable function for API requests
export async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error(
      "Cannot connect to SpendWise server. Check that the backend is running."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

// Authentication APIs
export const authAPI = {
  register: (userData) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData)
    }),

  login: (credentials) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    }),

  getProfile: () => apiRequest("/auth/me")
};

// Transaction APIs
export const transactionAPI = {
  getAll: () => apiRequest("/transactions"),

  create: (transaction) =>
    apiRequest("/transactions", {
      method: "POST",
      body: JSON.stringify(transaction)
    }),

  update: (id, transaction) =>
    apiRequest(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(transaction)
    }),

  delete: (id) =>
    apiRequest(`/transactions/${id}`, {
      method: "DELETE"
    })
};

// Dashboard APIs
export const dashboardAPI = {
  getSummary: () => apiRequest("/dashboard/summary")
};

// Budget APIs
export const budgetAPI = {
  getAll: (month, year) =>
    apiRequest(`/budgets?month=${month}&year=${year}`),

  create: (budget) =>
    apiRequest("/budgets", {
      method: "POST",
      body: JSON.stringify(budget)
    }),

  update: (id, budget) =>
    apiRequest(`/budgets/${id}`, {
      method: "PUT",
      body: JSON.stringify(budget)
    }),

  delete: (id) =>
    apiRequest(`/budgets/${id}`, {
      method: "DELETE"
    })
};
