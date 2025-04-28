import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import AdminModel from "./Admin.js";

mongoose.connect("mongodb://localhost:27017/dbtagle")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

const createAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const newAdmin = new AdminModel({
      username: "admin",
      password: hashedPassword,
    });
    const savedAdmin = await newAdmin.save();
    console.log("✅ Admin created:", savedAdmin);
  } catch (err) {
    console.error("Error creating admin:", err);
  } finally {
    mongoose.disconnect();
  }
};

createAdmin();
