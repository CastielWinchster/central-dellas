/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminPanel from './pages/AdminPanel';
import AvailableRides from './pages/AvailableRides';
import BlockedUsers from './pages/BlockedUsers';
import CustomLogin from './pages/CustomLogin';
import CustomSignup from './pages/CustomSignup';
import Download from './pages/Download';
import DriverDashboard from './pages/DriverDashboard';
import DriverDocuments from './pages/DriverDocuments';
import DriverLogin from './pages/DriverLogin';
import DriverOptions from './pages/DriverOptions';
import DriverProfile from './pages/DriverProfile';
import DriverRegistration from './pages/DriverRegistration';
import Earnings from './pages/Earnings';
import FavoriteDrivers from './pages/FavoriteDrivers';
import FavoritePlaces from './pages/FavoritePlaces';
import MyReviews from './pages/MyReviews';
import Notifications from './pages/Notifications';
import PassengerChat from './pages/PassengerChat';
import PassengerDashboard from './pages/PassengerDashboard';
import PassengerHelp from './pages/PassengerHelp';
import PassengerHome from './pages/PassengerHome';
import PassengerLogin from './pages/PassengerLogin';
import PassengerNotifications from './pages/PassengerNotifications';
import PassengerOptions from './pages/PassengerOptions';
import PassengerProfile from './pages/PassengerProfile';
import PassengerSafety from './pages/PassengerSafety';
import PassengerSecurity from './pages/PassengerSecurity';
import PushTestPage from './pages/PushTestPage';
import RequestRide from './pages/RequestRide';
import Reviews from './pages/Reviews';
import RideChat from './pages/RideChat';
import RideHistory from './pages/RideHistory';
import ScheduleRide from './pages/ScheduleRide';
import Settings from './pages/Settings';
import TrackRide from './pages/TrackRide';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminPanel": AdminPanel,
    "AvailableRides": AvailableRides,
    "BlockedUsers": BlockedUsers,
    "CustomLogin": CustomLogin,
    "CustomSignup": CustomSignup,
    "Download": Download,
    "DriverDashboard": DriverDashboard,
    "DriverDocuments": DriverDocuments,
    "DriverLogin": DriverLogin,
    "DriverOptions": DriverOptions,
    "DriverProfile": DriverProfile,
    "DriverRegistration": DriverRegistration,
    "Earnings": Earnings,
    "FavoriteDrivers": FavoriteDrivers,
    "FavoritePlaces": FavoritePlaces,
    "MyReviews": MyReviews,
    "Notifications": Notifications,
    "PassengerChat": PassengerChat,
    "PassengerDashboard": PassengerDashboard,
    "PassengerHelp": PassengerHelp,
    "PassengerHome": PassengerHome,
    "PassengerLogin": PassengerLogin,
    "PassengerNotifications": PassengerNotifications,
    "PassengerOptions": PassengerOptions,
    "PassengerProfile": PassengerProfile,
    "PassengerSafety": PassengerSafety,
    "PassengerSecurity": PassengerSecurity,
    "PushTestPage": PushTestPage,
    "RequestRide": RequestRide,
    "Reviews": Reviews,
    "RideChat": RideChat,
    "RideHistory": RideHistory,
    "ScheduleRide": ScheduleRide,
    "Settings": Settings,
    "TrackRide": TrackRide,
}

export const pagesConfig = {
    mainPage: "PassengerHome",
    Pages: PAGES,
    Layout: __Layout,
};