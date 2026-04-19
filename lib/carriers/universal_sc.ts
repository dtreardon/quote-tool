export const universal_sc = {
  key: "universal_sc",
  label: "Universal (SC)",

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
    const roofAge = currentYear - roofYear;

    if (state !== "SC") {
      return { eligible: false, reason: "State not eligible" };
    }

    if (policyType !== "HO") {
      return { eligible: false, reason: "Only HO eligible" };
    }

    if (mobileHome) {
      return { eligible: false, reason: "Mobile homes not eligible" };
    }

    if (hasSolar) {
      return { eligible: true, reason: "Solar allowed" };
    }

    if (roofAge > 25) {
      return { eligible: false, reason: "Roof over 25 years" };
    }

    const age = currentYear - buildYear;
    let score = 0;

    if (age <= 5) score = 7;
    else if (age <= 20) score = 6;
    else score = 5;

    const reasons: string[] = [];
    reasons.push("Universal SC — competitive on older/lower value homes");

    return {
      eligible: true,
      score,
      reason: reasons.join(" | "),
    };
  },
};