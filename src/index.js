import mongoose from "mongoose";
import "dotenv/config";
import connectDB from "./db/index.js";
import app from "./app.js";
connectDB()

.then(() => {
 app.listen(process.env.PORT || 8000, () => {
   console.log(`Server is listening on port: ${process.env.PORT}`);
 app.on("Error: ", (error) => {
   console.log("Error: ", error);
   throw error
 })  
 })
})
.catch((error) => {
   console.log("MongoDB Connection Failed: ", error);
})

/*
;(async() => {
   try {
   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)  //URI comes from env file.
   app.on("Error: ", (error) => {
      console.log("Error: ", error);
      throw error;
   }) 
   app.listen(process.env.PORT, () => {
      console.log(`The App is Listening on port: ${process.env.PORT}`)
   })
  } catch (error) {
    console.error("Error: ", error);
    throw error;
   }
})() //iife function (This function invokes immidiately)
*/