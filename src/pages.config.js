import PassengerHome from './pages/PassengerHome';
import RequestRide from './pages/RequestRide';
import __Layout from './Layout.jsx';


export const PAGES = {
    "PassengerHome": PassengerHome,
    "RequestRide": RequestRide,
}

export const pagesConfig = {
    mainPage: "PassengerHome",
    Pages: PAGES,
    Layout: __Layout,
};