export default function CompensationPanel() {
  return (
    <div className="scenario-panel">
      <h2>Compensation Overview</h2>
      <p className="panel-description">
        Analyze your total compensation — base salary, bonus, RSU vesting, ESPP,
        and employer 401(k) match — to understand your real take-home picture.
      </p>
      <div className="placeholder-card">
        <p>🚧 Inputs and visualizations coming soon</p>
        <ul>
          <li>Base salary &amp; bonus breakdown</li>
          <li>RSU vesting schedule timeline</li>
          <li>Tax impact modeling</li>
          <li>Total comp comparison (current vs. scenarios)</li>
        </ul>
      </div>
    </div>
  );
}
