import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import { LoadingScreen } from './components/LoadingScreen';

// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Members = lazy(() => import('./pages/Members'));
const Reports = lazy(() => import('./pages/Reports'));
const MySavings = lazy(() => import('./pages/MySavings'));
const Settings = lazy(() => import('./pages/Settings'));
const Discussion = lazy(() => import('./pages/Discussion'));
const Investments = lazy(() => import('./pages/Investments'));
const SetupGuide = lazy(() => import('./components/SetupGuide'));

// Check for Supabase keys
const hasSupabaseKeys = true; // Keys are now hardcoded as fallbacks in supabase.ts

// Protected Route Component
const ProtectedRoute = ({ children, moduleKey }: { children: React.ReactNode, moduleKey?: string }) => {
  const { session, loading, isAdmin, systemSettings } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  if (moduleKey && !isAdmin && systemSettings && (systemSettings as any)[moduleKey] === false) {
    return <Navigate to="/members" />; // Redirect to members if module is disabled
  }

  return <Layout>{children}</Layout>;
};

const AppContent = () => {
  const { theme } = useTheme();
  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute moduleKey="show_dashboard">
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/members" element={
            <ProtectedRoute>
              <Members />
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute moduleKey="show_reports">
              <Reports />
            </ProtectedRoute>
          } />
          
          <Route path="/my-savings" element={
            <ProtectedRoute moduleKey="show_savings">
              <MySavings />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="/investments" element={
            <ProtectedRoute moduleKey="show_investments">
              <Investments />
            </ProtectedRoute>
          } />

          <Route path="/discussion" element={
            <ProtectedRoute moduleKey="show_discussion">
              <Discussion />
            </ProtectedRoute>
          } />
          
          <Route path="/setup" element={
            <ProtectedRoute>
              <SetupGuide />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" theme={theme} />
    </>
  );
};

export default function App() {
  if (!hasSupabaseKeys) {
    return <SetupGuide />;
  }

  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
