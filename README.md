✨ Key Features
Role-Based Access Control:

User: Can schedule and view their own special waste collection requests.

Manager: Has access to view and monitor the collection schedules of all users registered in the system.

Dynamic Special Collection Scheduling:

Available Time Slots: After a user selects a date, the app fetches available time slots in real-time from the backend, preventing overbooking.

Map-Based Location Picker: Users can either pinpoint their location on a map or use the "Find Me" feature to automatically get their current GPS coordinates.

Dynamic Cost Calculation: The total fee is calculated based on a fixed fee plus a variable cost determined by the estimated weight of the waste.

Secure Payments: Integrated with the Stripe payment gateway (in a Test Environment) to handle credit card payments securely.

Schedule Viewing & Management:

Users can view a list of their own upcoming and past schedules.

Managers can view a comprehensive list of all schedules from all users.

Unit Testing: The backend business logic is thoroughly tested using Jest, achieving 100% code coverage for the primary controllers.

🛠️ Tech Stack
Category

Technology

Frontend

React Native, Expo, React Navigation (Stack & Bottom Tabs), Axios, @stripe/stripe-react-native

Backend

Node.js, Express.js, MongoDB, Mongoose, JWT, dotenv, stripe

Testing

Jest, Supertest

🚀 Setup and Installation
Follow these steps to set up and run the project on your local machine.

Prerequisites
Node.js (v18 or higher recommended)

npm (or yarn)

MongoDB (a local installation or a cloud instance like MongoDB Atlas)

Expo Go app on your mobile device (for running the frontend)

1. Backend Server Setup
# 1. Clone the project repository
git clone https://github.com/nethmiu/Y3S2WE35-CSSE.git

# 2. Navigate to the backend directory
cd waste_management/backend

# 3. Install the required dependencies
npm install

# 4. Create a .env file for environment variables
touch .env

Add the following configuration to your backend/.env file:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_strong_secret_for_jwt
STRIPE_SECRET_KEY=sk_test_... (Your Stripe Secret Key)

# 5. Start the backend server
npm start

The server should now be running on port 5002.

2. Frontend App Setup
# 1. Navigate to the frontend directory (in a new terminal)
cd waste_management/frontend

# 2. Install the required dependencies
npm install

# 3. Create a config.js file in the root of the frontend folder
touch config.js

Add the following configuration to your frontend/config.js file:

Important: Replace YOUR_COMPUTER_IP_ADDRESS with the local IP address of the machine running the backend server. You can find this using ipconfig on Windows or ifconfig on Mac/Linux.

const config = {
    IP: 'YOUR_COMPUTER_IP_ADDRESS', // e.g., '192.168.1.5'
    PORT: '5002',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_... (Your Stripe Publishable Key)',
};

export default config;

# 4. Start the Expo development server
npx expo start --clear

Now, scan the QR code shown in the terminal using the Expo Go app on your phone to run the application.

🧪 Testing
To run the backend unit tests and see the coverage report:

# 1. Navigate to the backend directory
cd waste_management/backend

# 2. Run the test script
npm test
