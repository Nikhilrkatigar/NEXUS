const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    selected: { type: Number, default: null }, // option index (0–3)
    reason: { type: String, default: "" },
    correct: { type: Boolean, required: true }
  },
  { _id: false }
);

const assessmentResultSchema = new mongoose.Schema(
  {
    registerNumber: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    timeTaken: { type: Number, required: true }, // seconds
    violations: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["completed", "disqualified", "auto-submitted"],
      default: "completed"
    },
    answers: [answerSchema],
    ip: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssessmentResult", assessmentResultSchema);
