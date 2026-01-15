import AvailableRides from './pages/AvailableRides';
import DriverDashboard from './pages/DriverDashboard';
import DriverLogin from './pages/DriverLogin';
import DriverProfile from './pages/DriverProfile';
import DriverRegistration from './pages/DriverRegistration';
import Earnings from './pages/Earnings';
import LoyaltyProgram from './pages/LoyaltyProgram';
import Messages from './pages/Messages';
import MyReviews from './pages/MyReviews';
import Notifications from './pages/Notifications';
import PassengerDashboard from './pages/PassengerDashboard';
import PassengerHome from './pages/PassengerHome';
import PassengerLogin from './pages/PassengerLogin';
import PassengerProfile from './pages/PassengerProfile';
import Profile from './pages/Profile';
import RequestRide from './pages/RequestRide';
import Reviews from './pages/Reviews';
import RideHistory from './pages/RideHistory';
import Settings from './pages/Settings';
import Wallet from './pages/Wallet';
import ScheduleRide from './pages/ScheduleRide';
import ClubDellas from './pages/ClubDellas';
import TrackRide from './pages/TrackRide';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AvailableRides": AvailableRides,
    "DriverDashboard": DriverDashboard,
    "DriverLogin": DriverLogin,
    "DriverProfile": DriverProfile,
    "DriverRegistration": DriverRegistration,
    "Earnings": Earnings,
    "LoyaltyProgram": LoyaltyProgram,
    "Messages": Messages,
    "MyReviews": MyReviews,
    "Notifications": Notifications,
    "PassengerDashboard": PassengerDashboard,
    "PassengerHome": PassengerHome,
    "PassengerLogin": PassengerLogin,
    "PassengerProfile": PassengerProfile,
    "Profile": Profile,
    "RequestRide": RequestRide,
    "Reviews": Reviews,
    "RideHistory": RideHistory,
    "Settings": Settings,
    "Wallet": Wallet,
    "ScheduleRide": ScheduleRide,
    "ClubDellas": ClubDellas,
    "TrackRide": TrackRide,
}

export const pagesConfig = {
    mainPage: "PassengerHome",
    Pages: PAGES,
    Layout: __Layout,
};