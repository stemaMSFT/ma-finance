import { useState } from 'react';
import type { ScenarioTab } from './engine/types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Sidebar from './components/layout/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import CompensationPanel from './components/scenarios/CompensationPanel';
import ExpensesPanel from './components/scenarios/ExpensesPanel';
import RetirementPanel from './components/scenarios/RetirementPanel';
import RetirementProjectionPanel from './components/scenarios/RetirementProjectionPanel';
import HousingPanel from './components/scenarios/HousingPanel';
import RenovationPanel from './components/scenarios/RenovationPanel';
import CashFlowPanel from './components/scenarios/CashFlowPanel';
import './App.css';

const panels: Record<ScenarioTab, React.FC> = {
  compensation: CompensationPanel,
  expenses: ExpensesPanel,
  cashflow: CashFlowPanel,
  retirement: RetirementPanel,
  projection: RetirementProjectionPanel,
  housing: HousingPanel,
  renovation: RenovationPanel,
};

function AuthenticatedApp() {
  const [activeTab, setActiveTab] = useState<ScenarioTab>('compensation');
  const ActivePanel = panels[activeTab];

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content">
        <ErrorBoundary>
          <ActivePanel />
        </ErrorBoundary>
      </main>
    </div>
  );
}

function AppContent() {
  // Auth temporarily bypassed for local dev
  return <AuthenticatedApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
