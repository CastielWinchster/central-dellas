import AvailableRides from './pages/AvailableRides';
import DriverDashboard from './pages/DriverDashboard';
import DriverProfile from './pages/DriverProfile';
import Earnings from './pages/Earnings';
import LoyaltyProgram from './pages/LoyaltyProgram';
import Messages from './pages/Messages';
import MyReviews from './pages/MyReviews';
import PassengerHome from './pages/PassengerHome';
import PassengerProfile from './pages/PassengerProfile';
import Profile from './pages/Profile';
import RequestRide from './pages/RequestRide';
import RideHistory from './pages/RideHistory';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AvailableRides": AvailableRides,
    "DriverDashboard": DriverDashboard,
    "DriverProfile": DriverProfile,
    "Earnings": Earnings,
    "LoyaltyProgram": LoyaltyProgram,
    "Messages": Messages,
    "MyReviews": MyReviews,
    "PassengerHome": PassengerHome,
    "PassengerProfile": PassengerProfile,
    "Profile": Profile,
    "RequestRide": RequestRide,
    "RideHistory": RideHistory,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "PassengerHome",
    Pages: PAGES,
    Layout: __Layout,
};