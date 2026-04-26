import { useState } from 'react';
import type { ScenarioTab } from './engine/types';
import Sidebar from './components/layout/Sidebar';
import CompensationPanel from './components/scenarios/CompensationPanel';
import RetirementPanel from './components/scenarios/RetirementPanel';
import HousingPanel from './components/scenarios/HousingPanel';
import RenovationPanel from './components/scenarios/RenovationPanel';
import './App.css';

const panels: Record<ScenarioTab, React.FC> = {
  compensation: CompensationPanel,
  retirement: RetirementPanel,
  housing: HousingPanel,
  renovation: RenovationPanel,
};

function App() {
  const [activeTab, setActiveTab] = useState<ScenarioTab>('compensation');
  const ActivePanel = panels[activeTab];

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content">
        <ActivePanel />
      </main>
    </div>
  );
}

export default App;
