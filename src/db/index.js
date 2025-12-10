import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async function () {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        //try to read this API
        // console.log(connectionInstance)
        console.log(`MongoDB Connected \n DB Host : ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MonogoDB connection error : ", error);
        process.exit(1);
    }
};

export default connectDB;