import mongoose from "mongoose";

const connectDB   = async() =>{
 try{
         const Database   = process.env.Database_Url
        await  mongoose.connect(Database)
        console.log('mongoodb database connect successfully.')
 
    }catch(error){
        console.log("mongoose error :",error)
    }
   

}

 export default  connectDB;
 
