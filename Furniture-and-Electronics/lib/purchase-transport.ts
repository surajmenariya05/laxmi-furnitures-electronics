/**
 * Utility functions for serializing and parsing transport / logistics details
 * (Vehicle Number & Transport Freight Amount) stored in Purchase records.
 *
 * Designed with 100% backward compatibility to seamlessly parse historical
 * purchase records (e.g. "Rj 09 BA 3112 (1500)") as well as modern tagged entries.
 */

export interface TransportDetails {
  vehicleNumber: string;
  transportAmount: number;
  generalNotes?: string;
}

/**
 * Parses raw purchase notes into structured transport details.
 * Supports:
 *  - Modern tagged format: "[TRANSPORT] Vehicle: RJ 09 BA 3112 | Amount: 1500 | Notes: ..."
 *  - Legacy parentheses format: "Rj 09 BA 3112 (1500)" or "RJ 09 BA 3112 (₹1,500)"
 *  - Legacy dash/colon format: "RJ-09-BA-3112 - 1500" or "RJ 09 BA 3112 : 1500"
 *  - Bare vehicle format: "RJ 09 BA 3112"
 *  - Plain text fallback: notes preserved as generalNotes
 */
export function parseTransportDetails(rawNotes?: string | null): TransportDetails {
  if (!rawNotes || typeof rawNotes !== "string") {
    return { vehicleNumber: "", transportAmount: 0 };
  }

  const trimmed = rawNotes.trim();
  if (!trimmed) {
    return { vehicleNumber: "", transportAmount: 0 };
  }

  // 1. Tagged structured format
  if (trimmed.startsWith("[TRANSPORT]")) {
    const vehicleMatch = trimmed.match(/Vehicle:\s*([^|\n]+)/i);
    const amountMatch = trimmed.match(/Amount:\s*([₹\d,.]+)/i);
    const notesMatch = trimmed.match(/Notes:\s*([\s\S]+)$/i);

    const vehicleNumber = vehicleMatch ? vehicleMatch[1].trim() : "";
    let transportAmount = 0;
    if (amountMatch) {
      const cleanAmt = amountMatch[1].replace(/[^\d.]/g, "");
      transportAmount = parseFloat(cleanAmt) || 0;
    }
    const generalNotes = notesMatch ? notesMatch[1].trim() : undefined;

    return {
      vehicleNumber,
      transportAmount,
      generalNotes,
    };
  }

  // 2. Legacy parentheses format: "Rj 09 BA 3112 (1500)" or "RJ 09 BA 3112 (₹1,500)"
  const parenMatch = trimmed.match(/^([A-Za-z0-9\s-]+?)\s*\(\s*(?:₹|Rs\.?)?\s*([0-9,.]+)\s*\)$/i);
  if (parenMatch) {
    const vehicle = parenMatch[1].trim();
    const cleanAmt = parenMatch[2].replace(/[^\d.]/g, "");
    return {
      vehicleNumber: vehicle,
      transportAmount: parseFloat(cleanAmt) || 0,
    };
  }

  // 3. Legacy dash or colon format: "RJ 09 BA 3112 - 1500" or "RJ-09-BA-3112 : 1500"
  const dashMatch = trimmed.match(/^([A-Za-z0-9\s-]+?)\s*[-:]\s*(?:₹|Rs\.?)?\s*([0-9,.]+)\s*$/i);
  if (dashMatch) {
    const vehicle = dashMatch[1].trim();
    const cleanAmt = dashMatch[2].replace(/[^\d.]/g, "");
    return {
      vehicleNumber: vehicle,
      transportAmount: parseFloat(cleanAmt) || 0,
    };
  }

  // 4. Standalone vehicle number format (e.g. "RJ 09 BA 3112" or "DL 1C 1234")
  const isVehicleFormat = /^[A-Za-z]{2}\s*[-]?\s*\d{1,2}\s*[-]?[A-Za-z]{0,3}\s*[-]?\s*\d{3,4}$/i.test(trimmed);
  if (isVehicleFormat) {
    return {
      vehicleNumber: trimmed,
      transportAmount: 0,
    };
  }

  // 5. Unstructured note fallback
  return {
    vehicleNumber: "",
    transportAmount: 0,
    generalNotes: trimmed,
  };
}

/**
 * Serializes vehicle number and transport freight amount into a standardized note string.
 * Format: "[TRANSPORT] Vehicle: RJ 09 BA 3112 | Amount: 1500"
 */
export function serializeTransportNotes(
  vehicleNumber?: string,
  transportAmount?: number | string,
  generalNotes?: string
): string {
  const v = vehicleNumber?.trim();
  const rawAmt = typeof transportAmount === "number" ? transportAmount : parseFloat(String(transportAmount || ""));
  const hasAmt = !isNaN(rawAmt) && rawAmt > 0;
  const notes = generalNotes?.trim();

  // If neither vehicle nor transport freight provided, preserve plain notes if any
  if (!v && !hasAmt) {
    return notes || "";
  }

  const parts: string[] = [];
  if (v) {
    parts.push(`Vehicle: ${v.toUpperCase()}`);
  }
  if (hasAmt) {
    parts.push(`Amount: ${rawAmt}`);
  }
  if (notes) {
    parts.push(`Notes: ${notes}`);
  }

  return `[TRANSPORT] ${parts.join(" | ")}`.trim();
}
