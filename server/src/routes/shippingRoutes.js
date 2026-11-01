import express from "express";
import {
  calculateTransitTime,
  findServicePoints,
} from "../integrations/shippingAdapter.js";
import { postalCodeSchema } from "../schemas/postalCodeSchema.js";
import { transitTimeQuerySchema } from "../schemas/shippingSchema.js";

const router = express.Router();

// Validera postnumret från klienten

// GET /api/shipping/service-points?postalCode=13230
router.get("/service-points", async (req, res) => {
  const result = postalCodeSchema.safeParse(req.query.postalCode);

  if (!result.success) {
    return res.status(400).json({
      message: "Ogiltigt postnummer.",
      errors: z.flattenError(result.error),
    });
  }

  try {
    const servicePoints = await findServicePoints(result.data);

    return res.status(200).json({
      data: servicePoints,
    });
  } catch (error) {
    console.error("[SHIPPING] Kunde inte hämta ombud:", error.message);

    return res.status(502).json({
      message: "Det gick inte att hämta PostNord-ombud. Försök igen senare.",
    });
  }
});

// GET /api/shipping/transit-time?postalCode=13230&shippingMethod=pickup
router.get("/transit-time", async (req, res) => {
  const result = transitTimeQuerySchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      message: "Ogiltiga uppgifter för leveranstidsberäkning.",
      errors: result.error.flatten(),
    });
  }

  try {
    return res.status(200).json({
      data: await calculateTransitTime(result.data),
    });
  } catch (error) {
    console.error("[SHIPPING] Kunde inte beräkna leveranstid:", error.message);
    return res.status(error.message.includes("not configured") ? 503 : 502).json({
      message: "Det gick inte att beräkna leveranstiden just nu.",
    });
  }
});

export default router;
