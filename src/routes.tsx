import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BuyerDashboard } from "./components/screens/BuyerDashboard";
import { BuyerRegistration } from "./components/screens/BuyerRegistration";
import { ChatScreen } from "./components/screens/ChatScreen";
import { FarmerDashboard } from "./components/screens/FarmerDashboard";
import { FarmerRegistration } from "./components/screens/FarmerRegistration";
import { ListProduce } from "./components/screens/ListProduce";
import { LoginScreen } from "./components/screens/LoginScreen";
import { MarketPrices } from "./components/screens/MarketPrices";
import { Messages } from "./components/screens/Messages";
import { MyListings } from "./components/screens/MyListings";
import { ProductDetail } from "./components/screens/ProductDetail";
import { Profile } from "./components/screens/Profile";
import { SearchResults } from "./components/screens/SearchResults";
import { SplashScreen } from "./components/screens/SplashScreen";
import { UserTypeSelection } from "./components/screens/UserTypeSelection";
import { WelcomeScreen } from "./components/screens/WelcomeScreen";

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
    element: (
      <ProtectedRoute requiredUserType="farmer">
        <FarmerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/farmer/list-produce",
    element: (
      <ProtectedRoute requiredUserType="farmer">
        <ListProduce />
      </ProtectedRoute>
    ),
  },
  {
    path: "/farmer/my-listings",
    element: (
      <ProtectedRoute requiredUserType="farmer">
        <MyListings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/buyer/dashboard",
    element: (
      <ProtectedRoute requiredUserType="buyer">
        <BuyerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/buyer/search",
    element: (
      <ProtectedRoute requiredUserType="buyer">
        <SearchResults />
      </ProtectedRoute>
    ),
  },
  {
    path: "/product/:id",
    element: (
      <ProtectedRoute>
        <ProductDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/messages",
    element: (
      <ProtectedRoute>
        <Messages />
      </ProtectedRoute>
    ),
  },
  {
    path: "/messages/:conversationId",
    element: (
      <ProtectedRoute>
        <ChatScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/market-prices",
    element: <MarketPrices />,
  },
]);
