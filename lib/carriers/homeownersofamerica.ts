export const homeownersofamerica = {
  key: "homeownersofamerica",
  label: "Homeowners of America",

  evaluate(input: any) {
    const {
      state,
      distanceToCoast,
      buildYear,
      policyType, // "HO" | "DP"
    } = input;

    const currentYear = new Date().getFullYear();
    const age = currentYear - buildYear;

    // --- State ---
    if (state !== "SC") {
      return { eligible: false, reason: "State not eligible" };
    }

    // --- Policy Type ---
    if (policyType !== "HO" && policyType !== "DP") {
      return { eligible: false, reason: "Invalid policy type" };
    }

    // --- Distance to Coast ---
    if (policyType === "HO") {
      if (distanceToCoast <= 15) {
        return { eligible: false, reason: "Too close to coast for HO (≤15 miles)" };
      }
    }

    if (policyType === "DP") {
      if (distanceToCoast <= 0.47) {
        return { eligible: false, reason: "Too close to coast for DP (≤0.47 miles)" };
      }
    }

    // --- Build Year ---
    if (age > 100) {
      return { eligible: false, reason: "Over 100 years old" };
    }

    // --- Score ---
    let score = 0;

    if (age <= 5) score = 10;
    else if (age <= 20) score = 8;
    else if (age <= 50) score = 6;
    else score = 5;

    // --- Reasons ---
    const reasons: string[] = [];

    if (age > 50) {
      reasons.push("Requires updates / underwriting review");
    }

    if (policyType === "DP") {
      if (age > 40) {
        reasons.push("Limited water damage coverage ($10k default)");
      }

      if (buildYear <= 1960) {
        reasons.push("Functional replacement cost applies");
      }
    }

    return {
      eligible: true,
      score,
      reason: reasons.length ? reasons.join(" | ") : "Eligible",
    };
  },
};