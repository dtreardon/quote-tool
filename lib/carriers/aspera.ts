export const aspera = {
  key: "aspera",
  label: "Aspera",

  evaluate(input: any) {
    const {
      state,
      distanceToCoast,
      buildYear,
      mobileHome,
    } = input;

    // --- State ---
    if (!["GA", "SC"].includes(state)) {
      return { eligible: false, reason: "State not eligible" };
    }

    // --- Mobile Home Only ---
    if (!mobileHome) {
      return { eligible: false, reason: "Only mobile homes eligible" };
    }

    // --- Coastal Eligibility ---
    if (distanceToCoast < 1) {
      return { eligible: false, reason: "Too close to coast (<1 mile)" };
    }

    // --- Base Score ---
    // Backup option: should always lose to Tower Hill / Ocean Harbor when they are eligible
    let score = 5;

    // --- Floor / Ceiling ---
    if (score < 5) score = 5;
    if (score > 10) score = 10;

    // --- Reasons / Alerts ---
    const reasons: string[] = [];
    const alerts: string[] = [];

    reasons.push("Backup mobile home option");

    if (buildYear < 2000) {
      alerts.push("4-point inspection required prior to binding");
    }

    return {
      eligible: true,
      score,
      reason: reasons.join(" | "),
      alerts,
    };
  },
};