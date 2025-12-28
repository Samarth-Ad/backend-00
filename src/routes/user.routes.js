import { Router } from "express";
import { loginUser, logOutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

// refer to this chat with claude.ai : https://claude.ai/share/91b6e4fd-0407-48ef-b9e2-8c06e89808b0
router.route("/register").post(
    // MiddleWare -1
    upload.fields([
        //Avatar
        {
            name: "avatar",
            maxCount: 1,
        },
        //Cover image
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    // MiddleWare - 2
    registerUser
)

router.route("/login").post(
    loginUser
)


// secured routes 
router.route("/logout").post(verifyJWT,logOutUser)
router.route("/refresh-token").post(refreshAccessToken)


export default router;