import { frankfurterSchema } from "../schemas/currencySchema.js";
import { z } from "zod";

const baseUrl = "https://api.frankfurter.dev/v1";
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

let cache = null;
let cacheTime = 0;
const cacheSeconds = Number(process.env.CURRENCY_CACHE_SECONDS || 3600);

async function getRates(base = "SEK", symbols = "EUR,USD,GBP") {
  const url = new URL(`${baseUrl}/latest`);
  url.searchParams.set("base", base);
  url.searchParams.set("symbols", symbols);

  const now = Date.now();

  if (cache && now - cacheTime < cacheSeconds * 1000) {
    return cache;
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response;
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new Error(`No response from ${url} within 5000 ms (timeout)`);
      }

      throw new Error(`Could not reach ${url} (network error)`, {
        cause: err,
      });
    }

    if (response.ok) {
      const data = await response.json();

      const parsed = frankfurterSchema.safeParse(data);

      if (!parsed.success) {
        throw new Error(
          `Invalid response from Frankfurter API: ${z.prettifyError(parsed.error)}`,
        );
      }

      cache = parsed.data;
      cacheTime = Date.now();
      return cache;
    }

    if (!RETRYABLE.has(response.status) || attempt === MAX_ATTEMPTS) {
      throw new Error(
        `${url} responded with status ${response.status} ${response.statusText}`,
      );
    }

    console.warn(
      `Status ${response.status}, attempt ${attempt} of ${MAX_ATTEMPTS}. Trying again in 1 second.`,
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Failed to fetch ${url}`);
}

export default getRates;
