import { useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Practice from "./pages/Practice.jsx";
import Stats from "./pages/Stats.jsx";

const TABS = [
  { id: "dashboard", label: "Dashboard", Page: Dashboard },
  { id: "practice", label: "Practice", Page: Practice },
  { id: "stats", label: "Stats", Page: Stats },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const { Page } = TABS.find((t) => t.id === tab);

  return (
    <div className="app">
      <main className="page">
        <Page onNavigate={setTab} />
      </main>
      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? "tab is-active" : "tab"}
            aria-current={t.id === tab ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
