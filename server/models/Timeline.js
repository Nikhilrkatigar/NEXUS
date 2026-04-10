const mongoose = require("mongoose");

const timelineItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    time: {
      type: String,
      trim: true,
      default: ""
    },
    title: {
      type: String,
      trim: true,
      default: ""
    },
    desc: {
      type: String,
      trim: true,
      default: ""
    },
    color: {
      type: String,
      trim: true,
      default: "#f5a623"
    }
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "default"
    },
    items: {
      type: [timelineItemSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Timeline", timelineSchema);
