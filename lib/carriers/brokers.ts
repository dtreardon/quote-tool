export const brokers = {
  key: "brokers",
  label: "Brokers",

  evaluate(input: any) {
    const { state, distanceToCoast } = input;

    // --- State ---
    if (!["FL", "GA", "SC", "NC"].includes(state)) {
      return { eligible: false, reason: "State not eligible" };
    }

    // --- Base Score ---
    let score = 5;

    if (distanceToCoast != null) {
      if (distanceToCoast <= 0.5) {
        score = 7;
      } else if (distanceToCoast <= 1) {
        score = 6;
      }
    }

    return {
      eligible: true,
      score,
      reason: "Submit for quote",
    };
  },
};