import { z } from "zod";

export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, {
    message: "Postnumret måste bestå av fem siffror.",
  });