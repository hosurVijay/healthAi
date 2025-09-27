import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
} from "../controller/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", authenticate, logoutUser);

export default router;
