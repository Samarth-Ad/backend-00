import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const registerUser = asyncHandler(async (req, res) => {

    //step 1 : get user details from frontend (for this case we'll use postman since we don't have frontend ready with us) 

    //step 2 : validation of the data
    //         Checking for cases like "does user with this email/username already exists or not "


    //step 3 : Check id images have been uploaded to cloudinary or not
    //         Especially we'll check for avatar field, since it's required 


    //step 4 : Create user object - create entry in DB

    //step 5 : remove password and refresh token from the response

    //step 6 : check for user creation

    //step 7 : return response


    // if the data is coming from FORMs and in JSON format, (we'll deal with data coming from URL later)

    const { fullName, email, username, password } = req.body
    console.log("email : ", email)
    // console.log("password : ",password)

    // if (fullName === ""){
    //     throw ApiError(
    //         statusCode = 400,
    //         message = "Full Name is empty"
    //     )
    // }

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(
            statusCode = 400,
            message = "All fields are required to be filled",

        )
    }

    const userExisted = User.findOne({
        $or: [{ username }, { email }]
    })

    if (userExisted) {
        throw new ApiError(
            statusCode = 409,
            message = "User with email or username Already exists!"
        )
    }

    // File handling
    console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(
            400,
            "Avatar File is required"
        );
    }

    // Upload images in cloudianry 
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(
            400,
            "Avatar File is required"
        );
    };

    const user = await User.create({
        username: username.toLowerCase(),
        avatar: avatar.url,
        email: email,
        fullName: fullName,
        coverImage: coverImage?.url || ""
    });
    console.log(User.findById(user._id))

    const userCreated = await User.findById(user._id).select(
        "-password -refreshTokens"
    );

    if (!userCreated) {
        throw new ApiError(
            500,
            "Something went wrong during registration of user"
        )
    }
    console.log(user)

    // Final response
    return res.statusCode(201).json(
        new ApiResponse(
            statusCode = 201,
            data = user,
            message = "User Successfully registered"
        )
    )

})

export { registerUser }