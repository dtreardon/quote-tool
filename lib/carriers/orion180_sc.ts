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
    } = input;

    const currentYear = new Date().getFullYear();
    const age = currentYear - buildYear;
    const roofAge = currentYear - roofYear;

    // --- State ---
    if (state !== "SC") {
      return { eligible: false, reason: "State not eligible" };
    }

    // --- Policy Type ---
    if (!["HO", "DP"].includes(policyType)) {
      return { eligible: false, reason: "Invalid policy type" };
    }

    // --- Geographic (Coastal Only) ---
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

    // --- Build ---
    if (buildYear < 1900) {
      return { eligible: false, reason: "Built prior to 1900" };
    }

    // --- Base Score (DTC) ---
    let baseScore = 0;

    if (distanceToCoast <= 5) baseScore = 9;
    else if (distanceToCoast <= 20) baseScore = 8;
    else baseScore = 7;

    // --- Age Penalty ---
    let agePenalty = 0;

    if (age > 30) agePenalty = 2;
    else if (age > 10) agePenalty = 1;

    // --- Roof Penalty ---
    let roofPenalty = 0;

    if (roofAge > 30) roofPenalty = 4;
    else if (roofAge > 20) roofPenalty = 3;
    else if (roofAge > 10) roofPenalty = 2;
    else if (roofAge > 5) roofPenalty = 1;

    let score = baseScore - agePenalty - roofPenalty;

    // --- Floor ---
    if (score < 5) score = 5;

    // --- Reasons ---
    const reasons: string[] = [];

    reasons.push(`Coastal pricing tier (${baseScore})`);

    if (agePenalty > 0) {
      reasons.push(`Age penalty applied (-${agePenalty})`);
    }

    if (roofPenalty > 0) {
      reasons.push(`Roof age penalty applied (-${roofPenalty})`);
      reasons.push("Older roof likely ACV settlement");
    }

    // --- DP Specific ---
    if (policyType === "DP") {
      if (age > 30) {
        reasons.push("Limited water damage coverage ($10k)");
      }
    }

    // --- HO Specific ---
    if (policyType === "HO") {
      if (age > 30) {
        reasons.push("Limited water damage coverage on older homes");
      }
    }

    return {
      eligible: true,
      score,
      reason: reasons.join(" | "),
    };
  },
};