const API_URL = "https://leverantor-api.vercel.app/v1/export";

export async function fetchElectronicsCSV() {
  const response = await fetch(`${API_URL}/products.csv?bransch=elektronik`, {
    headers: {
      "X-Api-Key": process.env.SUPPLIER_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch supplier CSV: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();

  const decoder = new TextDecoder("windows-1252");
  const csvData = decoder.decode(buffer);

  return csvData;
}

export async function fetchElectronicsXML() {
  const response = await fetch(
    `${API_URL}/products.xml?bransch=elektronik`,
    {
      headers: {
        "X-Api-Key": process.env.SUPPLIER_API_KEY,
      },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch supplier XML: ${response.status}`);
  }

  return await response.text();
}