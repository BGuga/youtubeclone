import express from "express";

const videoRouter = express.Router();

videoRouter.get("/watch", handleWatchVideo);

const handleWatchVideo = (req, res) =>res.send("Watch Video");

