import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = new Router();

router.route("/videos").post(verifyJWT, )
export default router;