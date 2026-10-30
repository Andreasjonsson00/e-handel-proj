// Adapter for the carrier (PostNord). The ONLY file that knows PostNord's key, URL and answer.
//
// TIMEOUT AND ERRORS – the common requirement in Labb 5:
//   - The request gives up after 5 s, and a status that isn't 2xx or an unexpected answer → we throw
//   - The routes catch it and answer 502. The customer can still order with home delivery.

import { z } from "zod";

const API_KEY = process.env.POSTNORD_API_KEY ?? "";
// The sandbox. In production: https://api2.postnord.com/...
const URL =
  "https://atapi2.postnord.com/rest/businesslocation/v5/servicepoints/nearest/byaddress";

if (!API_KEY) {
  throw new Error(
    "PostNord is not configured. Copy .env.example to .env and fill in POSTNORD_API_KEY.",
  );
}

// PostNord's answer – shortened, PostNord sends a lot more per service point:
//   {
//     "servicePointInformationResponse": {
//       "servicePoints": [
//         {
//           "servicePointId": "376062",
//           "name": "ICA KVANTUM GISLAVED",
//           "routeDistance": 0,
//           "visitingAddress": { "streetName": "Stinsgatan", "streetNumber": "2", "postalCode": "33230", "city": "GISLAVED", ... },
//           "openingHours": { ... },
//           "coordinates": [ ... ],
//           ...
//         }
//       ]
//     }
//   }
//
// In your shop: validate the answer with Zod before you use it – only the fields you use
// (servicePointId, name, visitingAddress). An unexpected answer → throw, so the route answers 502.
// The walkthrough skips it and trusts the answer – any = TypeScript doesn't know its shape until it's validated.

// The part of PostNord's answer we use – PostNord sends a lot more per service point.
// Zod checks it: if the answer isn't what we expect, we get a clear error here instead of undefined in React.
const PostNordAnswer = z.object({
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

/* --- The 5 service points nearest a postal code --- */
export async function findServicePoints(postalCode) {
  const params = new URLSearchParams({
    apikey: API_KEY, // PostNord takes the key in the URL – never log the URL
    returnType: "json",
    countryCode: "SE",
    postalCode: postalCode,
    numberOfServicePoints: "5",
  });

  // TIMEOUT: fetch has no timeout of its own – give up after 5 s
  const response = await fetch(`${URL}?${params}`, {
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    throw new Error(`PostNord answered ${response.status}`);
  }

  // 1. In your shop: validate PostNord's answer with the PostNordAnswer schema above before you use it.
  // const answer = PostNordAnswer.safeParse(await response.json())
  // if (!answer.success) {
  //   throw new Error(`Unexpected answer from PostNord: ${z.prettifyError(answer.error)}`)
  // }

  // The walkthrough reads the answer WITHOUT validating it – any = TypeScript doesn't know its shape.
  const result = PostNordAnswer.safeParse(await response.json());

  if (!result.success) {
    throw new Error(
      `Unexpected answer from PostNord: ${z.prettifyError(result.error)}`,
    );
  }

  const answer = result.data;

  // PostNord's format → OUR model
  const servicePoints =
    answer.servicePointInformationResponse.servicePoints.map((point) => ({
      id: point.servicePointId,
      name: point.name,
      address: `${point.visitingAddress.streetName} ${point.visitingAddress.streetNumber}, ${point.visitingAddress.city}`,
    }));
  console.log(
    `\n[POSTNORD] ${servicePoints.length} service points near ${postalCode}`,
  );
  console.log(
    `\n[POSTNORD] JSON answer: ${JSON.stringify(servicePoints, null, 2)}`,
  );
  return servicePoints;
}
