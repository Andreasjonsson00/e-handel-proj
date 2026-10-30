import { z } from "zod";

export const postNordAnswerSchema = z.object({
  servicePointInformationResponse: z.object({
    servicePoints: z.array(
      z.object({
        servicePointId: z.string(),
        name: z.string(),
        visitingAddress: z.object({
          streetName: z.string(),
          streetNumber: z.string().optional(),
          city: z.string(),
          postalCode: z.string(),
        }),
      }),
    ),
  }),
});