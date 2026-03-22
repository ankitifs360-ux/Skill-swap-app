import mongoose from "mongoose";
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    skillsToTeach:[String],
    skillsToLearn:[String],
    ratings:[Number],
    reputation:{
        type:Number,
        default:0
    },
    avatar:{
        type:String,
        default:"",
    }
},{timestamps:true})

export default mongoose.model("User",userSchema);