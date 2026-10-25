
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes
} from "react-router-dom";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Insights from "./pages/Insights";

import Sidebar from "./components/Sidebar";
import { getToken } from "./services/api";

function ProtectedLayout() {
  if (!getToken()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            getToken()
              ? <Navigate to="/dashboard" replace />
              : <Auth />
          }
        />

        <Route element={<ProtectedLayout />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/transactions"
            element={<Transactions />}
          />

          <Route
            path="/budgets"
            element={<Budgets />}
          />

          <Route
            path="/insights"
            element={<Insights />}
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
