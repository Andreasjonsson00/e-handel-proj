import {
  postNordAnswerSchema,
  postNordTransitTimeSchema,
} from "../schemas/shippingSchema.js";

const API_KEY = process.env.POSTNORD_API_KEY ?? "";
const ORIGIN_POSTAL_CODE = process.env.POSTNORD_ORIGIN_POSTAL_CODE ?? "";

// The sandbox. In production: https://api2.postnord.com/...
const URL =
  "https://atapi2.postnord.com/rest/businesslocation/v5/servicepoints/nearest/byaddress";
const TRANSIT_TIME_ADDRESS_TO_ADDRESS_URL =
  "https://atapi2.postnord.com/rest/transport/v2/transittime/addresstoaddress";
const TRANSIT_TIME_ADDRESS_TO_LOCATION_URL =
  "https://atapi2.postnord.com/rest/transport/v2/transittime/addresstolocation";

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
  const result = postNordAnswerSchema.safeParse(await response.json());

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
  return servicePoints;
}

function getStartTime() {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Stockholm",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:00`;
}

function toTransitTime(result, serviceCode) {
  const transitTime = result.find(
    (item) =>
      item.isBookable &&
      item.isSupported &&
      item.estimatedTimeOfArrival &&
      item.service.basicServiceCode === serviceCode,
  );

  if (!transitTime) {
    throw new Error("PostNord returned no bookable transit time for this service.");
  }

  const eta = transitTime.estimatedTimeOfArrival;
  const transitDays = Math.max(
    1,
    Math.ceil(
      (Date.parse(eta.timeOfArrival) - Date.parse(eta.timeOfDeparture)) /
        (24 * 60 * 60 * 1000),
    ),
  );

  return {
    serviceCode,
    serviceName: transitTime.service.name,
    departureDate: eta.dateOfDeparture,
    deliveryDate: eta.timeOfArrival.slice(0, 10),
    transitDays,
  };
}

async function fetchTransitTime(url, params, serviceCode) {
  const response = await fetch(`${url}?${params}`, {
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    throw new Error(`PostNord transit time answered ${response.status}`);
  }

  const parsed = postNordTransitTimeSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("Unexpected response from PostNord transit time.");
  }

  return toTransitTime(parsed.data, serviceCode);
}

export async function calculateTransitTime({ postalCode, shippingMethod }) {
  if (!/^\d{5}$/.test(ORIGIN_POSTAL_CODE)) {
    throw new Error(
      "PostNord transit time is not configured. Set POSTNORD_ORIGIN_POSTAL_CODE.",
    );
  }

  const startTime = getStartTime();

  if (shippingMethod === "pickup") {
    const params = new URLSearchParams({
      apikey: API_KEY,
      startTime,
      serviceCodes: "19",
      serviceGroup: "SE",
      originPostCode: ORIGIN_POSTAL_CODE,
      originCountryCode: "SE",
      destinationPostCode: postalCode,
      destinationCountryCode: "SE",
    });

    return fetchTransitTime(
      TRANSIT_TIME_ADDRESS_TO_ADDRESS_URL,
      params,
      "19",
    );
  }

  // V2's address-to-location endpoint needs a PostNord production point.
  // Resolve the closest service point for the supplied delivery postal code.
  const [nearestPoint] = await findServicePoints(postalCode);
  if (!nearestPoint) {
    throw new Error("PostNord returned no destination production point.");
  }

  const params = new URLSearchParams({
    apikey: API_KEY,
    startTime,
    serviceCodes: "17",
    serviceGroup: "SE",
    originPostCode: ORIGIN_POSTAL_CODE,
    originCountryCode: "SE",
    destinationProductionPointId: nearestPoint.id,
    destinationProductionPointType: "servicepoint",
    destinationCountryCode: "SE",
  });

  return fetchTransitTime(
    TRANSIT_TIME_ADDRESS_TO_LOCATION_URL,
    params,
    "17",
  );
}
