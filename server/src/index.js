import express from "express";
import "dotenv/config";
import cors from "cors";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import currencyRoutes from "./routes/currencyRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";

const app = express();

app.use(cors());

app.use("/api/stripe/webhook", stripeRoutes);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/checkout", checkoutRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
