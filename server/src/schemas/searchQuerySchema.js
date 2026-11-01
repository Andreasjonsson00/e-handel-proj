import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().max(100).default(""),
  category: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1), // '2' => 2
  pageSize: z.coerce.number().int().min(1).max(50).default(10), // max '50' => 50
});