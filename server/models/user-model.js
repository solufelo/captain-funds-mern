import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  phone: { type: String, maxlength: 40 },
  location: { type: String, maxlength: 80 },
  bio: { type: String, maxlength: 500 },
  website: { type: String, maxlength: 200 },
  lastLogin: { type: Date },
  timeStamp: { type: Date, default: Date.now },
});

// Never leak password hashes through toJSON (res.json).
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

export default UserModel;
