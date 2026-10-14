import { z } from "zod";

export const productSchema = z.object({
  article_number: z.string().trim().min(1, {
    message: "Article number is required",
  }),
  name: z.string().trim().min(1, {
    message: "Product name is required",
  }),
  price: z.number().finite().positive({
    message: "Price must be a positive number",
  }),
  description: z.string().trim().min(1, {
    message: "Description is required",
  }),
  image_url: z.string().url().nullable(),
});