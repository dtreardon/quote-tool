export const heritage = {
  key: "heritage",
  label: "Heritage",

  evaluate(input: any) {
    const {
      state,
      distanceToCoast,
      buildYear,
      roofYear,
      mobileHome,
      barrierIsland,
      roofType,
    } = input;

    const currentYear = new Date().getFullYear();
    const age = currentYear - buildYear;
    const roofAge = currentYear - roofYear;

    // --- State ---
    if (state !== "SC") {
      return { eligible: false, reason: "State not eligible" };
    }

    // --- Disqualifiers ---
    if (mobileHome) {
      return { eligible: false, reason: "Mobile homes not eligible" };
    }

    if (barrierIsland) {
      return { eligible: false, reason: "Barrier island not eligible" };
    }

    if (age > 100) {
      return { eligible: false, reason: "Over 100 years old" };
    }

    // --- Roof ---
    if (roofType === "flat") {
      return { eligible: false, reason: "Flat roofs not eligible" };
    }

    if (roofAge > 10) {
      return { eligible: false, reason: "Roof must be 10 years old or newer" };
    }

    // --- Base Score (DTC) ---
    let baseScore = 0;

    if (distanceToCoast <= 5) baseScore = 6;
    else if (distanceToCoast <= 15) baseScore = 7;
    else if (distanceToCoast <= 30) baseScore = 8;
    else baseScore = 9;

    // --- Age Penalty ---
    let penalty = 0;

    if (age > 10) {
      penalty = Math.floor((age - 10) / 15) + 1;
    }

    let score = baseScore - penalty;

    // --- Floor ---
    if (score < 5) score = 5;

    // --- Reasons ---
    const reasons: string[] = [];

    reasons.push(`Distance to coast pricing tier (${baseScore})`);

    if (penalty > 0) {
      reasons.push(`Age penalty applied (-${penalty})`);
    }

    if (age > 50) {
      reasons.push("Modified functional replacement cost applies");
    }

    if (buildYear <= 1949) {
      reasons.push("Requires evidence of updates for older home");
    }

    return {
      eligible: true,
      score,
      reason: reasons.join(" | "),
    };
  },
};