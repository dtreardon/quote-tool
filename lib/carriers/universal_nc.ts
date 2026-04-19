export const universal_nc = {
  key: "universal_nc",
  label: "Universal (NC)",

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

    if (state !== "NC") {
      return { eligible: false, reason: "State not eligible" };
    }

    if (policyType !== "HO") {
      return { eligible: false, reason: "Only HO eligible" };
    }

    if (mobileHome) {
      return { eligible: false, reason: "Mobile homes not eligible" };
    }

    if (roofAge > 25) {
      return { eligible: false, reason: "Roof over 25 years" };
    }

    let score = 0;

    if (age <= 5) score = 9;
    else if (age <= 20) score = 8;
    else score = 7;

    if (age <= 5 && distanceToCoast <= 25) {
      score += 1;
    }

    if (score > 10) score = 10;

    const reasons: string[] = [];

    reasons.push("Strong NC option with broad coastal eligibility");

    if (age <= 5 && distanceToCoast <= 25) {
      reasons.push("Coastal new build pricing boost");
    }

    return {
      eligible: true,
      score,
      reason: reasons.join(" | "),
    };
  },
};