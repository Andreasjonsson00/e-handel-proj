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

export const postNordTransitTimeSchema = z.array(
  z.object({
    isBookable: z.boolean(),
    isSupported: z.boolean(),
    service: z.object({
      basicServiceCode: z.string(),
      name: z.string(),
    }),
    // Unsupported additional services only contain service + status, without ETA.
    estimatedTimeOfArrival: z
      .object({
        dateOfDeparture: z.string(),
        timeOfArrival: z.string(),
        timeOfDeparture: z.string(),
      })
      .optional(),
  }),
);

export const transitTimeQuerySchema = z.object({
  postalCode: z.string().trim().regex(/^\d{5}$/),
  shippingMethod: z.enum(["pickup", "home_delivery"]),
});
