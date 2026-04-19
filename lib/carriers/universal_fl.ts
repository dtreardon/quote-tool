export const universal_fl = {
  key: "universal_fl",
  label: "Universal (FL)",

  evaluate(input: any) {
    const {
      state,
      distanceToCoast,
      buildYear,
      roofYear,
      policyType,
      mobileHome,
      hasSolar,
      xWindExposure,
    } = input;

    const currentYear = new Date().getFullYear();
    const roofAge = currentYear - roofYear;

    if (state !== "FL") {
      return { eligible: false, reason: "State not eligible" };
    }

    if (mobileHome) {
      return { eligible: false, reason: "Mobile homes not eligible" };
    }

    if (hasSolar) {
      return { eligible: false, reason: "Solar not eligible" };
    }

    if (xWindExposure) {
      return { eligible: false, reason: "X-Wind exposure ineligible" };
    }

    if (roofAge > 25) {
      return { eligible: false, reason: "Roof over 25 years" };
    }

    if (!["HO3","HO8","DP1","DP2","DP3"].includes(policyType)) {
      return { eligible: false, reason: "Invalid policy type" };
    }

    // Always low score in FL
    const score = 5;

    const reasons: string[] = [];
    reasons.push("Highly priced Florida product — always scored low");

    return {
      eligible: true,
      score,
      reason: reasons.join(" | "),
    };
  },
};