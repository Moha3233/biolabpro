import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StorageProvider } from './contexts/StorageContext';
import { ErrorBoundary } from './lib/error';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calculators from './pages/Calculators';
import LabPlanner from './pages/LabPlanner';
import ProtocolGenerator from './pages/ProtocolGenerator';
import ReagentTracker from './pages/ReagentTracker';
import DataVisualizer from './pages/DataVisualizer';
import Notes from './pages/Notes';
import Help from './pages/Help';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-900 dark:text-white bg-[#f8f9fa] dark:bg-slate-900">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return <StorageProvider>{children}</StorageProvider>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="calculators" element={<Calculators />} />
              <Route path="planner" element={<LabPlanner />} />
              <Route path="protocols" element={<ProtocolGenerator />} />
              <Route path="reagents" element={<ReagentTracker />} />
              <Route path="visualizer" element={<DataVisualizer />} />
              <Route path="notes" element={<Notes />} />
              <Route path="help" element={<Help />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
