# RideMate - Complete Project Structure & Tags

## 📋 Project Overview

**RideMate** is a full-stack carpooling and ride-sharing platform that connects drivers and riders for sustainable urban transportation. Built with modern web technologies including React, TypeScript, Node.js, Express, and MongoDB.

---

## 🏷️ Text Tags

**Primary Tags:**
- `carpooling` `ride-sharing` `transportation` `mobility` `sustainable-travel`
- `full-stack` `react` `typescript` `nodejs` `express` `mongodb`
- `real-time` `websocket` `gps-tracking` `live-tracking` `socketio`
- `ai-chatbot` `gemini` `voice-assistant` `chat`
- `authentication` `jwt` `bcrypt` `security`
- `maps` `leaflet` `geocoding` `routing` `osrm`
- `booking-system` `ride-matching` `pricing` `payment`
- `notifications` `real-time-updates` `push-notifications`
- `responsive` `tailwindcss` `modern-ui` `accessibility`
- `pdf-generation` `ticket-download` `weather-integration`

**Feature Tags:**
- `dual-role-system` `driver` `rider` `user-management`
- `smart-matching` `route-optimization` `algorithm`
- `vehicle-management` `multi-vehicle` `fleet`
- `rating-system` `reviews` `feedback`
- `emergency-contacts` `sos` `safety`
- `green-miles` `co2-tracking` `eco-friendly`
- `scheduled-rides` `recurring` `cron-jobs`
- `location-autocomplete` `address-search`
- `live-chat` `in-ride-messaging`
- `profile-management` `user-profiles`

**Technology Tags:**
- `vite` `esbuild` `fast-build`
- `mongoose` `odm` `database`
- `axios` `http-client` `api`
- `jspdf` `pdf-generation`
- `node-cron` `scheduled-tasks`
- `cors` `middleware`
- `dotenv` `environment-config`

---

## 📁 Complete File Structure

```
RideMate/
│
├── 📄 Configuration Files
│   ├── package.json                    # Frontend dependencies & scripts
│   ├── package-lock.json               # Frontend dependency lock file
│   ├── pnpm-lock.yaml                  # Alternative package manager lock
│   ├── vite.config.ts                  # Vite build configuration
│   ├── tsconfig.json                   # TypeScript base configuration
│   ├── tsconfig.app.json               # TypeScript app configuration
│   ├── tsconfig.node.json              # TypeScript node configuration
│   ├── tailwind.config.js              # Tailwind CSS configuration
│   ├── postcss.config.js               # PostCSS configuration
│   ├── eslint.config.js                # ESLint configuration
│   ├── index.html                      # HTML entry point
│   ├── LICENSE                         # MIT License
│   └── README.md                       # Project documentation
│
├── 📁 public/                          # Static assets
│   ├── hero_image.jpg                  # Landing page hero image
│   ├── ridemate_logo.png               # Application logo
│   └── team/                           # Team member photos
│       ├── jinay.png
│       ├── smit.png
│       ├── tirth.jpg
│       └── yug.png
│
├── 📁 src/                             # Frontend source code (React + TypeScript)
│   │
│   ├── 📄 Core Files
│   │   ├── main.tsx                    # React application entry point
│   │   ├── App.tsx                     # Root component with routing
│   │   ├── index.css                   # Global styles
│   │   └── vite-env.d.ts               # Vite type definitions
│   │
│   ├── 📁 screens/                     # Page-level components (15 screens)
│   │   ├── Landing.tsx                 # Landing/home page
│   │   ├── Login.tsx                   # User login page
│   │   ├── Signup.tsx                  # User registration page
│   │   ├── Dashboard.tsx               # Main dashboard (driver/rider)
│   │   ├── CreateRide.tsx              # Driver: Create new ride
│   │   ├── SearchRide.tsx              # Rider: Search for rides
│   │   ├── MyRides.tsx                 # User's created/requested rides
│   │   ├── RideDetails.tsx             # Detailed ride information
│   │   ├── RideConfirmation.tsx        # Ride booking confirmation
│   │   ├── RideHistory.tsx             # Past rides history
│   │   ├── Chat.tsx                    # In-ride chat interface
│   │   ├── GPSTracking.tsx             # Live GPS tracking screen
│   │   ├── Profile.tsx                 # User profile management
│   │   ├── Vehicles.tsx                # Vehicle management (drivers)
│   │   ├── PaymentPage.tsx             # Payment processing
│   │   └── Rating.tsx                  # Post-ride rating/review
│   │
│   ├── 📁 components/                  # Reusable UI components
│   │   │
│   │   ├── 📁 AnimatedSection/         # Animation wrapper component
│   │   │   └── AnimatedSection.tsx
│   │   │
│   │   ├── 📁 Chatbot/                 # AI chatbot integration
│   │   │   ├── index.tsx               # Main chatbot component
│   │   │   ├── ChatButton.tsx          # Chatbot trigger button
│   │   │   └── ChatPanel.tsx           # Chat interface panel
│   │   │
│   │   ├── 📁 ClockPicker/             # Time picker component
│   │   │   ├── ClockTimePicker.tsx
│   │   │   └── clockPicker.css
│   │   │
│   │   ├── 📁 CustomCursor/            # Custom cursor effects
│   │   │   └── CustomCursor.tsx
│   │   │
│   │   ├── 📁 FloatingActionButton/    # FAB component
│   │   │   └── FloatingActionButton.tsx
│   │   │
│   │   ├── 📁 RollerPicker/            # Scrollable picker components
│   │   │   ├── RollerDatePicker.tsx    # Date picker
│   │   │   ├── RollerTimePicker.tsx    # Time picker
│   │   │   ├── CalendarDatePicker.tsx  # Calendar view
│   │   │   ├── PickerModal.tsx         # Picker modal wrapper
│   │   │   └── rollerPicker.css
│   │   │
│   │   ├── 📁 RollingReviews/          # Testimonial carousel
│   │   │   ├── RollingReviews.tsx
│   │   │   └── rollingReviews.css
│   │   │
│   │   ├── Button.tsx                  # Reusable button component
│   │   ├── Card.tsx                    # Card container component
│   │   ├── Input.tsx                   # Form input component
│   │   ├── Logo.tsx                    # Application logo component
│   │   ├── Footer.tsx                  # Footer component
│   │   ├── Layout.tsx                  # Page layout wrapper
│   │   ├── ScrollProgressBar.tsx       # Scroll progress indicator
│   │   ├── VoiceAssistant.tsx          # Voice command interface
│   │   ├── LiveMap.tsx                 # Interactive map component
│   │   ├── MiniMap.tsx                 # Compact map preview
│   │   ├── MapPicker.tsx               # Location picker on map
│   │   ├── LocationAutocomplete.tsx    # Address autocomplete input
│   │   ├── DriverDashboard.tsx         # Driver-specific dashboard
│   │   ├── RiderDashboard.tsx          # Rider-specific dashboard
│   │   ├── DriverTracker.tsx           # Driver location tracker
│   │   ├── GreenStatsCard.tsx          # Eco-friendly stats display
│   │   ├── NotificationPanel.tsx       # Notification sidebar
│   │   └── RiderProfileModal.tsx       # Rider info modal
│   │
│   ├── 📁 context/                     # React Context providers
│   │   ├── AppContext.tsx              # Main app state management
│   │   └── AccessibilityContext.tsx    # Accessibility settings
│   │
│   ├── 📁 hooks/                       # Custom React hooks
│   │   └── useRideChat.ts              # Chat functionality hook
│   │
│   ├── 📁 services/                    # API client services
│   │   ├── auth.ts                     # Authentication API calls
│   │   ├── rides.ts                    # Ride-related API calls
│   │   ├── bookings.ts                 # Booking API calls
│   │   ├── vehicles.ts                 # Vehicle API calls
│   │   ├── locations.ts                # Location/geocoding API
│   │   ├── notifications.ts            # Notification API calls
│   │   └── socket.ts                   # WebSocket client setup
│   │
│   ├── 📁 utils/                       # Utility functions
│   │   ├── dateUtils.ts                # Date formatting utilities
│   │   ├── rideCalculations.ts         # Price/distance calculations
│   │   ├── osrmDistance.ts             # OSRM routing integration
│   │   ├── geocoding.ts                # Address geocoding helpers
│   │   ├── weatherApi.ts               # Weather API integration
│   │   ├── geminiChat.ts               # Google Gemini AI integration
│   │   ├── chatStorage.ts              # Chat message storage
│   │   └── ticketPdf.ts                # PDF ticket generation
│   │
│   └── 📁 styles/                      # CSS modules & styles
│       ├── customCursor.css            # Custom cursor styles
│       ├── landing.css                 # Landing page styles
│       └── rollingReviews.css          # Reviews carousel styles
│
└── 📁 server/                          # Backend server (Node.js + Express)
    │
    ├── 📄 Core Files
    │   ├── index.js                    # Server entry point & setup
    │   ├── socketHandler.js             # WebSocket/Socket.IO handler
    │   ├── seed.js                     # Database seeding script
    │   └── cleanupOrphanedBookings.js   # Cleanup utility script
    │
    ├── 📁 config/                      # Configuration files
    │   └── db.js                       # MongoDB connection setup
    │
    ├── 📁 models/                      # MongoDB schemas (Mongoose)
    │   ├── User.js                     # User model (driver/rider)
    │   ├── Ride.js                     # Ride model
    │   ├── Booking.js                  # Booking model
    │   ├── Vehicle.js                  # Vehicle model
    │   └── Notification.js             # Notification model
    │
    ├── 📁 controllers/                 # Request handlers (business logic)
    │   ├── authController.js           # Authentication handlers
    │   ├── rideController.js           # Ride CRUD operations
    │   ├── bookingController.js        # Booking management
    │   ├── vehicleController.js        # Vehicle CRUD operations
    │   ├── chatController.js           # Chat message handlers
    │   └── notificationController.js    # Notification handlers
    │
    ├── 📁 routes/                      # API route definitions
    │   ├── authRoutes.js               # /api/auth endpoints
    │   ├── rideRoutes.js               # /api/rides endpoints
    │   ├── bookingRoutes.js            # /api/bookings endpoints
    │   ├── vehicleRoutes.js            # /api/vehicles endpoints
    │   ├── locationRoutes.js           # /api/locations endpoints
    │   ├── chatRoutes.js               # /api/chat endpoints
    │   └── notificationRoutes.js       # /api/notifications endpoints
    │
    ├── 📁 middleware/                  # Express middleware
    │   ├── authMiddleware.js           # JWT authentication middleware
    │   └── errorHandler.js             # Global error handler
    │
    ├── 📁 services/                    # Business logic services
    │   └── aiService.js                # AI/Gemini service integration
    │
    ├── 📁 utils/                       # Server-side utilities
    │   ├── distance.js                 # Distance calculation utilities
    │   ├── geocoding.js                # Geocoding service wrapper
    │   ├── validate.js                 # Input validation helpers
    │   └── cron.js                     # Scheduled task definitions
    │
    ├── 📁 scripts/                     # Utility scripts
    │   └── updatePrices.js             # Price recalculation script
    │
    ├── package.json                    # Backend dependencies
    ├── package-lock.json               # Backend dependency lock
    └── node_modules/                   # Backend dependencies
```

---

## 🔑 Key File Descriptions

### Frontend (src/)

**Core Application:**
- `main.tsx` - React app initialization with providers
- `App.tsx` - Main router and screen navigation logic
- `index.css` - Global CSS styles and Tailwind imports

**Screens (15 total):**
- Authentication: `Login.tsx`, `Signup.tsx`
- Main: `Landing.tsx`, `Dashboard.tsx`
- Ride Management: `CreateRide.tsx`, `SearchRide.tsx`, `MyRides.tsx`, `RideDetails.tsx`, `RideHistory.tsx`
- Features: `Chat.tsx`, `GPSTracking.tsx`, `Profile.tsx`, `Vehicles.tsx`, `PaymentPage.tsx`, `Rating.tsx`, `RideConfirmation.tsx`

**Key Components:**
- `Chatbot/` - Google Gemini AI integration for ride assistance
- `LiveMap.tsx` - Leaflet-based interactive maps
- `DriverTracker.tsx` - Real-time driver location tracking
- `RollerPicker/` - Custom date/time picker components
- `VoiceAssistant.tsx` - Voice command interface

**Services:**
- API clients for all backend endpoints
- Socket.IO client for real-time communication
- Utility functions for calculations, PDF generation, weather

### Backend (server/)

**Core Server:**
- `index.js` - Express server setup, route mounting, Socket.IO initialization
- `socketHandler.js` - WebSocket event handlers for real-time features

**Models (MongoDB Schemas):**
- `User.js` - User accounts (drivers/riders) with authentication
- `Ride.js` - Ride listings with route, timing, pricing
- `Booking.js` - Ride bookings and request management
- `Vehicle.js` - Driver vehicle information
- `Notification.js` - User notifications

**Controllers:**
- Handle all business logic and database operations
- Process authentication, ride matching, booking management
- Manage real-time chat and notifications

**Routes:**
- RESTful API endpoints for all features
- Protected routes with JWT authentication
- Organized by feature domain

**Utilities:**
- `distance.js` - OSRM/Haversine distance calculations
- `geocoding.js` - Address geocoding (Nominatim/Google/Mapbox)
- `cron.js` - Scheduled tasks (cleanup, price updates)
- `validate.js` - Input validation helpers

---

## 📊 Statistics

- **Total Screens:** 15
- **Total Components:** 30+
- **API Routes:** 7 route files
- **Database Models:** 5
- **Controllers:** 6
- **Utility Functions:** 8+
- **Technology Stack:** React, TypeScript, Node.js, Express, MongoDB, Socket.IO, Leaflet, Google Gemini AI

---

## 🎯 Project Purpose

RideMate enables sustainable urban transportation by connecting drivers and riders through an intelligent matching system. It provides real-time tracking, secure payments, AI-powered assistance, and comprehensive ride management features for both drivers and riders.

---

*Generated: Complete project structure documentation*

