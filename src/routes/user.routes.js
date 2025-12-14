import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(registerUser)
// router.route("/login").post(login) // login is not defined yet

// refer to this chat with claude.ai : https://claude.ai/share/91b6e4fd-0407-48ef-b9e2-8c06e89808b0

export default router;