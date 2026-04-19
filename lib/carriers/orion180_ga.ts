export const orion180_ga = {
  key: "orion180_ga",
  label: "Orion180 (GA)",

  evaluate(input: any) {
    const {
      state,
      distanceToCoast,
      buildYear,
      roofYear,
      policyType, // "HO"
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
    if (policyType !== "HO") {
      return { eligible: false, reason: "Only HO eligible" };
    }

    // --- Geographic (Inland Only) ---
    if (distanceToCoast <= 50) {
      return { eligible: false, reason: "Too close to coast (≤50 miles)" };
    }

    // --- Disqualifiers ---
    if (mobileHome) {
      return { eligible: false, reason: "Mobile homes not eligible" };
    }

    // --- Build ---
    if (buildYear < 1900) {
      return { eligible: false, reason: "Built prior to 1900" };
    }

    // --- Base Score ---
    let baseScore = 8;

    // --- Roof Penalty ---
    let roofPenalty = 0;

    if (roofAge > 30) roofPenalty = 4;
    else if (roofAge > 20) roofPenalty = 3;
    else if (roofAge > 10) roofPenalty = 2;
    else if (roofAge > 5) roofPenalty = 1;

    let score = baseScore - roofPenalty;

    // --- Floor ---
    if (score < 5) score = 5;

    // --- Reasons ---
    const reasons: string[] = [];

    reasons.push("Inland GA pricing tier (8)");

    if (roofPenalty > 0) {
      reasons.push(`Roof age penalty applied (-${roofPenalty})`);
      reasons.push("Older roof significantly impacts pricing");
    }

    return {
      eligible: true,
      score,
      reason: reasons.join(" | "),
    };
  },
};