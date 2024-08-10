/*
Challenges:
 
1. User Subscribed the channels
2. How many people subscribed to that user
3. Button shows subcribe if the channel is not subscribed.
4. The button shows subscribed if the channel is subscribed.

[Same Channel count se subscribers] milte han aur [Same subscribers count se channels] milte han.
Every time a new document is formed.
*/

import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber:{
      type: Schema.Types.ObjectId, //One who is subscribing
      ref: "User"
    },
    channel:{
      type: Schema.Types.ObjectId, 
      ref: "User" 
    },

},{timestamps:true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema);