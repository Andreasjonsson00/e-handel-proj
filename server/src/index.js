import express from "express";
import "dotenv/config";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import currencyRoutes from "./routes/currencyRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});

app.use(authRoutes);
app.use(productRoutes);
app.use(orderRoutes);
app.use(currencyRoutes);

app.use((err, req, res, next) => {
  const message = err instanceof Error ? err.message : String(err);

  console.error(`${req.method} ${req.originalUrl} failed: ${message}`);

  res.status(500).json({
    error: "Something went wrong on the server",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
