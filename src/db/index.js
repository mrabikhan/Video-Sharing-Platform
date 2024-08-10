import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"
import "dotenv/config";

const connectDB = async () => {
   try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`); //URI comes from env file.
    console.log(`\n MongoDB Connected !! DB Host ${connectionInstance.connection.host}`)
       } catch (error) {
    console.log("MongoDB Connection ERROR: ", error);
    process.exit(1);
   }
}

export default connectDB;