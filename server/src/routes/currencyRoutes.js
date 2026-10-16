import express from "express";
import getCurrency from "../controllers/currencyController.js";

const router = express.Router();

router.get("/", getCurrency);

export default router;
