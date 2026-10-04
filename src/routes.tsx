import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BuyerDashboard } from "./components/screens/BuyerDashboard";
import { ChatScreen } from "./components/screens/ChatScreen";
import { FarmerDashboard } from "./components/screens/FarmerDashboard";
import { ListProduce } from "./components/screens/ListProduce";
import { LoginScreen } from "./components/screens/LoginScreen";
import { MarketPrices } from "./components/screens/MarketPrices";
import { Messages } from "./components/screens/Messages";
import { MyListings } from "./components/screens/MyListings";
import { ProductDetail } from "./components/screens/ProductDetail";
import { Profile } from "./components/screens/Profile";
import { RegisterScreen } from "./components/screens/RegisterScreen";
import { SearchResults } from "./components/screens/SearchResults";
import { SplashScreen } from "./components/screens/SplashScreen";
import { WelcomeScreen } from "./components/screens/WelcomeScreen";
import { FarmerPublicProfile } from "./components/screens/FarmerPublicProfile";

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
    path: "/register",
    element: <RegisterScreen />,
  },
  {
    path: "/login",
    element: <LoginScreen />,
  },
  {
    path: "/farmer/dashboard",
    element: (
      <ProtectedRoute>
        <FarmerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/farmer/list-produce",
    element: (
      <ProtectedRoute>
        <ListProduce />
      </ProtectedRoute>
    ),
  },
  {
    path: "/farmer/my-listings",
    element: (
      <ProtectedRoute>
        <MyListings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/buyer/dashboard",
    element: (
      <ProtectedRoute>
        <BuyerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/buyer/search",
    element: (
      <ProtectedRoute>
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
  {
    path: "/farmer/:username",
    element: <FarmerPublicProfile />,
  },
]);
