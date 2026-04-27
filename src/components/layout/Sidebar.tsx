import type { ScenarioTab } from '../../engine/types';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: ScenarioTab;
  onTabChange: (tab: ScenarioTab) => void;
}

const tabs: { id: ScenarioTab; label: string; icon: string }[] = [
  { id: 'compensation', label: 'Compensation', icon: '💰' },
  { id: 'expenses', label: 'Expenses', icon: '📊' },
  { id: 'retirement', label: 'Retirement', icon: '🏦' },
  { id: 'projection', label: 'Projection', icon: '📉' },
  { id: 'housing', label: 'Home Buying', icon: '🏠' },
  { id: 'renovation', label: 'Renovate vs Save', icon: '🔨' },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { logout, email } = useAuth();

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">ma-finance</h1>
        <p className="tagline">Scenario Planner</p>
      </div>
      <ul className="sidebar-nav">
        {tabs.map((tab) => (
          <li key={tab.id}>
            <button
              className={`sidebar-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="sidebar-icon">{tab.icon}</span>
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        {email && <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>{email}</p>}
        <button
          onClick={logout}
          style={{
            background: 'none',
            border: '1px solid #334155',
            color: '#94a3b8',
            padding: '6px 16px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            width: '100%',
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
