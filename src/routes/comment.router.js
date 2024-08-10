import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = new Router();

router.route("/comments").post(verifyJWT, )
export default router;