import type { ScenarioTab } from '../../engine/types';

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
        <p>Built for Steven & family</p>
      </div>
    </nav>
  );
}
