//The Goal Of this file:
// File comes from the file system (already uploaded on local server)
//It gives me a localpath of file (The file on local server)

import { v2 as cloudinary } from "cloudinary"; //as keyword is use to assign a name to your package
import fs from "fs"
import "dotenv/config"

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => { 
    try{
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto" //resource type can be a video, image, raw etc.
        })
        //console.log("The data is uploaded", response.url);
        fs.unlinkSync(localFilePath);
        //console.log(response)
        return response;
     }
     catch(error){
        console.log(error);
        fs.unlinkSync(localFilePath); // remove the locally saved temporary file as operation got failed.
        return null; 
    }
}

export {uploadOnCloudinary};













