const express = require("express");
const router = express.Router();
const {
  createRoom,
  joinRoom,
  getUserRooms,
} = require("../controllers/room.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.post("/create", authMiddleware, createRoom);
router.post("/join", authMiddleware, joinRoom);
router.get("/get", authMiddleware, getUserRooms);

module.exports = router;
