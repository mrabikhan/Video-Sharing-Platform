import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bycrpt from "bcrypt"
import "dotenv/config"

const userSchema = new mongoose.Schema({
    username:{
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true //the field becomes searchable and more optomized in mongoDB 
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname:{
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar:{
        type: String, //Cloudinary URL
        required: true
    },

    coverimage:{
        type: String //cloudinary URL
    },

    watchHistory:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    password:{
        type: String,
        required: [true, "Password must be strong"]
    },
    refreshToken:{
        type: String
    }
},{timestamps:true})

//Pre and Post Middleware:
//The Password will be encrypted on the time of saving using this method below:
userSchema.pre("save", async function(next){
    //Agar password modify nhi hua to next move ho jao! No tension.
    //But agar password modify hua hai to password ko hash kar k db ma save kar do.
    //Save methods comes in parameter of function, see above.
    if(!this.isModified("password")) return next()
    this.password = await bycrpt.hash(this.password, 10)
    next()
})

//Middleware methods to verify password and generating tokens
userSchema.methods.isPasswordCorrect = async function(password){
   return await bycrpt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function() {
return jwt.sign({ //Sign() function is used to generate jwt token.
    // Payload
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullnamee
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}
userSchema.methods.generateRefreshToken = function() {
return jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}
export const User = mongoose.model("User", userSchema);