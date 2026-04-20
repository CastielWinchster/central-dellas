import React, { useState, useEffect } from 'react';
import { saveState } from '@/utils/stateManager';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import RequestDelivery from './pages/RequestDelivery';
import DriverVehicle from './pages/DriverVehicle';
import ActiveRidePassenger from './pages/ActiveRidePassenger';
import ActiveRideDriver from './pages/ActiveRideDriver';
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
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [loadingDone, setLoadingDone] = useState(false);

  // Show loading screen while checking app public settings or auth, minimum 3s
  if ((isLoadingPublicSettings || isLoadingAuth) || !loadingDone) {
    return <LoadingScreen onComplete={() => setLoadingDone(true)} />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
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