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
import './App.css';

const panels: Record<ScenarioTab, React.FC> = {
  compensation: CompensationPanel,
  expenses: ExpensesPanel,
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
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <LoginPage />;
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
