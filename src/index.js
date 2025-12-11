// require('dotenv').config({path : "./env"})
import dotenv from "dotenv";
dotenv.config({ path: "./env" })
import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 8000;

// This connectDB function returns a promise so in .then we'll initialize our express app as the promise is consumed and resolved
connectDB()
    .then(() => {
        try {
            app.listen(PORT, () => {
                console.log(`Server is listening at http://localhost:${PORT}`);
            })
        } catch (error) {
            console.log(error)
        }
    })
    .catch((error) => {
        console.log("Connection failed :(")
        console.log(error);
    });




/*
// This approach is fine but not professional at all
// const connectDB = function (){
    
// }

// connectDB();

//Instead we use IIFE -> Immediately Invoked Function Expression
// Immediately executed (invoked) on the spot.


import express from "express";
const app = express();
(async ()=>{
    try {
        await mongoose.connect(`${DB_URI}/${DB_NAME}`);
        // In-case the express app couldn't connect to DB 
        app.on("error",(error)=>{
            console.log("Error : ",error);
            throw error;
        })

        app.listen(PORT,()=>{
            console.log(`App is listening on PORT : ${PORT}`);
        })
    } catch (error) {
        console.log(error);
        throw error;
    }
})()
*/