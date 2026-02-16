# 🚀 Deployment & Testing Checklist

## ✅ Pre-Launch Checklist

### Backend Setup
- [ ] Backend API is running on `http://localhost:8001`
- [ ] Database migrations are applied
- [ ] Test data seeded (optional)
- [ ] CORS configured to allow frontend origin
- [ ] WebSocket endpoint is accessible
- [ ] All API endpoints tested with Postman

### Frontend Setup
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with correct URLs
- [ ] TypeScript compiles without errors
- [ ] Development server starts successfully
- [ ] Can access app at `http://localhost:5173`

---

## 🧪 Feature Testing

### 1. Authentication Flow ✅

#### Farmer Registration
- [ ] Navigate to `/user-type`
- [ ] Select "I'm a Farmer"
- [ ] Fill all required fields:
  - [ ] Full name
  - [ ] Phone number (+263XXXXXXXXX)
  - [ ] District
  - [ ] Primary crops (select at least one)
  - [ ] Password (min 8 characters)
  - [ ] Confirm password (matches)
  - [ ] Agree to terms
- [ ] Click "Create Account"
- [ ] **Expected:** Redirects to `/farmer/dashboard`
- [ ] **Expected:** User info stored in localStorage
- [ ] **Expected:** Token saved

#### Buyer Registration
- [ ] Navigate to `/user-type`
- [ ] Select "I'm a Buyer"
- [ ] Fill all required fields
- [ ] Click "Create Account"
- [ ] **Expected:** Redirects to `/buyer/dashboard`

#### Login
- [ ] Navigate to `/login`
- [ ] Enter valid credentials:
  - Phone: `+263771234567`
  - Password: `password123`
- [ ] Click "Sign In"
- [ ] **Expected:** Redirects based on user type
- [ ] **Expected:** User session persists on refresh

#### Logout
- [ ] Click profile/settings
- [ ] Click "Logout"
- [ ] **Expected:** Redirects to `/login`
- [ ] **Expected:** localStorage cleared
- [ ] **Expected:** Cannot access protected routes

---

### 2. Listing Management ✅

#### Create Listing (Farmer)
- [ ] Login as farmer
- [ ] Click "List New Produce" on dashboard
- [ ] Fill form:
  - [ ] Select category
  - [ ] Select produce type
  - [ ] Enter variety (optional)
  - [ ] Enter quantity
  - [ ] Select unit
  - [ ] Enter price
  - [ ] Add photos (up to 3)
  - [ ] Select district
  - [ ] Set availability dates
  - [ ] Add description
  - [ ] Mark as organic (optional)
- [ ] Click "Publish Listing"
- [ ] **Expected:** Loading spinner shows
- [ ] **Expected:** Success message or redirect
- [ ] **Expected:** Listing appears in "My Listings"
- [ ] **Expected:** Images uploaded to backend

#### View Listings (Buyer)
- [ ] Login as buyer
- [ ] View dashboard - see featured listings
- [ ] **Expected:** Listings load from API
- [ ] **Expected:** Images display correctly
- [ ] **Expected:** Prices shown in ZWL
- [ ] **Expected:** Location badges visible

#### Search Listings
- [ ] Click search bar
- [ ] Type produce name (e.g., "Tomatoes")
- [ ] **Expected:** Results filter in real-time
- [ ] **Expected:** "No results" shows if none found
- [ ] Click category filter
- [ ] **Expected:** Results filter by category

#### View Listing Details
- [ ] Click on any listing card
- [ ] **Expected:** Full details page loads
- [ ] **Expected:** All images displayed
- [ ] **Expected:** Farmer info shown
- [ ] **Expected:** Price and quantity visible
- [ ] **Expected:** "Message Farmer" button works

#### Delete Listing (Farmer)
- [ ] Go to "My Listings"
- [ ] Click delete on a listing
- [ ] Confirm deletion
- [ ] **Expected:** Listing removed
- [ ] **Expected:** UI updates immediately
- [ ] **Expected:** Listing gone from backend

---

### 3. Real-Time Chat ✅

#### Start Conversation
- [ ] As buyer, view a listing
- [ ] Click "Message Farmer"
- [ ] **Expected:** Redirects to chat screen
- [ ] **Expected:** Chat interface loads
- [ ] **Expected:** Listing info shown at top
- [ ] **Expected:** WebSocket connects (check console)

#### Send Message
- [ ] Type a message
- [ ] Click send or press Enter
- [ ] **Expected:** Message appears immediately
- [ ] **Expected:** Message sent via WebSocket
- [ ] **Expected:** Timestamp shown
- [ ] **Expected:** Message persists on refresh

#### Receive Message
- [ ] Open chat in two browser windows (different users)
- [ ] Send message from one window
- [ ] **Expected:** Message appears in other window instantly
- [ ] **Expected:** No page refresh needed
- [ ] **Expected:** Sound notification (if implemented)

#### Typing Indicator
- [ ] Type in message box
- [ ] **Expected:** Other user sees "User is typing..."
- [ ] Stop typing
- [ ] **Expected:** Indicator disappears after 3 seconds

#### Read Receipts
- [ ] Send message
- [ ] **Expected:** Shows "Sent" status
- [ ] Other user opens chat
- [ ] **Expected:** Shows "Read" status

#### Offline Handling
- [ ] Disconnect internet
- [ ] Try to send message
- [ ] **Expected:** "Offline" banner shows
- [ ] **Expected:** Send button disabled
- [ ] Reconnect internet
- [ ] **Expected:** WebSocket reconnects automatically
- [ ] **Expected:** Queued messages send

---

### 4. Market Prices ✅

#### View Prices
- [ ] Navigate to "Market Prices"
- [ ] **Expected:** Prices load from API
- [ ] **Expected:** Loading spinner while fetching
- [ ] **Expected:** Last updated timestamp shown
- [ ] **Expected:** Price ranges displayed

#### Search Prices
- [ ] Use search box
- [ ] Type produce name
- [ ] **Expected:** Results filter

#### Refresh Prices
- [ ] Click refresh button
- [ ] **Expected:** Button shows spinning icon
- [ ] **Expected:** Prices reload from API
- [ ] **Expected:** Timestamp updates

---

### 5. User Profile ✅

#### View Profile
- [ ] Click profile icon/link
- [ ] **Expected:** User details display
- [ ] **Expected:** Data matches registration

#### Edit Profile
- [ ] Click "Edit Profile"
- [ ] Change some fields
- [ ] Click "Save"
- [ ] **Expected:** Success message
- [ ] **Expected:** Changes persist
- [ ] **Expected:** UI updates

---

## 🔧 Technical Tests

### API Integration
- [ ] Open browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Perform any action
- [ ] **Expected:** API calls visible
- [ ] **Expected:** Status 200 for success
- [ ] **Expected:** Error handled for 4xx/5xx
- [ ] Check request headers
- [ ] **Expected:** Authorization header present
- [ ] **Expected:** Token format: `Bearer <token>`

### Token Management
- [ ] Login successfully
- [ ] Check localStorage
- [ ] **Expected:** `access_token` present
- [ ] **Expected:** `refresh_token` present
- [ ] Wait for token to expire (15 min or set shorter)
- [ ] Make API call
- [ ] **Expected:** Auto-refreshes token
- [ ] **Expected:** No user interruption
- [ ] Clear refresh token
- [ ] Make API call
- [ ] **Expected:** Redirects to login

### WebSocket Connection
- [ ] Open chat
- [ ] Check browser console
- [ ] **Expected:** "WebSocket connected" log
- [ ] Close/reopen chat
- [ ] **Expected:** Reconnects automatically
- [ ] Disconnect internet
- [ ] **Expected:** Shows "Connecting..." banner
- [ ] Reconnect internet
- [ ] **Expected:** Reconnects within 5 seconds

### Error Handling
- [ ] Try invalid login
- [ ] **Expected:** Error message shows
- [ ] **Expected:** No console errors
- [ ] Stop backend server
- [ ] Try any API call
- [ ] **Expected:** "Failed to connect" message
- [ ] **Expected:** Retry option available

### Loading States
- [ ] Watch all buttons during actions
- [ ] **Expected:** Loading spinners during API calls
- [ ] **Expected:** Buttons disabled while loading
- [ ] **Expected:** Re-enabled after completion

### Form Validation
- [ ] Try submitting empty forms
- [ ] **Expected:** Submit button disabled
- [ ] Enter invalid phone number
- [ ] **Expected:** Error message
- [ ] Enter mismatched passwords
- [ ] **Expected:** Error shown

---

## 📱 Mobile Testing

### Responsive Design
- [ ] Open browser DevTools
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Test on different screen sizes:
  - [ ] iPhone SE (375px)
  - [ ] iPhone 12 Pro (390px)
  - [ ] iPad (768px)
  - [ ] Desktop (1920px)
- [ ] **Expected:** Layout adapts
- [ ] **Expected:** No horizontal scroll
- [ ] **Expected:** Text readable

### Touch Interactions
- [ ] Use touch device or simulate
- [ ] Test buttons
- [ ] **Expected:** Appropriate touch target size
- [ ] Test swipe gestures (if any)
- [ ] **Expected:** Smooth scrolling

---

## 🌐 Browser Compatibility

Test in multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (Chrome, Safari)

---

## 📊 Performance

### Load Times
- [ ] Measure page load time
- [ ] **Target:** < 3 seconds on 3G
- [ ] Check image sizes
- [ ] **Target:** < 500KB per image

### API Response Times
- [ ] Check Network tab
- [ ] **Target:** < 500ms for most requests
- [ ] **Target:** < 2s for image uploads

### WebSocket Latency
- [ ] Send message
- [ ] **Target:** < 100ms delivery time

---

## 🔒 Security

### Token Security
- [ ] Tokens stored in localStorage (✓)
- [ ] Tokens sent only to API domain
- [ ] HTTPS in production
- [ ] No tokens in URL parameters
- [ ] No tokens logged to console

### Input Validation
- [ ] Phone number format validated
- [ ] Password strength enforced
- [ ] XSS protection (React escapes by default)
- [ ] SQL injection prevented (backend parameterized queries)

### CORS
- [ ] Backend allows only trusted origins
- [ ] Credentials included in requests
- [ ] Preflight requests handled

---

## 🐛 Known Issues to Check

### Common Bugs
- [ ] Images not displaying - check URL format
- [ ] WebSocket not connecting - verify URL and token
- [ ] 404 on routes - check React Router config
- [ ] CORS errors - check backend configuration
- [ ] Token expired - should auto-refresh
- [ ] Chat messages duplicating - check client_id logic

---

## 🚀 Production Readiness

### Before Deploying
- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables configured
- [ ] API URLs updated for production
- [ ] Build succeeds (`npm run build`)
- [ ] Build tested locally (`npm run preview`)
- [ ] Error tracking setup (e.g., Sentry)
- [ ] Analytics setup (optional)

### Deployment
- [ ] Backend deployed and accessible
- [ ] Frontend deployed
- [ ] Environment variables set
- [ ] HTTPS enabled
- [ ] DNS configured
- [ ] CDN configured (optional)
- [ ] Monitoring enabled

---

## ✅ Final Verification

### User Journey: Farmer
1. [ ] Register as farmer
2. [ ] Login successfully
3. [ ] Create a listing with images
4. [ ] View my listings
5. [ ] Receive message from buyer
6. [ ] Reply to message
7. [ ] Check market prices
8. [ ] Update profile
9. [ ] Logout

### User Journey: Buyer
1. [ ] Register as buyer
2. [ ] Login successfully
3. [ ] Browse listings
4. [ ] Search for produce
5. [ ] View listing details
6. [ ] Message farmer
7. [ ] Receive reply
8. [ ] Check market prices
9. [ ] Logout

---

## 📈 Success Criteria

### Must Have ✅
- [x] Authentication working
- [x] Listings CRUD operations
- [x] Real-time chat functional
- [x] Market prices loading
- [x] Mobile responsive
- [x] Error handling
- [x] Loading states

### Nice to Have 🎯
- [ ] Push notifications
- [ ] Image gallery
- [ ] Advanced filters
- [ ] Order management
- [ ] Payment integration

---

## 📞 Support Checklist

If issues occur:
1. [ ] Check browser console for errors
2. [ ] Verify backend is running
3. [ ] Check `.env` configuration
4. [ ] Review network tab for failed requests
5. [ ] Clear localStorage and retry
6. [ ] Check documentation
7. [ ] Review error logs

---

**Testing Date:** _______________  
**Tested By:** _______________  
**Environment:** Development / Staging / Production  
**Status:** Pass / Fail / Pending  

---

*Use this checklist to ensure all features are working correctly before deployment.*
