import React, { useState, useEffect } from 'react';
import { saveState } from '@/utils/stateManager';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import RequestDelivery from './pages/RequestDelivery';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import DriverVehicle from './pages/DriverVehicle';
import ActiveRidePassenger from './pages/ActiveRidePassenger';
import ActiveRideDriver from './pages/ActiveRideDriver';
import ActiveDeliveryPassenger from './pages/ActiveDeliveryPassenger';
import ActiveDeliveryDriver from './pages/ActiveDeliveryDriver';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DeleteAccount from './pages/DeleteAccount';
import LoadingScreen from './components/LoadingScreen';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

function useAppVisibilityPersist() {
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) saveState('app_last_active', Date.now());
    };
    const handleUnload = () => saveState('app_last_active', Date.now());
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);
}

const AuthenticatedApp = () => {
  useAppVisibilityPersist();
  const { isLoadingPublicSettings } = useAuth();
  const [loadingDone, setLoadingDone] = useState(false);

  // Show loading screen while checking app public settings, minimum 3s
  if (isLoadingPublicSettings || !loadingDone) {
    return <LoadingScreen onComplete={() => setLoadingDone(true)} />;
  }

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public informational routes */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/delete-account" element={<DeleteAccount />} />

      {/* Protected app routes — gate everything behind auth */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="/RequestDelivery" element={
          <LayoutWrapper currentPageName="RequestDelivery">
            <RequestDelivery />
          </LayoutWrapper>
        } />
        <Route path="/DriverVehicle" element={
          <LayoutWrapper currentPageName="DriverVehicle">
            <DriverVehicle />
          </LayoutWrapper>
        } />
        <Route path="/ActiveRidePassenger" element={<ActiveRidePassenger />} />
        <Route path="/ActiveRideDriver" element={<ActiveRideDriver />} />
        <Route path="/ActiveDeliveryPassenger" element={<ActiveDeliveryPassenger />} />
        <Route path="/ActiveDeliveryDriver" element={<ActiveDeliveryDriver />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App