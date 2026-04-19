export const frontline_sc = {
  key: "frontline_sc",
  label: "Frontline (SC)",

  evaluate(input: any) {
    const {
      state,
      zip,
      distanceToCoast,
      buildYear,
      roofYear,
      roofType, // "composition" | "architectural" | "tile" | "metal" | "flat"
      policyType, // "HO" | "DP"
      mobileHome,
    } = input;

    const currentYear = new Date().getFullYear();
    const age = currentYear - buildYear;
    const roofAge = currentYear - roofYear;

    // --- State ---
    if (state !== "SC") {
      return { eligible: false, reason: "State not eligible" };
    }

    // --- ZIP Exclusions ---
    if (zip === "29455" || zip === "29454") {
      return { eligible: false, reason: "Ineligible ZIP for Frontline" };
    }

    // --- Mobile Homes ---
    if (mobileHome) {
      return { eligible: false, reason: "Mobile homes not eligible" };
    }

    // --- Policy Type ---
    if (!["HO", "DP"].includes(policyType)) {
      return { eligible: false, reason: "Invalid policy type" };
    }

    // --- Occupancy Rules ---
    if (policyType === "HO") {
      // HO = owner occupied only (no rental logic enforced here yet)
    }

    // --- Roof (HARD RULES) ---
    if (roofType === "composition" && roofAge > 15) {
      return { eligible: false, reason: "Composition roof over 15 years" };
    }

    if (roofType === "architectural" && roofAge > 20) {
      return { eligible: false, reason: "Architectural roof over 20 years" };
    }

    if (roofType === "flat" && roofAge > 15) {
      return { eligible: false, reason: "Flat roof over 15 years" };
    }

    if ((roofType === "tile" || roofType === "metal") && roofAge > 30) {
      return { eligible: false, reason: "Tile/Metal roof over 30 years" };
    }

    // --- Base Score ---
    let score = 0;

    if (policyType === "HO") {
      // HO scoring (weaker carrier)
      if (distanceToCoast <= 20) score = 5;
      else score = 6;
    }

    if (policyType === "DP") {
      // DP scoring (dominant carrier)
      if (distanceToCoast <= 5) score = 9;
      else if (distanceToCoast <= 20) score = 10;
      else if (distanceToCoast <= 50) score = 9;
      else score = 8;
    }

    // --- Reasons ---
    const reasons: string[] = [];

    if (policyType === "HO") {
      reasons.push("Moderate pricing in SC (HO)");
    }

    if (policyType === "DP") {
      reasons.push("Highly competitive DP pricing in SC");
    }

    if (age > 50) {
      reasons.push("Functional replacement cost applies");
    }

    return {
      eligible: true,
      score,
      reason: reasons.join(" | "),
    };
  },
};