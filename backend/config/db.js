const mongoose = require('mongoose');

global.useMockDB = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/auth_db', {
      serverSelectionTimeoutMS: 2000, // Fail fast in 2 seconds if no local mongo is running
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.useMockDB = false;
  } catch (error) {
    console.warn(`\n⚠️  MongoDB connection failed: ${error.message}`);
    console.warn(`👉 FALLBACK: Starting in Mock Mode using local JSON files for data persistence!\n`);
    global.useMockDB = true;
  }
};

module.exports = connectDB;
