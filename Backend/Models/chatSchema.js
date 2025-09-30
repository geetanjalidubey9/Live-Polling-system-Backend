const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  pollId: { type: mongoose.Schema.Types.ObjectId, ref: "Poll", required: true },
  senderId: { type: String, required: true },
  senderName: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Message= mongoose.model("Message", messageSchema);
module.exports= Message;