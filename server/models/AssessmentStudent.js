const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const assessmentStudentSchema = new mongoose.Schema(
  {
    registerNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    hasAttempted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

assessmentStudentSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

assessmentStudentSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model("AssessmentStudent", assessmentStudentSchema);
