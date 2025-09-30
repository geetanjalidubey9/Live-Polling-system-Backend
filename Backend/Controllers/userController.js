const Joi = require("joi");
const Service = require("../Service/Services");

async function createPollController(req, res) {
  try {
    const schema = Joi.object({
      role: Joi.string().valid("teacher").required(),
      teacherId: Joi.string().required(),
      question: Joi.string().required(),
      options: Joi.array().items(Joi.string().required()).min(2).required(),
      correctAnswer: Joi.string().required()
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    const savedPoll = await Service.createPollService({ ...value, status: "active" });
    res.status(201).json({ success: true, poll: savedPoll });
  } catch (err) {
    console.error("Error creating poll:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}

async function getAllPollsController(req, res) {
  try {
    const polls = await Service.getAllPollsService();
    if (!polls || polls.length === 0) {
      return res.status(404).json({ success: false, message: "No polls found" });
    }
    res.status(200).json({ success: true, polls });
  } catch (err) {
    console.error("Error fetching polls:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}

async function StudentAnsController(req, res) {
  try {
    const schema = Joi.object({
      role: Joi.string().valid("student").required(),
      studentId: Joi.string().required(),
      studentName: Joi.string().required(),
      answer: Joi.string().required(),
      pollId: Joi.string().required(),
      studentCount: Joi.number().optional()
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    const { pollId, studentId, answer } = value;
    const existingAnswer = await Service.findStudentAnswer({ pollId, studentId });
    if (existingAnswer) {
      return res.status(400).json({ success: false, message: "This student already submitted answer for this poll" });
    }
    const studentAns = await Service.StudentAnsService(value);
    const { poll, percentages } = await Service.updatePollAnswerService(pollId, answer);
    res.status(201).json({ success: true, studentAns, poll, percentages });
  } catch (err) {
    console.error("Error submitting student answer:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}

async function chatController(req, res) {
  try {
    const schema = Joi.object({
      senderId: Joi.string().required(),
      senderName: Joi.string().required(),
      pollId: Joi.string().required(),
      message: Joi.string().required()
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    const user = await Service.chatService(value);
    res.status(201).json({ success: true, user });
  } catch (err) {
    console.error("Error creating chat message:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}

async function pollResultsController(req, res) {
  try {
    const { pollId } = req.params;
    if (!pollId) {
      return res.status(400).json({ success: false, message: "pollId is required" });
    }
    const pollResults = await Service.getPollResultService(pollId);
    res.status(200).json({ success: true, pollResults });
  } catch (err) {
    console.error("Error fetching poll results:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}


module.exports = { createPollController, StudentAnsController, chatController, pollResultsController, StudentAnsController,getAllPollsController };

