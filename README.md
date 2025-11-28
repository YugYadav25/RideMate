# RideMate - Smart Ride Sharing Platform

RideMate is a modern, full-stack ride-sharing application designed to connect riders and drivers seamlessly. It focuses on accessibility, safety, and ease of use, featuring a unique Voice Assistant for hands-free navigation and a smart AI Chatbot powered by Google Gemini.

## 🌟 Key Features

### For Everyone
*   **Dual Role System:** Seamlessly switch between Rider and Driver modes with a single account.
*   **Smart Voice Assistant:** Navigate the app and perform actions using voice commands (e.g., "Book a ride to Downtown", "Show my history").
*   **AI Chatbot:** Integrated AI assistant for support, ride queries, and general assistance.
*   **Real-time Tracking:** Live GPS tracking for active rides using Leaflet maps.
*   **Secure Authentication:** JWT-based secure login and registration.
*   **User Profiles:** Comprehensive profiles with ratings, ride history, and preferences.

### For Drivers
*   **Ride Management:** Create and publish rides with custom routes, dates, and seat availability.
*   **Vehicle Management:** Add and manage multiple vehicles.
*   **Request Management:** Accept or reject ride requests from riders.

### For Riders
*   **Smart Search:** Find rides based on origin, destination, and date.
*   **Booking System:** Easy seat booking with instant status updates.
*   **Ride History:** View past rides and details.

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

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites
*   **Node.js** (v16 or higher)
*   **MongoDB** (Local instance or Atlas connection string)
*   **Google Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com/))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/RideMate.git
    cd RideMate
    ```

2.  **Setup Backend:**
    Navigate to the server directory, install dependencies, and configure environment variables.
    ```bash
    cd server
    npm install
    ```

    Create a `.env` file in the `server` directory with the following variables:
    ```env
    PORT=5001
    MONGO_URI=mongodb://localhost:27017/ridemate  # Or your MongoDB Atlas URI
    JWT_SECRET=your_super_secret_jwt_key
    GEMINI_API_KEY=your_google_gemini_api_key
    ```

    Start the backend server:
    ```bash
    npm start
    ```
    The server should be running on `http://localhost:5001`.

3.  **Setup Frontend:**
    Open a new terminal, navigate to the root directory (if you are in `server`, go back up), and install dependencies.
    ```bash
    cd ..
    npm install
    ```

    (Optional) Create a `.env` file in the root directory if you need to override the API URL:
    ```env
    VITE_API_URL=http://localhost:5001/api
    ```

    Start the development server:
    ```bash
    npm run dev
    ```
    The application should now be running on `http://localhost:5173`.

## 📂 Project Structure

For a detailed breakdown of the project structure and file descriptions, please refer to [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).

## 📡 API Documentation

The backend provides RESTful APIs for the following resources:

*   **Auth:** `/api/auth` - Login, Signup, Profile
*   **Rides:** `/api/rides` - Create, Search, Get Rides
*   **Bookings:** `/api/bookings` - Book seats, Manage requests
*   **Vehicles:** `/api/vehicles` - Manage driver vehicles
*   **Chat:** `/api/chat` - AI Chatbot interaction
*   **Notifications:** `/api/notifications` - User notifications

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Team

*   **Jinay Shah**
*   **Smit**
*   **Tirth**
*   **Yug Yadav**
