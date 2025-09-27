import { DB_NAME } from "../constant.js";
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log(
      `MongoDB connect!! : DB Name: ${connectInstance.connection.host}`
    );
  } catch (error) {
    console.log("Connection Faliled!!", error);
    process.exit(1);
  }
};
export default connectDB;
