const mongoose = require("mongoose");

async function connectDB() {
  try {
    mongoose.connect(
      `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@cluster0.ndsc2x9.mongodb.net/?appName=Cluster0`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Mongodb connected");
  } catch (error) {
    console.error("Mongodb connection error:", error.message);
    throw error;
  }
}

module.exports = connectDB;
