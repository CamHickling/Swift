import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import {
  RidePage,
  HistoryPage,
  WorkoutDetailPage,
  BuilderPage,
  WorkoutsPage,
  SettingsPage,
} from './pages';
import { StravaCallback } from './pages/StravaCallback';
import './App.css';

function App() {
  return (
    <HashRouter>
      <div className="app">
        <nav className="main-nav">
          <div className="nav-brand">
            <h1>Swift</h1>
          </div>
          <div className="nav-links">
            <NavLink to="/" end>
              Ride
            </NavLink>
            <NavLink to="/workouts">Workouts</NavLink>
            <NavLink to="/history">History</NavLink>
            <NavLink to="/settings">Settings</NavLink>
          </div>
        </nav>

        <div className="app-content">
          <Routes>
            <Route path="/" element={<RidePage />} />
            <Route path="/workouts" element={<WorkoutsPage />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/workout/:id" element={<WorkoutDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/strava/callback" element={<StravaCallback />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;
