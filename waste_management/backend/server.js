const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');


dotenv.config();


// Now, import the route files after the environment variables are loaded.
const userRoutes = require('./routes/userRoutes');
const specialCollectionRoutes = require('./routes/specialCollectionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const binRoutes = require('./routes/binRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const collectorRoutes = require('./routes/collectorRoutes');



const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB using the URI from the .env file
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected!'))
.catch((err) => console.error('MongoDB connection error:', err));

// Main Route
app.get('/', (req, res) => {
  res.send('Eco Pulse API is running...');
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/collections', specialCollectionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/bins', binRoutes);
app.use('/api/collector', collectorRoutes);
app.use('/api/regular-collections', collectionRoutes);



const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
