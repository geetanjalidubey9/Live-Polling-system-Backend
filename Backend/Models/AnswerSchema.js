const mongoose = require("mongoose");
const answerSchema = new mongoose.Schema({
  pollId: { type: mongoose.Schema.Types.ObjectId, ref: "Poll", required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  answer: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Answer = mongoose.model("Answer", answerSchema);
module.exports=Answer