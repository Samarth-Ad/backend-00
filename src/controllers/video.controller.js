import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js"



const uploadVideo = asyncHandler(async function (req, res) {

    const { title, description } = req.body

    // if (!user) {
    //     throw new ApiError(
    //         404,
    //         "User not found, while uploading the video"
    //     )
    // }
    const user_id = req.user?._id

    console.log(req.files)

    const videoFileLocalPath = req.files?.videoFile[0]?.path
    if (!videoFileLocalPath) {
        throw new ApiError(
            400,
            "Video file not found"
        )
    }


    const thumbnailFileLocalPath = req.files?.thumbnailFile[0]?.path
    if (!thumbnailFileLocalPath) {
        throw new ApiError(
            400,
            "Thumbnail file not found"
        )
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath,"video")
    if (!videoFile) {
        throw new ApiError(
            400,
            "Video File is required"
        );
    };

    const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath,"thumbnail")
    if (!thumbnail) {
        await deleteFromCloudinary(videoFile.url,"video")
        throw new ApiError(
            400,
            "Thumbnail File is required"
        );
    };



    const duration = videoFile?.duration
    if (duration === undefined || duration <= 0) {
        await deleteFromCloudinary(videoFile.url,"video")
        await deleteFromCloudinary(thumbnail.url,"image")
        throw new ApiError(
            400,
            "Video's length is less than or equal to zero or is undefined"
        )
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title: title,
        description: description,
        duration: duration,
        owner: user_id
    })

    // const videoCreated = await Video.findById(video._id)

    if (!video) {
        await deleteFromCloudinary(videoFile.url,"video")
        await deleteFromCloudinary(thumbnail.url,"video")
        throw new ApiError(
            500,
            "Video couldn't be saved in DB"
        )
    }

    res
        .status(201)
        .json(
            new ApiResponse(
                201,
                "Video uploaded successfully!"
            )
        )
})

export {
    uploadVideo
}