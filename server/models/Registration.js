const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: ""
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    department: {
      type: String,
      enum: ["HR", "Marketing", "Finance", ""],
      default: ""
    }
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true
    },
    college: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true,
      default: ""
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    event: {
      type: String,
      required: true,
      trim: true
    },
    faculty: {
      type: String,
      trim: true,
      default: ""
    },
    facultyPhone: {
      type: String,
      trim: true,
      default: ""
    },
    leader: {
      type: String,
      required: true,
      trim: true
    },
    participants: {
      type: [participantSchema],
      default: []
    },
    sourceIp: {
      type: String,
      trim: true,
      default: ""
    },
    category: {
      type: String,
      enum: ["", "Dance", "Ramp Walk", "Cultural"],
      default: ""
    },
    departmentBreakdown: {
      HR: { type: Number, default: 0 },
      Marketing: { type: Number, default: 0 },
      Finance: { type: Number, default: 0 }
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "verified"],
      default: "pending"
    },
    paymentScreenshot: {
      type: String,
      trim: true,
      default: ""
    },
    paymentScreenshotPath: {
      type: String,
      trim: true,
      default: ""
    },
    paymentVerifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Registration", registrationSchema);
