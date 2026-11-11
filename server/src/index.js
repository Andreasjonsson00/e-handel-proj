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
import shippingRoutes from "./routes/shippingRoutes.js";
import issuesRouter from './routes/issuesRoutes.js'
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api/stripe/webhook", stripeRoutes);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("API is running");
});

app.use("/api/auth", authRoutes);
app.use('/api/admin/issues', issuesRouter)
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/shipping", shippingRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
