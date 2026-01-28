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
import ClubDellas from './pages/ClubDellas';
import Download from './pages/Download';
import DriverDashboard from './pages/DriverDashboard';
import DriverLogin from './pages/DriverLogin';
import DriverOptions from './pages/DriverOptions';
import DriverProfile from './pages/DriverProfile';
import DriverRegistration from './pages/DriverRegistration';
import Earnings from './pages/Earnings';
import LoyaltyProgram from './pages/LoyaltyProgram';
import Messages from './pages/Messages';
import MyReviews from './pages/MyReviews';
import Notifications from './pages/Notifications';
import PassengerChat from './pages/PassengerChat';
import PassengerDashboard from './pages/PassengerDashboard';
import PassengerHome from './pages/PassengerHome';
import PassengerLogin from './pages/PassengerLogin';
import PassengerMessages from './pages/PassengerMessages';
import PassengerOptions from './pages/PassengerOptions';
import PassengerProfile from './pages/PassengerProfile';
import Profile from './pages/Profile';
import RequestRide from './pages/RequestRide';
import Reviews from './pages/Reviews';
import RideHistory from './pages/RideHistory';
import ScheduleRide from './pages/ScheduleRide';
import Settings from './pages/Settings';
import TrackRide from './pages/TrackRide';
import Wallet from './pages/Wallet';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminPanel": AdminPanel,
    "AvailableRides": AvailableRides,
    "ClubDellas": ClubDellas,
    "Download": Download,
    "DriverDashboard": DriverDashboard,
    "DriverLogin": DriverLogin,
    "DriverOptions": DriverOptions,
    "DriverProfile": DriverProfile,
    "DriverRegistration": DriverRegistration,
    "Earnings": Earnings,
    "LoyaltyProgram": LoyaltyProgram,
    "Messages": Messages,
    "MyReviews": MyReviews,
    "Notifications": Notifications,
    "PassengerChat": PassengerChat,
    "PassengerDashboard": PassengerDashboard,
    "PassengerHome": PassengerHome,
    "PassengerLogin": PassengerLogin,
    "PassengerMessages": PassengerMessages,
    "PassengerOptions": PassengerOptions,
    "PassengerProfile": PassengerProfile,
    "Profile": Profile,
    "RequestRide": RequestRide,
    "Reviews": Reviews,
    "RideHistory": RideHistory,
    "ScheduleRide": ScheduleRide,
    "Settings": Settings,
    "TrackRide": TrackRide,
    "Wallet": Wallet,
}

export const pagesConfig = {
    mainPage: "PassengerHome",
    Pages: PAGES,
    Layout: __Layout,
};