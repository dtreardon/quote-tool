export const universal_sc = {
  key: "universal_sc",
  label: "Universal (SC)",

  evaluate(input: any) {
    const {
      state,
      county,
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

    // --- Coastal Counties ---
    const coastalCounties = [
      "Charleston",
      "Berkeley",
      "Dorchester",
      "Beaufort",
      "Jasper",
      "Horry",
      "Georgetown",
      "Colleton",
    ];

    // --- State ---
    if (state !== "SC") {
      return { eligible: false, reason: "State not eligible" };
    }

    // --- Policy Type ---
    if (policyType !== "HO") {
      return { eligible: false, reason: "Only HO eligible" };
    }

    // --- Disqualifiers ---
    if (mobileHome) {
      return { eligible: false, reason: "Mobile homes not eligible" };
    }

    if (hasSolar) {
      return { eligible: false, reason: "Solar not eligible" };
    }

    // --- Roof ---
    if (roofAge > 25) {
      return { eligible: false, reason: "Roof over 25 years" };
    }

    // --- Build Year Rules ---
    const isCoastalCounty = coastalCounties.includes(county);

    if (isCoastalCounty && buildYear < 2003) {
      return {
        eligible: false,
        reason: "Build year must be 2003 or newer in coastal counties",
      };
    }

    if (!isCoastalCounty && buildYear < 1950) {
      return {
        eligible: false,
        reason: "Build year must be 1950 or newer",
      };
    }

    // --- Base Score ---
    let score = 6;
    const reasons: string[] = [];

    reasons.push("Universal SC — strong fit for older/lower value homes");

    // --- Older Home Boost ---
    if (age > 35) {
      score += 1;
      reasons.push("Older home sweet spot");
    }

    // --- Coastal Pressure ---
    if (distanceToCoast != null && distanceToCoast <= 5) {
      score -= 1;
      reasons.push("Some coastal pricing pressure");
    }

    // --- Newer Home Adjustment ---
    if (age <= 10) {
      score -= 1;
      reasons.push("Less targeted for newer homes");
    }

    // --- Floor / Ceiling ---
    if (score > 10) score = 10;
    if (score < 5) score = 5;

    return {
      eligible: true,
      score,
      reason: reasons.join(" | "),
      alerts: [],
    };
  },
};