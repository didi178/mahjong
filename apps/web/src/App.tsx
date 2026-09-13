/**
 * Mahjong Academy - Main App Component
 *
 * This is a PWA shell only - no feature logic yet.
 * Game logic will be added in future issues (#3-#7).
 */

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🀄 Mahjong Academy</h1>
        <p>Learn American Mahjong through interactive practice</p>
      </header>
      <main className="app-main">
        <div className="status-card">
          <h2>✅ Project Scaffolded</h2>
          <p>
            The monorepo structure is set up and ready for feature development.
          </p>
          <ul className="package-list">
            <li>✓ Workspace configured (pnpm + Turborepo)</li>
            <li>✓ TypeScript strict mode enabled</li>
            <li>✓ Test runner ready (Vitest + fast-check)</li>
            <li>✓ Linting configured (ESLint + Prettier)</li>
            <li>✓ 9 packages scaffolded</li>
            <li>✓ PWA shell installed</li>
          </ul>
          <p className="next-steps">
            <strong>Next:</strong> Issue #2 (Phase 0 rules & content spike)
          </p>
        </div>
      </main>
      <footer className="app-footer">
        <p>Mahjong Academy v0.1.0 - PWA Mode</p>
      </footer>
    </div>
  );
}

export default App;
