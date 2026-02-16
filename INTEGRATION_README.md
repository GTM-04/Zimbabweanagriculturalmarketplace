# Zimbabwe Agricultural Marketplace - Frontend

A modern, mobile-first marketplace connecting farmers with buyers in Zimbabwe. Built with React, TypeScript, and Vite.

## 🚀 Features

### For Farmers
- ✅ **User Registration & Authentication** - Secure signup and login
- ✅ **List Produce** - Create listings with photos, prices, and details
- ✅ **Manage Listings** - View, edit, and delete your listings
- ✅ **Real-time Chat** - Communicate with buyers via WebSocket
- ✅ **Market Prices** - View current market prices for produce
- ✅ **Profile Management** - Update your farm details

### For Buyers
- ✅ **Browse Listings** - Search and filter available produce
- ✅ **Advanced Search** - Find specific produce by type, location, etc.
- ✅ **Real-time Chat** - Message farmers directly
- ✅ **Market Insights** - Access current market pricing
- ✅ **Favorites** - Save listings for later

### Technical Features
- ✅ **Real-time Updates** - WebSocket for instant messaging
- ✅ **Offline Support** - Works with limited connectivity
- ✅ **Responsive Design** - Mobile-first, works on all devices
- ✅ **Token-based Auth** - Secure JWT authentication
- ✅ **Auto Token Refresh** - Seamless session management
- ✅ **Image Upload** - Multiple photos per listing
- ✅ **Type Safety** - Full TypeScript implementation

## 📋 Prerequisites

- Node.js 18+ and npm
- Backend API running (see backend repository)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd Zimbabweanagriculturalmarketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env

   # Edit .env with your API URLs
   # Development (default):
   VITE_API_URL=http://localhost:8001/api/v1
   VITE_WS_URL=ws://localhost:8001/ws
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## 🏗️ Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

## 📁 Project Structure

```
src/
├── components/
│   ├── screens/          # Page components
│   │   ├── LoginScreen.tsx
│   │   ├── FarmerRegistration.tsx
│   │   ├── BuyerRegistration.tsx
│   │   ├── FarmerDashboard.tsx
│   │   ├── BuyerDashboard.tsx
│   │   ├── ListProduce.tsx
│   │   ├── SearchResults.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── MarketPrices.tsx
│   │   ├── Messages.tsx
│   │   ├── MyListings.tsx
│   │   ├── ProductDetail.tsx
│   │   └── Profile.tsx
│   ├── ui/               # Reusable UI components
│   └── BottomNav.tsx     # Bottom navigation
├── lib/
│   ├── api.ts            # API service layer
│   ├── types.ts          # TypeScript types
│   ├── useAuth.ts        # Authentication hook
│   ├── useWebSocket.ts   # WebSocket hook
│   └── data.ts           # Static data (districts, categories)
├── styles/
│   └── globals.css       # Global styles
├── App.tsx               # Main app component
├── routes.tsx            # Route definitions
└── main.tsx              # Entry point
```

## 🔑 API Integration

### Base Configuration

The app connects to the backend API using these environment variables:

```env
VITE_API_URL=http://localhost:8001/api/v1    # REST API base URL
VITE_WS_URL=ws://localhost:8001/ws            # WebSocket base URL
```

### Authentication Flow

1. **Register/Login** → Receives JWT tokens
2. **Store Tokens** → Saved in localStorage
3. **Auto-Include** → Tokens sent with all requests
4. **Auto-Refresh** → Tokens refreshed when expired
5. **Auto-Logout** → Redirect to login if refresh fails

### Available API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token

#### Users
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update user profile

#### Listings
- `GET /listings/` - List all listings (with filters)
- `POST /listings/` - Create new listing
- `GET /listings/{id}` - Get listing details
- `DELETE /listings/{id}` - Delete listing
- `POST /listings/{id}/images/` - Upload listing images

#### Messaging
- `GET /messaging/conversations` - List conversations
- `GET /messaging/conversations/{id}/messages` - Get messages
- `WS /ws/messaging/{id}/` - Real-time chat WebSocket

#### Pricing
- `GET /pricing/market-prices` - Get market prices

#### Notifications
- `GET /notifications/` - List notifications
- `POST /notifications/{id}/read` - Mark as read

## 🔌 Usage Examples

### Authentication

```typescript
import { useAuth } from './lib/useAuth';

function LoginComponent() {
  const { login, loading, error } = useAuth();

  const handleLogin = async () => {
    try {
      await login({
        phone_number: '+263771234567',
        password: 'password123'
      });
      // Navigate to dashboard
    } catch (err) {
      console.error('Login failed:', err);
    }
  };
}
```

### Creating a Listing

```typescript
import { listingsApi } from './lib/api';

const createListing = async () => {
  const listing = await listingsApi.create({
    produce_type_id: 1,
    quantity_available: 500,
    unit: 'kg',
    price_per_unit: 2.50,
    description: 'Fresh organic tomatoes',
    is_organic: true,
    harvest_date: '2026-02-15'
  });
  
  // Upload images
  if (images.length > 0) {
    await listingsApi.uploadImages(listing.id, images);
  }
};
```

### Real-time Chat

```typescript
import { useWebSocket } from './lib/useWebSocket';

function ChatComponent({ conversationId }) {
  const { connected, sendMessage } = useWebSocket({
    conversationId,
    onMessage: (msg) => {
      console.log('New message:', msg);
    },
    onTyping: (userId, userName, isTyping) => {
      console.log(`${userName} is typing...`);
    }
  });

  const send = () => {
    sendMessage('Hello!');
  };
}
```

## 🧪 Demo Accounts

Test the application with these demo accounts:

**Farmer Account:**
- Phone: `+263771234567`
- Password: `password123`

**Buyer Account:**
- Phone: `+263772345678`
- Password: `password123`

## 🎨 Design System

### Colors
- Primary (Green): `#2D5016`
- Secondary (Blue): `#4A90E2`
- Success: `#4CAF50`
- Error: `#EF5350`
- Warning: `#FFA726`
- Text Primary: `#2C2C2C`
- Text Secondary: `#757575`
- Background: `#F5F5F5`
- Border: `#E0E0E0`

### Typography
- Font Family: System fonts (optimized for each platform)
- Headings: Bold, larger sizes
- Body: Regular weight
- Captions: Smaller, secondary color

## 🔧 Development

### Code Style
- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting (if configured)

### Component Patterns
- Functional components with hooks
- Custom hooks for reusable logic
- Props interface for type safety
- Error boundaries for error handling

### State Management
- React hooks (useState, useEffect)
- Custom hooks (useAuth, useWebSocket)
- localStorage for persistence
- No external state library needed

## 📱 Mobile Optimization

- Touch-friendly UI elements
- Bottom navigation for easy thumb access
- Optimized images and lazy loading
- Offline functionality where possible
- PWA-ready (can be installed)

## 🐛 Troubleshooting

### API Connection Issues

**Problem:** Cannot connect to API  
**Solution:** Check that:
1. Backend server is running
2. `.env` file has correct API URLs
3. No CORS issues (backend should allow your origin)

### WebSocket Not Connecting

**Problem:** Chat not working  
**Solution:** Verify:
1. WebSocket URL in `.env` is correct
2. Backend WebSocket server is running
3. Token is valid (refresh if needed)

### Build Errors

**Problem:** Build fails  
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## 📚 Additional Resources

- [Backend API Documentation](../villagetomarketbackend/FRONTEND_INTEGRATION.md)
- [API Quick Reference](../villagetomarketbackend/API_QUICK_REFERENCE.md)
- [Postman Collection](../villagetomarketbackend/postman_collection.json)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

[Your License Here]

## 👥 Support

For issues or questions:
- Email: support@villagetomarket.zw
- GitHub Issues: [Link to issues]

---

**Built with ❤️ for Zimbabwean farmers and buyers**
