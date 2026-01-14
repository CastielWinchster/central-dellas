import AvailableRides from './pages/AvailableRides';
import DriverDashboard from './pages/DriverDashboard';
import Earnings from './pages/Earnings';
import Messages from './pages/Messages';
import MyReviews from './pages/MyReviews';
import PassengerHome from './pages/PassengerHome';
import Profile from './pages/Profile';
import RequestRide from './pages/RequestRide';
import RideHistory from './pages/RideHistory';
import LoyaltyProgram from './pages/LoyaltyProgram';
import DriverProfile from './pages/DriverProfile';
import PassengerProfile from './pages/PassengerProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AvailableRides": AvailableRides,
    "DriverDashboard": DriverDashboard,
    "Earnings": Earnings,
    "Messages": Messages,
    "MyReviews": MyReviews,
    "PassengerHome": PassengerHome,
    "Profile": Profile,
    "RequestRide": RequestRide,
    "RideHistory": RideHistory,
    "LoyaltyProgram": LoyaltyProgram,
    "DriverProfile": DriverProfile,
    "PassengerProfile": PassengerProfile,
}

export const pagesConfig = {
    mainPage: "PassengerHome",
    Pages: PAGES,
    Layout: __Layout,
};