import { createBrowserRouter } from "react-router";
import { SplashScreen } from "./components/screens/SplashScreen";
import { WelcomeScreen } from "./components/screens/WelcomeScreen";
import { UserTypeSelection } from "./components/screens/UserTypeSelection";
import { FarmerRegistration } from "./components/screens/FarmerRegistration";
import { BuyerRegistration } from "./components/screens/BuyerRegistration";
import { LoginScreen } from "./components/screens/LoginScreen";
import { FarmerDashboard } from "./components/screens/FarmerDashboard";
import { BuyerDashboard } from "./components/screens/BuyerDashboard";
import { ListProduce } from "./components/screens/ListProduce";
import { MyListings } from "./components/screens/MyListings";
import { ProductDetail } from "./components/screens/ProductDetail";
import { Messages } from "./components/screens/Messages";
import { ChatScreen } from "./components/screens/ChatScreen";
import { Profile } from "./components/screens/Profile";
import { MarketPrices } from "./components/screens/MarketPrices";
import { SearchResults } from "./components/screens/SearchResults";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SplashScreen />,
  },
  {
    path: "/welcome",
    element: <WelcomeScreen />,
  },
  {
    path: "/user-type",
    element: <UserTypeSelection />,
  },
  {
    path: "/register/farmer",
    element: <FarmerRegistration />,
  },
  {
    path: "/register/buyer",
    element: <BuyerRegistration />,
  },
  {
    path: "/login",
    element: <LoginScreen />,
  },
  {
    path: "/farmer/dashboard",
    element: <FarmerDashboard />,
  },
  {
    path: "/farmer/list-produce",
    element: <ListProduce />,
  },
  {
    path: "/farmer/my-listings",
    element: <MyListings />,
  },
  {
    path: "/buyer/dashboard",
    element: <BuyerDashboard />,
  },
  {
    path: "/buyer/search",
    element: <SearchResults />,
  },
  {
    path: "/product/:id",
    element: <ProductDetail />,
  },
  {
    path: "/messages",
    element: <Messages />,
  },
  {
    path: "/messages/:userId",
    element: <ChatScreen />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/market-prices",
    element: <MarketPrices />,
  },
]);
