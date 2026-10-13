import { z } from "zod";

export const supplierProductSchema = z.object({
  artNr: z.string().min(1),
  ean: z.string().min(1),
  benamning: z.string().min(1),
  kategori: z.string().min(1),
  pris: z.string().regex(/^\d+(,\d{2})?$/, "Invalid price format"),
  lagersaldo: z.string(),
  varianter: z.string(),
  uppdaterad: z.string(),
});