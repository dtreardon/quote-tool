export const heritage = {
  key: "heritage",
  label: "Heritage",

  evaluate(input: any) {
    const {
      state,
      distanceToCoast,
      buildYear,
      roofYear,
      policyType,
      mobileHome,
      barrierIsland,
      hasSolar,
    } = input;

    const currentYear = new Date().getFullYear();
    const age = currentYear - buildYear;
    const roofAge = currentYear - roofYear;

    // --- State ---
    if (state !== "SC") {
      return { eligible: false, reason: "State not eligible" };
    }

    // --- Policy Type ---
    if (policyType !== "HO") {
      return { eligible: false, reason: "Only HO eligible" };
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

    // --- Roof ---
    if (roofAge > 10) {
      return { eligible: false, reason: "Roof over 10 years" };
    }

    // --- Base Score ---
    let baseScore = 0;

    if (distanceToCoast <= 5) baseScore = 8;
    else if (distanceToCoast <= 20) baseScore = 7;
    else baseScore = 6;

    // --- Light Age Penalty ---
    let agePenalty = 0;

    if (age > 40) agePenalty = 1;

    let score = baseScore - agePenalty;

    // --- Floor / Ceiling ---
    if (score < 5) score = 5;
    if (score > 10) score = 10;

    // --- Reasons ---
    const reasons: string[] = [];

    reasons.push(`Distance to coast pricing tier (${baseScore})`);

    if (agePenalty > 0) {
      reasons.push(`Age penalty applied (-${agePenalty})`);
    }

    return {
      eligible: true,
      score,
      reason: reasons.join(" | "),
    };
  },
};