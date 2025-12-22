import { v2 as cloudinary } from "cloudinary";
import { error } from "console";
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) { // can also use fs.existssync(localFilePath) to check whether the actual file exists or not, instead of checking only file path 
            // throw new error("The file path doesn't exists");
            return null;
        }
        // file uploading
        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "auto"
            }
        )
        console.log("File is uploaded on cloudinary : ",response.url)
        console.log(response)
        fs.unlinkSync(localFilePath)

        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as upload got failed
        return null
    }
}

export {uploadOnCloudinary};