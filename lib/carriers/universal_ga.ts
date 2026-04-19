export const universal_ga = {
  key: "universal_ga",
  label: "Universal (GA)",

  evaluate(input: any) {
    const {
      state,
      distanceToCoast,
      buildYear,
      roofYear,
      policyType,
      mobileHome,
      hasSolar,
    } = input;

    const currentYear = new Date().getFullYear();
    const age = currentYear - buildYear;
    const roofAge = currentYear - roofYear;

    if (state !== "GA") {
      return { eligible: false, reason: "State not eligible" };
    }

    if (policyType !== "HO") {
      return { eligible: false, reason: "Only HO eligible" };
    }

    if (distanceToCoast <= 50) {
      return { eligible: false, reason: "No coastal wind eligibility (≤50 miles)" };
    }

    if (mobileHome) {
      return { eligible: false, reason: "Mobile homes not eligible" };
    }

    if (hasSolar) {
      return { eligible: false, reason: "Solar not eligible" };
    }

    if (roofAge > 25) {
      return { eligible: false, reason: "Roof over 25 years" };
    }

    let score = 7;

    let agePenalty = 0;
    if (age > 50) agePenalty = 3;
    else if (age > 30) agePenalty = 2;
    else if (age > 10) agePenalty = 1;

    score -= agePenalty;

    if (score < 5) score = 5;

    const reasons: string[] = [];

    reasons.push("Inland-only option (no coastal wind)");

    if (agePenalty > 0) {
      reasons.push(`Build year penalty applied (-${agePenalty})`);
    }

    return {
      eligible: true,
      score,
      reason: reasons.join(" | "),
    };
  },
};