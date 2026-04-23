export const americanintegrity = {
  key: "americanintegrity",
  label: "American Integrity",

  evaluate(input: any) {
    const { state, distanceToCoast, buildYear, roofYear, mobileHome, barrierIsland } = input;
    const currentYear = new Date().getFullYear();

    const buildAge = currentYear - buildYear;
    const roofAge = currentYear - roofYear;

    // --- Global disqualifiers ---
    if (!["GA", "SC", "NC"].includes(state)) {
      return { eligible: false, reason: "State not eligible" };
    }

    if (mobileHome) {
      return { eligible: false, reason: "Mobile homes not eligible" };
    }

    if (barrierIsland) {
      return { eligible: false, reason: "Barrier island not eligible" };
    }

    // --- GEORGIA ---
    if (state === "GA") {
      if (distanceToCoast != null && distanceToCoast <= 10) {
        return { eligible: false, reason: "Too close to coast (≤10 miles)" };
      }

      if (buildAge > 2 || roofAge > 2) {
        return { eligible: false, reason: "Build/Roof must be within 2 years" };
      }

      if (distanceToCoast > 10 && distanceToCoast <= 25) {
        return { eligible: true, score: 5, reason: "10–25 miles to coast", alerts: [] };
      }

      if (distanceToCoast > 25 && distanceToCoast <= 50) {
        return { eligible: true, score: 7, reason: "25–50 miles to coast", alerts: [] };
      }

      if (distanceToCoast > 50) {
        return { eligible: true, score: 10, reason: "50+ miles inland new build", alerts: [] };
      }
    }

    // --- SOUTH CAROLINA ---
    if (state === "SC") {
      if (distanceToCoast != null && distanceToCoast <= 15) {
        return { eligible: false, reason: "Too close to coast (≤15 miles)" };
      }

      // 15–50 miles → new builds only
      if (distanceToCoast > 15 && distanceToCoast <= 50) {
        if (buildAge > 2 || roofAge > 2) {
          return { eligible: false, reason: "Must be new construction within 50 miles" };
        }

        if (distanceToCoast <= 30) {
          return { eligible: true, score: 5, reason: "15–30 miles to coast (new build)", alerts: [] };
        }

        return { eligible: true, score: 7, reason: "30–50 miles to coast (new build)", alerts: [] };
      }

      // 50+ miles
      if (distanceToCoast > 50) {
        // New builds
        if (buildAge <= 2 && roofAge <= 2) {
          return { eligible: true, score: 10, reason: "50+ miles inland new build", alerts: [] };
        }

        // Older homes (1901+)
        if (buildYear >= 1901) {
          const alerts: string[] = [];

          if (buildYear < 2014) {
            alerts.push("4-point inspection required within 10 days of binding");
          }

          return {
            eligible: true,
            score: 7,
            reason: "50+ miles inland older home",
            alerts,
          };
        }

        return { eligible: false, reason: "Build year too old" };
      }
    }

    // --- NORTH CAROLINA ---
    if (state === "NC") {
      if (distanceToCoast != null && distanceToCoast <= 10) {
        return { eligible: false, reason: "Too close to coast (≤10 miles)" };
      }

      if (buildAge > 2 || roofAge > 2) {
        return { eligible: false, reason: "Build/Roof must be within 2 years" };
      }

      if (distanceToCoast > 10 && distanceToCoast <= 25) {
        return { eligible: true, score: 5, reason: "10–25 miles to coast", alerts: [] };
      }

      if (distanceToCoast > 25 && distanceToCoast <= 50) {
        return { eligible: true, score: 7, reason: "25–50 miles to coast", alerts: [] };
      }

      if (distanceToCoast > 50) {
        return { eligible: true, score: 10, reason: "50+ miles inland new build", alerts: [] };
      }
    }

    return { eligible: false, reason: "Does not meet underwriting criteria" };
  },
};