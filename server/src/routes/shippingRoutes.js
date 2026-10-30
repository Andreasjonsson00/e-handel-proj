import express from "express";
import { z } from "zod";
import { findServicePoints } from "../integrations/shippingAdapter.js";

const router = express.Router();

// Validera postnumret från klienten
const PostalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, {
    message: "Postnumret måste bestå av fem siffror.",
  });


// GET /api/shipping/service-points?postalCode=13230
router.get("/service-points", async (req, res) => {
  const result = PostalCodeSchema.safeParse(req.query.postalCode);

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

export default router;
