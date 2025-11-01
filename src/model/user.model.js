import mongoose, { Schema } from "mongoose"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";


const userSchema = new Schema({
	fullName: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	avatar: {
		type: String,
	},
	role: {
        type: String,
        enum: ["USER", "ADMIN"],
        default: "USER"
    },
	password: {
		type: String,
		required: true,
	},
	refreshToken: {
		type: String,
	},
	subscription: {
		id: String,
		status : String
	}

},{timestamps: true})

// Pre-save  for password hashing
userSchema.pre("save", async function(next){
	if(!this.isModified("password")) return next();
	this.password = await bcrypt.hash(this.password, 10)
	next();
})
//check password
userSchema.methods.isPasswordCorrect = async function(password) {
	return await bcrypt.compare(password, this.password);
}

//access token generate
userSchema.methods.generateAccessToken = function() {
	return jwt.sign(
		{
			_id:this._id,
			email: this.email,
			username:this.username,
			fullName:this.fullName
		},
			process.env.ACCESS_TOKEN_SECRET ,
		{
			expiresIn : process.env.ACCESS_TOKEN_EXPIRY,
		}
	)
}

userSchema.methods.generateRefreshToken = function() {
	return jwt.sign(
		{
			_id:this._id,
			
		},
			process.env.REFRESH_TOKEN_SECRET ,
		{
			expiresIn : process.env.REFRESH_TOKEN_EXPIRY,
		}
	)
}

export const User = mongoose.model("User", userSchema);