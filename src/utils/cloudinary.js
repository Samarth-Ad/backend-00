import { v2 as cloudinary } from "cloudinary";
import { error } from "console";
import fs from "fs"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { FILE_TYPES, RESOURCE_TYPES } from "../constants.js"


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper functions
const validFileType = function (fileType) {
    const validTypes = Object.values(FILE_TYPES)
    const normalizedType = fileType?.toLowerCase()

    if (!normalizedType || !validTypes.includes(normalizedType)) {
        throw new ApiError(
            400,
            `Invalid File-Type. Must be one of ${validTypes.join(", ")}`
        );
    }

    return normalizedType;

}

const getUploadConfig = function (fileType) {

    const isVideo = fileType == FILE_TYPES.VIDEO;
    const isThumbnail = fileType == FILE_TYPES.THUMBNAIL;

    const folder = (isVideo || isThumbnail) ? `video/${fileType}` : `user/${fileType}`;

    const resource_type = isVideo ? RESOURCE_TYPES.VIDEO : RESOURCE_TYPES.IMAGE;

    return { folder, resource_type }

}

const extractPublicIDFromURL = function (cloudinary_url) {

    if (!cloudinary_url || typeof (cloudinary_url) !== "string") {
        throw new ApiError(
            500,
            "Invalid Cloudinary URL, Couldn't extract public id from url."
        )
    }

    // example url : https://res.cloudinary.com/demo/image/upload/v1234567890/folder/filename.jpg

    const urlParts = cloudinary_url.split("/")

    const uploadIndex = urlParts.findIndex(part => part === "upload")

    if (uploadIndex === -1) {
        throw new ApiError(
            500,
            "Invalid Cloudinary URL, Couldn't uploadIndex from url."
        )
    }

    const pathParts = urlParts.slice(uploadIndex + 1)

    // removing version number 
    const startIndex = pathParts[0].startsWith("v" || 'V') ? 1 : 0
    const publicIdParts = pathParts.slice(startIndex)

    const publicIdWithExtension = publicIdParts.join("/");
    const publicId = publicIdWithExtension.substring(
        0,
        publicIdWithExtension.lastIndexOf(".")
    )

    return publicId;

}


// main functions
const uploadOnCloudinary = async (localFilePath, fileType) => {

    /**
   * Uploads a file to Cloudinary
   * @param {string} localFilePath - Path to the file in public/temp folder
   * @param {string} fileType - One of: "video", "thumbnail", "avatar", "coverImage"
   * @returns {Promise<Object>} Cloudinary upload response
   */

    try {
        if (!localFilePath) {
            // can also use fs.existssync(localFilePath) to check whether the actual file exists or not, instead of checking only file path 
            // throw new error("The file path doesn't exists");
            return null;
        }

        const normalizedFileType = validFileType(fileType)

        const { folder, resource_type } = getUploadConfig(normalizedFileType)


        // file uploading
        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: resource_type,
                folder: folder

            },

        )
        console.log("File is successfully uploaded on cloudinary : ", response.url)
        console.log(response)
        fs.unlinkSync(localFilePath)

        return {
            url: response.secure_url,
            publicId: response.public_id,
            resourceType: response.resource_type,
            format: response.format,
            width: response.width,
            height: response.height,
            bytes: response.bytes,
        };

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as upload got failed
        return null
    }
}

const deleteFromCloudinary = async (cloudinary_url, resourceType = "auto") => {

    /**
   * Deletes a file from Cloudinary
   * @param {string} cloudinaryUrl - Full Cloudinary URL or public_id
   * @param {string} resourceType - Resource type: "image", "video", (by default it's "auto")
   * @returns {Promise<Object>} Cloudinary deletion response
   */


    if (!cloudinary_url || !cloudinary_url.includes("cloudinary.com")) {
        throw new ApiError(
            400,
            "Cloudinary URL not found while deleting asset"
        )
    }

    try {
        const publicId = extractPublicIDFromURL(cloudinary_url)

        console.log(`Attempting to delete asset with public_id: ${publicId}`);

        const response = await cloudinary.uploader.destroy(
            publicId,
            {
                resource_type: resourceType,
                invalidate: true  // Clears all CDN caches immediately!
            }
        )

        if (response.result !== "ok") {
            throw new ApiError(
                500,
                `Deletion failed with result: ${response.result}`
            )
        }

        console.log(`Asset deleted successfully: ${publicId}`);


        return response;
    } catch (error) {
        console.error("Cloudinary deletion failed:", error);
        throw new ApiError(
            500,
            `Failed to delete file from Cloudinary: ${error.message}`
        );
    }

}

const getDurationOfVideo = async function(cloudinary_url){
    
    if(!cloudinary_url || !cloudinary_url.includes("cloudinary.com")){
        throw new ApiError(
            400,
            "Invalid cloudinary url, couldn't fetch duration of video asset"
        )
    }

    const public_id = extractPublicIDFromURL(cloudinary_url)
    console.log(public_id)
    try {
        const response = await cloudinary.api.resource(
            public_id,
            {
                resource_type : "video",
                media_metadata: true,
            }
        )
        // console.log(response)
        
        
        return response.duration ;
    } catch (error) {
        console.error("Cloudinary error while fetching the duration of video asset:", error);
    }
}
// testing function

// await getDurationOfVideo("video/video/kyrqjfbywksy6kcl0vdn");
// console.log(await getDurationOfVideo("video/video/kyrqjfbywksy6kcl0vdn"))

// console.log(await getDurationOfVideo("https://res.cloudinary.com/dqefhfoi3/video/upload/v1767684460/video/video/lzcewrfghlciidu1nwlr.mp4"))

export { uploadOnCloudinary, deleteFromCloudinary, getDurationOfVideo };