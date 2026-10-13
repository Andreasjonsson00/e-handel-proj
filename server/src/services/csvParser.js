import { parse } from "csv-parse/sync";

export function parseProductsCSV(csvData) {
  const records = parse(csvData, {
    columns: true,
    delimiter: ";",
    skip_empty_lines: true,
    bom: true,
    trim: true,
  });

  return records;
}