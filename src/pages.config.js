import PassengerHome from './pages/PassengerHome';
import RequestRide from './pages/RequestRide';
import DriverDashboard from './pages/DriverDashboard';
import RideHistory from './pages/RideHistory';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import __Layout from './Layout.jsx';


export const PAGES = {
    "PassengerHome": PassengerHome,
    "RequestRide": RequestRide,
    "DriverDashboard": DriverDashboard,
    "RideHistory": RideHistory,
    "Profile": Profile,
    "Messages": Messages,
}

export const pagesConfig = {
    mainPage: "PassengerHome",
    Pages: PAGES,
    Layout: __Layout,
};