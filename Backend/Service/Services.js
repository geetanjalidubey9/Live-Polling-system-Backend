const Poll = require('../Models/pollSchema');
const StudentAns = require('../Models/AnswerSchema');
const userChats = require('../Models/chatSchema');

async function createPollService({ role, teacherId, question, options,correctAnswer}) {
  try {
        const optionsMap = {};
        options.forEach(opt => {
          optionsMap[opt] = 0;
        });
        console.log("Creating poll with:", { role, teacherId, question, options:optionsMap,correctAnswer});
        const poll = new Poll({ role, teacherId, question, options:optionsMap,correctAnswer});
        await poll.save();
        console.log("Poll created successfully:", poll);
        return poll;
  } 
  catch (err) {
    console.error("Error creating poll:", err);
    throw err;
  }
}
async function findStudentAnswer({ pollId, studentId }) {
  return await StudentAns.findOne({ pollId, studentId });
}

async function StudentAnsService({ role, studentId, studentName, answer, pollId }) {
  try {
    console.log("Saving student answer:", { role, studentId, studentName, answer, pollId });
    const StudentData = new StudentAns({ role, studentId, studentName, answer, pollId });
    await StudentData.save();
    console.log("Student answer saved:", StudentData);
    return StudentData;
  } 
  catch (err) {
    console.error("Error saving student answer:", err);
    throw err;
  }
}
async function getPollResultService(pollId) {
  try {
    const poll = await Poll.findById(pollId);
    const totalAnswers = Array.from(poll.options.values()).reduce((a, b) => a + b, 0);
    const optionsResult = {};
    for (const [option, count] of poll.options.entries()) {
      optionsResult[option] = {
        count,
        percentage: totalAnswers ? ((count / totalAnswers) * 100).toFixed(2) : "0.00",
      };
    }
    return {
      pollId: poll._id,
      question: poll.question,
      status: poll.status,
      totalAnswers,
      options: optionsResult,
    };
  } catch (err) {
    console.error("Error in getPollResultService:", err.message);
    throw err;
  }
}

async function updatePollAnswerService(pollId, selectedOption) {
  try {
    const poll = await Poll.findById(pollId);
    if (!poll.options.has(selectedOption)) {
      poll.options.set(selectedOption, 0);
    }
    poll.options.set(selectedOption, poll.options.get(selectedOption) + 1);
    poll.studentCount = (poll.studentCount || 0) + 1;
    await poll.save();
    const totalAnswers = Array.from(poll.options.values()).reduce((a, b) => a + b, 0);
    const percentages = {};
    for (const [opt, count] of poll.options.entries()) {
      percentages[opt] = ((count / totalAnswers) * 100).toFixed(2);
    }
    return { poll, percentages };
  } catch (err) {
    console.error("Error in updatePollAnswerService:", err.message);
    throw err;
  }
}

async function chatService({ senderId, senderName, pollId, message }) {
  try {
    console.log("Saving chat message:", { senderId, senderName, pollId, message });
    const chatMessage = new userChats({ senderId, senderName, pollId, message });
    await chatMessage.save();
    console.log("Chat message saved:", chatMessage);
    return chatMessage;
  } catch (err) {
    console.error("Error saving chat message:", err);
    throw err;
  }
}

async function getAllPollsService() {
  try {
    return await Poll.find().sort({ createdAt: -1 });
  } catch (err) {
    throw err;
  }
}


module.exports = { createPollService,StudentAnsService, chatService,findStudentAnswer,updatePollAnswerService,getPollResultService,getAllPollsService};
