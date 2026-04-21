export const towerhill = {
  key: "towerhill",
  label: "Tower Hill",

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
    if (distanceToCoast < 15) {
      return { eligible: false, reason: "No wind coverage available inside 15 miles" };
    }

    // --- Base Score ---
    let baseScore = 0;

    if (distanceToCoast >= 50) baseScore = 9;
    else baseScore = 7; // 15-50 miles stays competitive but below inland sweet spot

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

    if (distanceToCoast >= 50) {
      reasons.push("Strong inland fit");
    } else {
      reasons.push("Eligible in mid-coastal zone");
      alerts.push("Wind coverage may be limited — verify before quoting");
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