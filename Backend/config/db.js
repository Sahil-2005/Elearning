const mongoose = require('mongoose');

async function connectDB(connectionString) {
  if (!connectionString) {
    throw new Error('MongoDB connection string is required');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(connectionString, {
    // useNewUrlParser and useUnifiedTopology are default true in Mongoose >=6
  });
  return mongoose.connection;
}

module.exports = { connectDB };


