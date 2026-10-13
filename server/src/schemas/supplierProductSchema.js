import { z } from "zod";

export const supplierProductSchema = z.object({
  artNr: z.string().min(1),

  ean: z
    .union([z.string(), z.number()])
    .transform(String)
    .pipe(z.string().min(1)),

  benamning: z.string().min(1),

  kategori: z.string().min(1),

  pris: z.string().regex(/^\d+(,\d{2})?$/, {
    message: "Invalid price format",
  }),

  lagersaldo: z.union([z.string(), z.number()]).transform(String),

  varianter: z.union([z.string(), z.array(z.string())]),

  uppdaterad: z.string().min(1),

  valuta: z.string().optional(),
});
