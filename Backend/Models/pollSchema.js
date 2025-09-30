const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema({
  teacherId: { type: String, required: true },
  question: { type: String, required: true },
  options:{ type: Map, of: Number, default: {} },
  correctAnswer:{type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  studentCount:{type: Number, default: 0},
  status: { type: String, enum: ["active", "inactive"], default: "active" },
});

const PollSchema = mongoose.model("PollSchema", pollSchema);
module.exports = PollSchema;
