
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Wallet,
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  ChartNoAxesCombined,
  LogOut,
  Menu,
  X
} from "lucide-react";

import { removeToken } from "../services/api";
import "./Sidebar.css";

const navigation = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard
  },
  {
    label: "Transactions",
    path: "/transactions",
    icon: ArrowLeftRight
  },
  {
    label: "Budgets",
    path: "/budgets",
    icon: Target
  },
  {
    label: "Insights",
    path: "/insights",
    icon: ChartNoAxesCombined
  }
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    removeToken();
    navigate("/", { replace: true });
    window.location.reload();
  }

  return (
    <>
      <button
        className="sidebar-mobile-toggle"
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu size={23} />
      </button>

      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Wallet size={23} />
          </div>

          <span>SpendWise</span>

          <button
            className="sidebar-close"
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-navigation">
          <span className="sidebar-section-label">
            WORKSPACE
          </span>

          <nav aria-label="Main navigation">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `sidebar-link ${
                      isActive ? "sidebar-link-active" : ""
                    }`
                  }
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span>SMARTER SPENDING</span>
            <p>
              Small steps today. Better financial
              habits tomorrow.
            </p>
          </div>

          <button
            className="sidebar-logout"
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
