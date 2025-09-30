const express=require('express');
const cors=require('cors');
const http = require("http");
const { Server } = require("socket.io");
const compression=require('compression');
const helmet= require('helmet');
const app=express();
const userRoutes=require('./routes/userRoute');
const PORT=process.env.PORT||8000;
app.use(helmet())
app.use(express.json());
app.use(compression());
app.use(cors())
const connectDB = require("./config/dbConnection");
app.use("/api/users", userRoutes);
require('dotenv').config();
connectDB();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const pollStudentCount = {};
const pollAnswerCount = {};  
const pollAnswers = {};    
const pollStudentSockets = {};
const activePoll={};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  socket.on("create-poll", ({ pollData }) => {
    try {
      if (!pollData) {
        throw new Error("Invalid poll data");
      }
      const { pollId } = pollData;
      activePoll[pollId] = true;
      console.log("Poll created:", pollData);
      io.emit("new-poll", { pollId, ...pollData }); 
    } 
    catch (err) {
      console.error("Error in create-poll event:", err.message);
      socket.emit("error", { message: err.message });
    }
});

socket.on("teacher-join", ({pollId, teacherId}) => {
  console.log("Teacher joined poll:", pollId, "teacherID:", teacherId);
  socket.join(pollId);
  if (pollStudentSockets[pollId]) {
    const studentList = Object.entries(pollStudentSockets[pollId]).map(
      ([id, data]) => ({ studentId: id, studentName: data.studentName })
    );
    io.to(pollId).emit("update-student-list", studentList);
  }
});

socket.on("student-join", ({ studentName, studentId, pollId}) => {
  try {
    if (!studentId || !studentName || !pollId) throw new Error("studentData is required");
    socket.join(pollId);
    if (!pollStudentSockets[pollId]) pollStudentSockets[pollId] = {};
    pollStudentSockets[pollId][studentId] = { socketId: socket.id, studentName };
    pollStudentCount[pollId] = Object.keys(pollStudentSockets[pollId]).length;
    const studentList = Object.entries(pollStudentSockets[pollId]).map(
      ([id, data]) => ({ studentId: id, studentName: data.studentName })
    );
      io.to(pollId).emit("update-student-list", studentList);
    console.log(`Student ${studentName} joined poll ${pollId}`);
  } 
  catch (err) {
    console.error(err.message);
    socket.emit("error", { message: err.message });
  }
});

socket.on("remove-student", ({ pollId, studentId }) => {
  console.log("student is removed")
  try {
    if (!pollStudentSockets[pollId] || !pollStudentSockets[pollId][studentId]) return;
    const { socketId } = pollStudentSockets[pollId][studentId];
    io.to(socketId).emit("kicked", { message: "You are removed from the poll" });
    delete pollStudentSockets[pollId][studentId];
    pollStudentCount[pollId] = Object.keys(pollStudentSockets[pollId]).length;
    const studentList = Object.entries(pollStudentSockets[pollId]).map(
      ([id, data]) => ({ studentId: id, studentName: data.studentName })
    );
    io.to(pollId).emit("update-student-list", studentList);
    console.log(`Student ${studentId} removed from poll ${pollId}`);
  } catch (err) {
    console.error(err.message);
    socket.emit("error", { message: err.message });
  }
});

socket.on("submit-answer", ({ studentId, pollId, options,answer }) => {
  try {
    if (!studentId || !answer || !pollId || !options) throw new Error("StudentId, answer, pollId or options missing");
    if (!pollAnswerCount[pollId]) pollAnswerCount[pollId] = 0;
    if (!pollAnswers[pollId]) {
      pollAnswers[pollId] = {};
      options.forEach(opt => (pollAnswers[pollId][opt] = 0));
    }
    pollAnswerCount[pollId]++;
    pollAnswers[pollId][answer]++;
    console.log(`Answer received from ${studentId} for poll ${pollId}:`, answer);
        const totalAnswers = pollAnswerCount[pollId];
    const studentCount = Object.keys(pollStudentSockets[pollId] || {}).length;
    const percentages = {};
    for (const opt of options) {
      percentages[opt] = studentCount > 0 ? ((pollAnswers[pollId][opt] / totalAnswers) * 100).toFixed(2) : "0.00";
    }
    io.to(pollId).emit("poll-update", {
      studentId,
      answer,
      answerCount: pollAnswerCount[pollId],
      studentCount,
      percentages
    });
    console.log("active poll or not",activePoll[pollId]);
    if (pollAnswerCount[pollId] >= studentCount) {
        activePoll[pollId] = false;
        console.log("active poll or not",activePoll[pollId]);
      io.to(pollId).emit("poll-complete", {
        message: "All students answered!",
        percentages,
        totalStudents: studentCount
      });
      delete pollStudentCount[pollId];
      delete pollAnswerCount[pollId];
      delete pollAnswers[pollId];
      delete pollStudentSockets[pollId];
    }
  } 
  catch (err) {
    console.error(err.message);
    socket.emit("error", { message: err.message });
  }
});

// Inside io.on("connection", socket) { ... }

const pollChats = {}; // Store messages per poll

// Event: Join chat (same as joining poll room)
socket.on("join-chat", ({ pollId, studentId, studentName }) => {
  if (!pollId || !studentId || !studentName) return;

  socket.join(pollId); // Join the poll room

  // Initialize chat array for this poll if not exists
  if (!pollChats[pollId]) pollChats[pollId] = [];

  // Optionally send existing chat history to this student
  socket.emit("chat-history", pollChats[pollId]);

  console.log(`${studentName} joined chat for poll ${pollId}`);
});

// Event: Send chat message
socket.on("send-chat", ({ pollId, studentId, studentName, message }) => {
  if (!pollId || !studentId || !message) return;
  const chatMessage = {
    studentId,
    studentName,
    message,
    timestamp: new Date().toISOString(),
  };
if (!pollChats[pollId]) pollChats[pollId] = [];
pollChats[pollId].push(chatMessage);
socket.to(pollId).emit("receive-chat", chatMessage);

  console.log(`Message from ${studentName} in poll ${pollId}: ${message}`);
});

socket.on("disconnect", () => {
  console.log("Client disconnected:", socket.id);
  io.emit("student-left", { socketId: socket.id });
});
});

server.listen(PORT, () => {
console.log(`Server is listening on port ${PORT}`);
});
