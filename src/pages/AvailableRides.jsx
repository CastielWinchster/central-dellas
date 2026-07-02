import { Navigate } from 'react-router-dom';

/** Rota legada — corridas disponíveis ficam no DriverDashboard. */
export default function AvailableRides() {
  return <Navigate to="/DriverDashboard" replace />;
}
