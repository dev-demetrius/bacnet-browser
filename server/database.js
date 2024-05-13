const { MongoClient } = require("mongodb");

const url = "mongodb://localhost:27017";
const client = new MongoClient(url);
const mongoose = require("mongoose");

const connectDatabase = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/bacnet", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        throw err; // This will prevent the app from starting if the database connection fails
    }
};

module.exports = { connectDatabase };
