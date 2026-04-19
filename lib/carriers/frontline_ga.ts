export const frontline_ga = {
  key: "frontline_ga",
  label: "Frontline (GA)",

  evaluate(input: any) {
    const {
      state,
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
    if (state !== "GA") {
      return { eligible: false, reason: "State not eligible" };
    }

    // --- Policy Type ---
    if (!["HO", "DP"].includes(policyType)) {
      return { eligible: false, reason: "Invalid policy type" };
    }

    // --- Mobile Homes ---
    if (mobileHome) {
      return { eligible: false, reason: "Mobile homes not eligible" };
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

    // --- Base Score (DTC) ---
    let score = 0;

    if (distanceToCoast <= 25) score = 10;
    else if (distanceToCoast <= 50) score = 9;
    else score = 8;

    // --- New Build Adjustment ---
    if (age <= 2) {
      score -= 1;
    }

    // --- Floor ---
    if (score < 5) score = 5;

    // --- Reasons ---
    const reasons: string[] = [];

    reasons.push("Highly competitive pricing in GA");

    if (age <= 2) {
      reasons.push("Slightly weaker on brand new construction");
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