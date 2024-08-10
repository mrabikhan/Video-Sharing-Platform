import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// This middleware just verify that the user is logged in or not.
export const verifyJWT = asyncHandler (async (req, res, next) => {
try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
      //A Bearer token is a type of token used for authentication and authorization and is used in web applications
      //and APIs to hold user credentials and indicate authorization for requests and access. 
      if(!token){
        throw new ApiError(401, "Unauthorized Access")
      }
    
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      const user = await User.findById(decodedToken?._id).select("-password, -refreshToken")
      if(!user){
        throw new ApiError(401, "Invalid Access Token")
      }

      req.user = user
      next() //passing control to next middleware
} catch (error) {
    throw new ApiError(401, error?.message || "invalid access token")
}
})