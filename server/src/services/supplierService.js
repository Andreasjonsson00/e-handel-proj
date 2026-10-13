const API_URL = "https://leverantor-api.vercel.app/v1/export/products.csv";
export async function fetchElectronicsCSV() {
  const response = await fetch(`${API_URL}?bransch=elektronik`, {
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
