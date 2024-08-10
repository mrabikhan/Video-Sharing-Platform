import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import "dotenv/config"

//Generating Access and Refresh Token:
const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken() //They are methods thats why we use () while using methods
        const refreshToken = user.generateRefreshToken()
        //We only store refresh token in database
        user.refreshToken = refreshToken // storing refresh token in db
        await user.save({validateBeforeSave:false}) // save data in mongodb
        return{accessToken, refreshToken} //returning the tokens
    }
    catch(error){
      throw new ApiError(500,"Something went wrong while generating access and refresh token")
    }
}

//Register a user:
// Steps to create/register a user in backend:
// Get user details from frontend
// validation - not empty
// check if user already exist: username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object - create entry in DB
// remove password and refresh token field from response
// check for user creation
// return res

const registerUser = asyncHandler(async (req, res) => {
    //Object Destructuring:
    const {fullname, email, password, username} = req.body //req.body accepts json or form data
    //console.log("email: ", email);
    //console.log("password: ", password);
    //console.log("fullname: ", fullname);

    //Checking if the user leave any field empty:
    if([fullname, email, password, username].some((field) => field?.trim() === ""))
    {
    throw new ApiError(400, "All fields are required");
    }

//This statement checks wheather the user exist in database or not by using the email and username:
    const userExist = await User.findOne({
    $or: [{email},{username}] //The or: is a mongoDB operator used to check the existence with email or username.
})

//If the above statement failed to find the user then return an error:
if(userExist){
   throw new ApiError(409, "User With this email and username already exist");
}

// Creating Local Path to upload data on cloudinary:
const avatarLocalPath = req.files?.avatar[0]?.path  // ? optional chaining for undefined and null values mostly used when we don't know it have data or not
const coverLocalPath = req.files?.coverimage[0]?.path
//console.log(req.files.coverimage)

//These statements are used to avoid undefined value in case user did'nt upload the cover photo:
// let coverLocalPath;
// if(req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.lenght > 0){
//   coverLocalPath = req.files.coverimage[0].path
// }

//console.log(avatarLocalPath) // It gives the local path
//console.log(coverLocalPath)

if(!avatarLocalPath){
    throw new ApiError(400, "Avatar is required")
}

//Upload files on cloudinary:
const avatar = await uploadOnCloudinary(avatarLocalPath) // Async Is used on top where we use asyncHandler.
const coverimage = await uploadOnCloudinary(coverLocalPath)
//console.log(avatar)
//console.log(coverimage) // it gives the response and information about the data uploaded on cloudinary.

if(!avatar){
    throw new ApiError(400, "Avatar is required")
}

const user = await User.create({
    fullname, 
    avatar: avatar.url,                 //The URL comes from "return response" in cloudinary file 
    coverimage: coverimage?.url || "",  //we use optional chaining method because we did'nt put 
    // any if statement or validation on coverimage, in case if user forget to upload the cover
    // image this statement handles all the issues.
    email,
    password,
    username: username.toLowerCase()
})

//whenever a user is created in mongoDB it automatically creates its Id which is stored in _id col.
const createUser = await User.findById(user._id).select("-password -refreshToken");
 // This statement is used to verify that user is created or not.
 //select method is used to tell the server that don't send these fields along with other details of user like name, email, avatar etc.

if(!createUser){
    throw new ApiError(500, "Somthing went wrong while registering user");
}

// This is the final step to submit the final respons by using apirespnse.
return res.status(201).json(
    new ApiResponse(200, createUser, "The user is create successfully")
)
})

//Login User:
// get data from req body (form or frontend)
// username or email for login
// find the user
// password check
// access and refresh token
// send tokens in cookies
const loginUser = asyncHandler( async (req, res) =>{
 
  const{email, username, password} = req.body
  if(!username && !email){
    throw new ApiError(400, "Username Or Email are required")
  }

  //Checking for user existence
  const user = await User.findOne({
    $or: [{email},{password}]
  }) 

  if(!user){
    throw new ApiError(404, "User not exist")
  }
  
  //Checking for password Validity
  const isPasswordValid = await user.isPasswordCorrect(password)
  if(!isPasswordValid){
    throw new ApiError(401, "Incorrect Password Entered")
  }  
  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  //Sending Cookies:
  const options = {
      httpOnly: true, //This enable the cookies to modify only by server/backend not by the frontend/client
      secure: true
  }

  return res.status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
    200,
    {
     user: loggedInUser, accessToken, refreshToken
    },
    "User Logged In Successfully"
  ))
})

//Logout User:
const  logoutUser = asyncHandler(async(req, res) => {
   await User.findByIdAndUpdate( 
//findOneandUpdate updates the first matching document in the collection that matches the filter    
    req.user._id,
    {
        $set: { refreshToken: undefined }
        //$unset: {refreshToken: 1}
    },
    {
        $new: true
    }
   )

   const options = {
    httpOnly:true,
    secure: true
   }

   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "User logged Out Successfully"))
})

// Refresh the Access Token:
const refreshTheAccessToken = asyncHandler (async (req, res) => {
   const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken // OR operator for mobile app
   if(!incomingRefreshToken){
    throw new ApiError(401, "Unauthorized Request")
   }
   //This statement decode or decrypt the hash value coming from jwt into readable json format. 
try {
       const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
       const user =  await User.findById(decodedToken?._id)

       if(!user){
        throw new ApiError(401,"Invalid Refresh Token")
       }

       if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"Refresh Token is Expired")
       }

      const options = {
        httpOnly: true,
        secure: true
       }

      const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

      return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access Token Refreshed"
        )
      )
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token") //error?.message is use to decode the error message and show it.
}
})

// We update password like this because we want to use hooks which are in user model.
// Hooks are Pre hooks that verify and encrpt the password. 
const changeCurrentPassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body // the data coming from the frontend fields.
    
    if(!(newPassword === confirmPassword)){
       throw new ApiError(401, "Password did'nt match")
    }

    const user = await User.findById(req.user?._id) 
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw ApiError(400, "Invalid Old Password")
    }

    //the new password in password field
    user.password = newPassword
    //Now save the new password
    await user.save({validateBeforeSave:false}) 
    
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"))
})

const getCurrentUser = asyncHandler (async (req, res) => {
     const user = await User.findById(req.user?._id)
    // const user = await User.findOne(req.user).select("-password") //fetch all the details of logged in user.
     return res
    .status(200)
    .json(new ApiResponse(200, user.username, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler (async (req, res) => {
    const {fullname, email} = req.body
    if(!fullname || !email){
        throw new ApiError(400, "All Fields are required")
    }

    const user = await User.findByIdAndUpdate
    (
    req.user?._id,
    { 
      $set:{ //set operator is used to update data in database
        fullname: fullname,
        email: email
      }
    },
    { new: true }    
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully" ))
}) //These all updation are for Text Based Data.

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar File Is Missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400, "Error While Uploading Avatar")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar is updated successfully" ))
})

const updateUserCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "CoverImage file is missing")
    }

    const coverimage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverimage.url){
        throw new ApiError(400, "Error while uloading the cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverimage:coverimage.url
            }
        },
        {new: true}
    )
    return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image is updated successfully" ))
})

const getCurrentUserProfile = asyncHandler( async (req, res) => {
    const{username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "User Not Found")
    }

    //MongoDB Pipelines:
    const channel = await User.aggregate([{
    $match:{
      username: username?.toLowerCase() //matching username in database
    }
    },
    {
    $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
    }
    },
    {
    $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subcriber",
        as:"subscribedTo"
    }
    },
    {
    $addFields:{
        subscribersCount:{
           $size: "$subscribers" //count the number of subscribers this channel have.
        },
        channelSubscribedToCount:{
           $size: "$subscribedTo" //count the number of to whom channel this channel subscribed to.
        },
        isSubscribed:{ //This pipeline return true and false if the user visiting any channel can see if he subscribe that channel or not.
            $cond:{
                if:{
                    /*
                    We have the current logged in user in " req.user?._id ".
                    ye statement check kare gi k kya jo user channel profile 
                    visit kar raha usne us particular channel ko subscribe kia
                    hua hai ya nhi. ye statement all subscribers ma se us particular
                    subscribe ko find kare gi aur agar find ho gya to button pe
                    subscribed show ho ga.
                    */
                    $in: [req.user?._id, "$subscribers.subscriber"],
                },
                then: true,
                else: false
        }
    }
  }
},
{
     $project:{
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1 ,
        coverimage: 1,
        email: 1
     }
    }
])
    
    if(!channel) //agar channel ki lenght nhi hai to:
    { 
      throw new ApiError(404, "User does not exist")
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async(req,res)=>{
      const user = await User.aggregate([
        {
        $match:{
            _id: new mongoose.Types.ObjectId(req.user._id)
            },  
       },
       {
        $lookup: {
        from: "videos",    
        localField: "watchHistory",
        foreignField: "_id",
        as:"watchHistory",
        //Sub pipeline:
        pipeline:[
            {
                $lookup:{
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as:"owner",
                    pipeline: [
                        {
                                $project:{
                                    fullname: 1,
                                    username: 1,
                                    avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields:{
                    owner: {
                      //arrayElementAt: "$owner"
                       $first: "$owner"
                    }
                }
            }
        ]
       }
    }

    ])    
    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
    )
})

export {
     registerUser,
     loginUser,
     logoutUser, 
     refreshTheAccessToken, 
     getCurrentUser,
     changeCurrentPassword,
     updateAccountDetails,
     updateUserAvatar,
     updateUserCoverImage,
     getCurrentUserProfile,
     getWatchHistory
    }; 