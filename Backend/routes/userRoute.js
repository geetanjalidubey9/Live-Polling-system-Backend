const userController=require('../Controllers/userController')
const express = require("express");
const router = express.Router();
router.post("/create-poll", userController.createPollController);
router.post('/student-ans',userController.StudentAnsController)
router.post('/chat',userController.chatController);
router.get("/results/:pollId", userController.pollResultsController);
router.get("/get-allpolls", userController.getAllPollsController);
module.exports = router;