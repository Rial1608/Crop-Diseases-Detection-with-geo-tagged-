import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import SuspenseFallback from './components/SuspenseFallback';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Upload from './pages/Upload';
import MapDashboard from './pages/MapDashboard';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import './App.css';

/*
 * App.jsx — routing shell only.
 * All global state (location, weather, predictions) lives in AppContext.
 * Pages consume context via useApp() hook — no prop drilling needed.
 */
function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Suspense fallback={<SuspenseFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/map" element={<MapDashboard />} />
                <Route path="/results" element={<Results />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
