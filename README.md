# RideMate - Smart Ride Sharing Platform

RideMate is a modern, feature-rich ride-sharing application designed to connect riders and drivers seamlessly. It focuses on accessibility, safety, and ease of use, featuring a unique Voice Assistant for hands-free navigation and a smart AI Chatbot.

## 🌟 Key Features

*   **Dual Role System:** Seamlessly switch between Rider and Driver modes.
*   **Smart Voice Assistant:** Navigate the app and perform actions using voice commands (e.g., "Book a ride to Downtown", "Show my history").
*   **AI Chatbot:** Integrated AI assistant for support and queries.
*   **Real-time Ride Tracking:** Live GPS tracking for active rides.
*   **Ride Management:**
    *   **Drivers:** Create and publish rides with custom routes, dates, and seat availability.
    *   **Riders:** Search for rides, view driver details, and book seats.
*   **Safety First:** Identity verification for drivers and emergency contact integration.
*   **User Profiles:** Comprehensive profiles with ratings, ride history, and vehicle management.
*   **Interactive Maps:** Visual route selection and location picking using Leaflet.

## 🛠️ Tech Stack

### Frontend
*   **Framework:** React (Vite)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Maps:** Leaflet / React-Leaflet
*   **State Management:** React Context API
*   **Voice/AI:** Web Speech API, Google Gemini AI

### Backend
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB (Mongoose)
*   **Real-time:** Socket.io
*   **Authentication:** JWT (JSON Web Tokens)
*   **AI Integration:** Google Generative AI (Gemini)

## � Folder Structure

```
RideMate-2/
├── package.json              # Frontend dependencies and scripts
├── server/                   # Backend Server Code
│   ├── config/               # Database configuration
│   ├── middleware/           # Express middleware (auth, error handling)
│   ├── models/               # Mongoose database models
│   ├── routes/               # API route definitions
│   ├── services/             # Business logic services
│   ├── utils/                # Utility functions (cron, geocoding)
│   ├── index.js              # Server entry point
│   └── package.json          # Backend dependencies
├── src/                      # Frontend Source Code
│   ├── components/           # Reusable UI components
│   │   ├── Chatbot/          # AI Chatbot component
│   │   ├── VoiceAssistant.tsx# Voice command interface
│   │   └── ...               # Other components (Button, Input, Maps, etc.)
│   ├── context/              # React Contexts (Auth, App State)
│   ├── hooks/                # Custom React hooks
│   ├── screens/              # Page components (Views)
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   ├── CreateRide.tsx    # Driver: Offer a ride
│   │   ├── SearchRide.tsx    # Rider: Find a ride
│   │   ├── Profile.tsx       # User profile
│   │   └── ...               # Other screens (Login, History, etc.)
│   ├── services/             # API client services
│   ├── styles/               # Global styles and CSS
│   ├── utils/                # Frontend utilities (Gemini, Date, etc.)
│   ├── App.tsx               # Main App component & Routing
│   └── main.tsx              # Entry point
└── ...                       # Config files (tsconfig, tailwind, vite)
```

## 🚀 Getting Started

### Prerequisites
*   Node.js (v16 or higher)
*   MongoDB (Local or Atlas connection string)
*   Google Gemini API Key (for AI features)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/RideMate.git
    cd RideMate
    ```

2.  **Setup Backend:**
    ```bash
    cd server
    npm install
    ```
    *   Create a `.env` file in the `server` directory with the following:
        ```env
        PORT=5001
        MONGO_URI=your_mongodb_connection_string
        JWT_SECRET=your_jwt_secret
        GEMINI_API_KEY=your_gemini_api_key
        ```
    *   Start the server:
        ```bash
        npm start
        ```

3.  **Setup Frontend:**
    *   Open a new terminal and go back to the root directory:
        ```bash
        cd ..
        npm install
        ```
    *   Start the development server:
        ```bash
        npm run dev
        ```

4.  **Access the App:**
    *   Open your browser and navigate to `http://localhost:5173`

## � API Documentation

The backend provides RESTful APIs for:
*   `/api/auth`: User authentication (Login, Signup)
*   `/api/rides`: Ride creation, searching, and management
*   `/api/bookings`: Seat booking and status updates
*   `/api/vehicles`: Vehicle management for drivers
*   `/api/chat`: Chat history and messaging
*   `/api/notifications`: User notifications

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## � License

This project is licensed under the ISC License.
