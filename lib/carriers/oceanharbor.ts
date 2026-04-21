export const oceanharbor = {
  key: "oceanharbor",
  label: "Ocean Harbor",

  evaluate(input: any) {
    const {
      state,
      distanceToCoast,
      buildYear,
      mobileHome,
    } = input;

    const currentYear = new Date().getFullYear();
    const age = currentYear - buildYear;

    // --- State ---
    if (!["GA", "SC"].includes(state)) {
      return { eligible: false, reason: "State not eligible" };
    }

    // --- Mobile Home Only ---
    if (!mobileHome) {
      return { eligible: false, reason: "Only mobile homes eligible" };
    }

    // --- Age ---
    if (age > 30) {
      return { eligible: false, reason: "Mobile home over 30 years old" };
    }

    // --- Coastal Eligibility ---
    if (distanceToCoast < 1) {
      return { eligible: false, reason: "Too close to coast (<1 mile)" };
    }

    // --- Base Score ---
    let baseScore = 0;

    if (distanceToCoast < 15) baseScore = 10;      // wins by default
    else if (distanceToCoast < 50) baseScore = 8;  // one point above Tower Hill
    else baseScore = 6;                            // slight inland penalty

    // --- Build Adjustment ---
    let buildAdjustment = 0;

    if (age <= 5) buildAdjustment = 1;

    let score = baseScore + buildAdjustment;

    // --- Floor / Ceiling ---
    if (score < 5) score = 5;
    if (score > 10) score = 10;

    // --- Reasons / Alerts ---
    const reasons: string[] = [];
    const alerts: string[] = [];

    if (distanceToCoast < 15) {
      reasons.push("Best coastal mobile home option");
    } else if (distanceToCoast < 50) {
      reasons.push("Strong coastal fit");
    } else {
      reasons.push("Available inland but not preferred");
    }

    if (buildAdjustment > 0) {
      reasons.push("Newer mobile home bump");
    }

    return {
      eligible: true,
      score,
      reason: reasons.join(" | "),
      alerts,
    };
  },
};