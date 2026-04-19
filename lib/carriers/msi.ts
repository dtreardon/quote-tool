export const msi = {
  key: "msi",
  label: "MSI (Mainstreet)",

  evaluate(input: any) {
    const { state, distanceToCoast, xwind, wildfire } = input;

    // --- Hard exclusions ---
    if (!["GA", "SC", "NC"].includes(state)) {
      return { eligible: false, reason: "State not eligible" };
    }

    if (distanceToCoast <= 20) {
      return { eligible: false, reason: "Within 20 miles of coast" };
    }

    if (xwind) {
      return { eligible: false, reason: "Extreme wind zone" };
    }

    if (["moderate", "high", "extreme"].includes(wildfire)) {
      return { eligible: false, reason: "High wildfire risk" };
    }

    // --- Scoring ---
    let score = 0;
    const reasons: string[] = [];

    if (distanceToCoast > 20 && distanceToCoast <= 50) {
      score = 6;
      reasons.push("Eligible 20–50 miles inland");
    } else if (distanceToCoast > 50) {
      score = 5;
      reasons.push("Eligible >50 miles inland");
    }

    return {
      eligible: true,
      score,
      reason: reasons.join(" | "),
    };
  },
};