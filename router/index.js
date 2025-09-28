import express from "express";
import { fetchGoogle } from "../controller/googleController.js";

const router = express.Router();

// GET /api/raw-google?q=QUERY&start=N
router.post("/raw-google", fetchGoogle);

export default router;
