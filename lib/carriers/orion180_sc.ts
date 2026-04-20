export const orion180_sc = {
  key: "orion180_sc",
  label: "Orion180 (SC)",

  evaluate(input: any) {
    const {
      state,
      distanceToCoast,
      buildYear,
      roofYear,
      policyType, // "HO" | "DP"
      mobileHome,
      barrierIsland,
      hasSolar,
    } = input;

    const currentYear = new Date().getFullYear();
    const roofAge = currentYear - roofYear;

    // --- State ---
    if (state !== "SC") {
      return { eligible: false, reason: "State not eligible" };
    }

    // --- Policy Type ---
    if (!["HO", "DP"].includes(policyType)) {
      return { eligible: false, reason: "Invalid policy type" };
    }

    // --- Geographic ---
    if (distanceToCoast > 45) {
      return { eligible: false, reason: "Outside coastal eligibility (>45 miles)" };
    }

    // --- Disqualifiers ---
    if (mobileHome) {
      return { eligible: false, reason: "Mobile homes not eligible" };
    }

    if (barrierIsland) {
      return { eligible: false, reason: "Barrier island restrictions" };
    }

    if (hasSolar) {
      return { eligible: false, reason: "Solar not eligible" };
    }

    // --- Build ---
    if (buildYear < 1900) {
      return { eligible: false, reason: "Built prior to 1900" };
    }

    // --- Base Score ---
    let baseScore = 0;

    if (distanceToCoast <= 5) baseScore = 9;
    else if (distanceToCoast <= 20) baseScore = 8;
    else baseScore = 7;

    // --- Build Adjustment ---
    let buildAdjustment = 0;

    if (buildYear >= 2006) buildAdjustment = 1;

    // --- Roof Penalty ---
    let roofPenalty = 0;

    if (roofAge > 30) roofPenalty = 2;
    else if (roofAge > 20) roofPenalty = 1;

    let score = baseScore + buildAdjustment - roofPenalty;

    // --- Floor / Ceiling ---
    if (score < 5) score = 5;
    if (score > 10) score = 10;

    // --- Reasons ---
    const reasons: string[] = [];

    reasons.push(`Coastal pricing tier (${baseScore})`);

    if (buildAdjustment > 0) {
      reasons.push("Newer build discount");
    }

    if (roofPenalty > 0) {
      reasons.push(`Roof age penalty applied (-${roofPenalty})`);
      reasons.push("Older roof likely ACV settlement");
    }

    if (policyType === "DP" && roofAge > 20) {
      reasons.push("Limited water damage coverage ($10k)");
    }

    if (policyType === "HO" && roofAge > 20) {
      reasons.push("Limited water damage coverage on older roofs");
    }

    return {
      eligible: true,
      score,
      reason: reasons.join(" | "),
    };
  },
};