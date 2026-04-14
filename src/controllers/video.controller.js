import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary, getDurationOfVideo } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js"
import mongoose from "mongoose";


// Completed 
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

    const videoFile = await uploadOnCloudinary(videoFileLocalPath, "video")
    if (!videoFile) {
        throw new ApiError(
            400,
            "Video File is required"
        );
    };

    const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath, "thumbnail")
    if (!thumbnail) {
        await deleteFromCloudinary(videoFile.url, "video")
        throw new ApiError(
            400,
            "Thumbnail File is required"
        );
    };


    console.log(videoFile)
    const duration = videoFile?.duration
    console.log(duration)

    // if (duration === undefined || duration <= 0) {
    //     await deleteFromCloudinary(videoFile.url,"video")
    //     await deleteFromCloudinary(thumbnail.url,"image")
    //     throw new ApiError(
    //         400,
    //         "Video's length is less than or equal to zero or is undefined"
    //     )
    // }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title: title,
        description: description,
        duration: await getDurationOfVideo(videoFile.url),
        owner: user_id
    })

    // const videoCreated = await Video.findById(video._id)

    if (!video) {
        await deleteFromCloudinary(videoFile.url, "video")
        await deleteFromCloudinary(thumbnail.url, "video")
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

const deleteVideo = asyncHandler(async function (req, res) {

    const { videoId } = req.params
    const userId = req.user?._id

    const video = await Video.findById(videoId)
    console.log(video)
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const videoCloudinaryURL = video.videoFile
    const thumbnailURL = video.thumbnail

    const videoOwner = video.owner
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this video");
    }

    await Promise.all([
        deleteFromCloudinary(video.videoFile, "video"),
        deleteFromCloudinary(video.thumbnail, "image")
    ])

    try {
        await Video.findOneAndDelete({
            _id: videoId,
            owner: userId
        })
    } catch (error) {
        console.log("Couldn't delete the video instance from DB")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Successfully deleted video"
        )
    )

})

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    const pipeline = [];

    const defaultCriteria = {
        isPublished: true
    };

    // Search
    if (query) {
        defaultCriteria.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    // User filter
    if (userId) {
        if (!mongoose.isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid User");
        }
        defaultCriteria.owner = new mongoose.Types.ObjectId(userId);
        // allow all videos of that user
        delete defaultCriteria.isPublished;
    }
    pipeline.push({ $match: defaultCriteria });

    // Sorting
    const sortField = {};
    sortField[sortBy || "createdAt"] = sortType === "asc" ? 1 : -1;
    pipeline.push({ $sort: sortField });

    // Join with users
    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            username: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        }
    );

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const paginatedVideos = await Video.aggregatePaginate(
        Video.aggregate(pipeline),
        options
    );

    if (!paginatedVideos) {
        throw new ApiError(500, "Couldn't fetch videos");
    }

    return res.status(200).json(
        new ApiResponse(200, paginatedVideos, "Successfully fetched videos")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(
            400,
            "Invalid Video ID"
        )
    }

    const pipeline = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
                isPublished: true
            }
        },
        //Joining Owner
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        // 3. Flatten owner array
        {
            $addFields:{
                owner:{
                    $first: "$owner"
                }
            }
        }
    ];

    const video = await Video.aggregate(pipeline)

    // 4.Check result
    if(!video || video.length === 0){
        throw new ApiError(404, "Video not found");
    }

    // 5. Return first item
    return res.status(200).json(
        new ApiResponse(
            200,
            video[0],
            "Video fetched successfully"
        )
    );

})

const updateVideoDetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const {title,description} = req.body

    // 1. validate ID 
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(
            400,
            "Invalid video ID"
        )
    }

    // 2. Getting video
    const video = await Video.findById(videoId)

    if(!videoId){
        throw new ApiError(
            404,
            "Couldn't find the video"
        )
    }

    // 3. Ownership check
    if(video.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(
            403,
            "Unauthorized to update this video"
        )
    }

    // 4. Handling thumbnail
    let newThumbnailUrl;

    const thumbnailFileLocalPath = req.file?.path || req.files?.thumbnailFile?.[0]?.path;

    // Can't use this because updating thumbnail is optional
    // if (!thumbnailFileLocalPath){
    //     throw new ApiError(
    //         400,
    //         "Couldn't find new file thumbnail"
    //     )
    // }

    if(thumbnailFileLocalPath){
        const uploadedThumbnail = await uploadOnCloudinary(
            thumbnailFileLocalPath,
            "thumbnail"
        )

        if (!uploadedThumbnail) {
            throw new ApiError(500, "Failed to upload new thumbnail");
        }

        newThumbnailUrl = uploadedThumbnail.url

        // Delete old thumbnail
        await deleteFromCloudinary(video.thumbnail,"image")

        video.thumbnail = newThumbnailUrl
    }

    // 5. Update fields
    if(title){
        video.title = title;
    }
    if(description){
        video.title = description;
    }
    video.thumbnail = newThumbnailUrl

    // 6. Save
    await video.save()

    // 7. returning response
    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Video updated successfully"
        )
    );

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;

    // 1. Validate ID
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // 2. Find video
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // 3. Ownership check
    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized to update this video");
    }

    // 4. Toggle publish status
    video.isPublished = !video.isPublished;

    // 5. Save
    await video.save();

    // 6. Response
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                isPublished: video.isPublished
            },
            `Video is now ${video.isPublished ? "published" : "unpublished"}`
        )
    );
});



export {
    uploadVideo,
    getAllVideos,
    updateVideoDetails,
    getVideoById,
    deleteVideo,
    togglePublishStatus
}