# Frontend Button Functionality Reference

This document provides a comprehensive overview of all interactive buttons in the application and their API integrations.

## 🔐 Authentication Screens

### Login Screen (`LoginScreen.tsx`)

| Button | Action | API Endpoint | Redirect |
|--------|--------|--------------|----------|
| **Sign In** | Authenticates user | `POST /auth/login` | `/farmer/dashboard` or `/buyer/dashboard` based on user type |
| **Register Link** | Navigate to registration | - | `/user-type` |
| **Forgot Password** | Password recovery (not yet implemented) | - | - |

**Implementation:**

```typescript
const handleSubmit = async () => {
  const user = await login({
    phone_number: cleanPhone,
    password: formData.password,
  });
  // Auto-redirects based on user_type
};
```

---

### Farmer Registration (`FarmerRegistration.tsx`)

| Button | Action | API Endpoint | Redirect |
|--------|--------|--------------|----------|
| **Create Account** | Registers farmer | `POST /auth/register` | `/farmer/dashboard` |
| **Sign In Link** | Go to login | - | `/login` |
| **Profile Photo Upload** | Upload image (local only) | - | - |

**Implementation:**

```typescript
await register({
  full_name: formData.fullName,
  phone_number: cleanPhone,
  password: formData.password,
  user_type: "farmer",
  district: formData.district,
  ward: formData.ward || "Ward 1",
});
```

---

### Buyer Registration (`BuyerRegistration.tsx`)

| Button | Action | API Endpoint | Redirect |
|--------|--------|--------------|----------|
| **Create Account** | Registers buyer | `POST /auth/register` | `/buyer/dashboard` |
| **Sign In Link** | Go to login | - | `/login` |

---

## 👨‍🌾 Farmer Screens

### Farmer Dashboard (`FarmerDashboard.tsx`)

| Button/Link | Action | API Endpoint | Redirect |
|-------------|--------|--------------|----------|
| **List New Produce** | Create listing | - | `/farmer/list-produce` |
| **View All Listings** | View my listings | - | `/farmer/my-listings` |
| **View Messages** | Open messages | - | `/messages` |
| **View Market Prices** | Check prices | - | `/market-prices` |
| **Profile Icon** | View profile | - | `/profile` |
| **Notification Bell** | View notifications (future) | `GET /notifications/` | - |

---

### List Produce (`ListProduce.tsx`)

| Button | Action | API Endpoint | Redirect |
|--------|--------|--------------|----------|
| **Publish Listing** | Create new listing | `POST /listings/` then `POST /listings/{id}/images/` | `/farmer/my-listings` |
| **Cancel** | Discard changes | - | Back to previous page |
| **Add Photo** (3x) | Upload listing images | Local storage only, uploaded with listing | - |

**Implementation:**

```typescript
const handleSubmit = async () => {
  // Create listing
  const listing = await listingsApi.create({
    produce_type_id: parseInt(formData.produce),
    quantity_available: parseFloat(formData.quantity),
    unit: formData.unit,
    price_per_unit: parseFloat(formData.price),
    description: formData.description,
    is_organic: formData.isOrganic,
    harvest_date: formData.availableFrom,
  });

  // Upload images if any
  if (uploadedImages.length > 0) {
    await listingsApi.uploadImages(listing.id, uploadedImages);
  }
};
```

---

### My Listings (`MyListings.tsx`)

| Button | Action | API Endpoint | Redirect |
|--------|--------|--------------|----------|
| **Edit Listing** | Edit listing (future) | `PATCH /listings/{id}` | - |
| **Delete Listing** | Remove listing | `DELETE /listings/{id}` | Refreshes list |
| **View Details** | See full listing | - | `/product/{id}` |

---

## 🛒 Buyer Screens

### Buyer Dashboard (`BuyerDashboard.tsx`)

| Button/Link | Action | API Endpoint | Redirect |
|-------------|--------|--------------|----------|
| **Search** | Find produce | - | `/search` |
| **Category Card** (6x) | Filter by category | - | `/search?category={id}` |
| **View Listing** | See details | - | `/product/{id}` |
| **Message Farmer** | Start chat | - | `/chat/{conversationId}` |

---

### Search Results (`SearchResults.tsx`)

| Button | Action | API Endpoint | Redirect |
|--------|--------|--------------|----------|
| **Search Input** | Filter listings | `GET /listings/?search={query}` | - |
| **Filter Button** | Show filters (future) | - | - |
| **Grid/List Toggle** | Change view mode | - | - |
| **Listing Card** | View details | - | `/product/{id}` |
| **Heart Icon** | Add to favorites (future) | - | - |

**Implementation:**

```typescript
useEffect(() => {
  const fetchListings = async () => {
    const data = await listingsApi.list({ status: "active" });
    setListings(data);
  };
  fetchListings();
}, []);
```

---

### Product Detail (`ProductDetail.tsx`)

| Button | Action | API Endpoint | Redirect |
|--------|--------|--------------|----------|
| **Message Farmer** | Start conversation | Creates/opens conversation | `/chat/{conversationId}` |
| **Call Farmer** | Phone call | - | Opens phone dialer |
| **Share** | Share listing (future) | - | - |
| **Add to Favorites** | Save listing (future) | - | - |
| **View More from Farmer** | See farmer's listings | `GET /listings/?farmer_id={id}` | - |

---

## 💬 Messaging Screens

### Messages List (`Messages.tsx`)

| Button/Link | Action | API Endpoint | Redirect |
|-------------|--------|--------------|----------|
| **Conversation Item** | Open chat | - | `/chat/{conversationId}` |
| **Archive/Delete** (future) | Manage conversation | - | - |

**Implementation:**

```typescript
useEffect(() => {
  const fetchConversations = async () => {
    const data = await messagingApi.listConversations();
    setConversations(data);
  };
  fetchConversations();
}, []);
```

---

### Chat Screen (`ChatScreen.tsx`)

| Button | Action | API Endpoint | Protocol |
|--------|--------|--------------|----------|
| **Send Message** | Send text | WebSocket | `WS /ws/messaging/{id}/` |
| **Quick Reply** (3x) | Auto-fill message | - | - |
| **Attach File** | Upload file (future) | - | - |
| **View Listing** | Go to related listing | - | `/product/{id}` |

**Implementation:**

```typescript
const { connected, sendMessage } = useWebSocket({
  conversationId,
  onMessage: (newMessage) => {
    setMessages((prev) => [...prev, newMessage]);
    sendReadReceipt(newMessage.id);
  },
  onTyping: (userId, userName, isTyping) => {
    setOtherUserTyping(isTyping);
  }
});

const handleSend = () => {
  const clientId = sendMessage(message.trim());
  // Message appears immediately (optimistic UI)
};
```

**WebSocket Message Types:**

```typescript
// Send message
{ type: 'chat_message', message: 'Hello', client_id: 'unique-id' }

// Send typing indicator
{ type: 'typing', is_typing: true }

// Send read receipt
{ type: 'read_receipt', message_id: 'msg-id' }
```

---

## 📊 Market Prices (`MarketPrices.tsx`)

| Button | Action | API Endpoint | Refresh |
|--------|--------|--------------|---------|
| **Refresh** | Reload prices | `GET /pricing/market-prices` | Yes |
| **Search** | Filter by produce | Local filter | - |

**Implementation:**

```typescript
const fetchPrices = async (isRefresh = false) => {
  const data = await pricingApi.getMarketPrices();
  setPrices(data);
  setLastUpdated(new Date());
};
```

---

## 👤 Profile Screen (`Profile.tsx`)

| Button | Action | API Endpoint | Redirect |
|--------|--------|--------------|----------|
| **Edit Profile** | Update info | `PATCH /users/me` | - |
| **Change Password** (future) | Update password | - | - |
| **Logout** | Sign out | Local storage clear | `/login` |
| **Delete Account** (future) | Remove account | `DELETE /users/me` | `/login` |

**Implementation:**

```typescript
const handleUpdate = async () => {
  await updateProfile({
    full_name: formData.name,
    district: formData.district,
    // other fields
  });
};

const handleLogout = () => {
  logout(); // Clears tokens and redirects
};
```

---

## 🔔 Notifications (Future)

| Button | Action | API Endpoint |
|--------|--------|--------------|
| **Mark as Read** | Mark notification read | `POST /notifications/{id}/read` |
| **Mark All Read** | Clear all | Batch POST requests |
| **Delete** | Remove notification | `DELETE /notifications/{id}` |

---

## 🔄 Automatic Behaviors

### Token Refresh

- **Trigger:** Any API request with expired token
- **Action:** Automatically refreshes using refresh token
- **Fallback:** Redirects to login if refresh fails

### Auto-login

- **Trigger:** App load with valid stored token
- **Action:** Validates token with `GET /users/me`
- **Fallback:** Clears storage if invalid

### Offline Mode

- **Trigger:** Network disconnected
- **Display:** Warning banner on all screens
- **Behavior:**
  - Messages queued for sending
  - Cached data displayed
  - UI indicates offline status

---

## 🎯 Button States Reference

### Loading States

All API-calling buttons show loading spinners:

```tsx
<Button disabled={loading}>
  {loading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Loading...
    </>
  ) : (
    "Submit"
  )}
</Button>
```

### Disabled States

Buttons are disabled when:

- Form validation fails
- Loading/submitting
- Network offline (for online-only actions)
- Missing required data

### Error Handling

All API errors display:

```tsx
{error && (
  <Alert variant="destructive">
    <p className="text-sm">{error}</p>
  </Alert>
)}
```

---

## 🧪 Testing Buttons

### Manual Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (see error)
- [ ] Register new farmer account
- [ ] Register new buyer account
- [ ] Create new listing with images
- [ ] Search and filter listings
- [ ] Send messages in chat
- [ ] View market prices
- [ ] Refresh market prices
- [ ] Edit profile
- [ ] Logout

### API Testing

Use the provided Postman collection for backend testing before frontend integration.

---

## 📝 Notes

1. **Phone Number Format:** Always `+263` followed by 9 digits
2. **Image Upload:** Max 5 images per listing, first is cover
3. **WebSocket:** Auto-reconnects on disconnect (up to 5 attempts)
4. **Tokens:** Access token (15 min), Refresh token (7 days)
5. **Currency:** All prices in ZWL (Zimbabwean Dollar)

---

**Last Updated:** February 16, 2026
