"use client";

import { useState } from "react";

type Result = {
  label: string;
  tier: string;
  score?: number;
  reasons?: string[];
};

type Input = {
  zip: string;
  buildYear: number;
  roofYear: number;
  hasSolar: boolean;
  mobileHome: boolean;
};

function isSC(zip: string) {
  return zip.startsWith("29");
}

function isGA(zip: string) {
  return zip.startsWith("30") || zip.startsWith("31");
}

function isNC(zip: string) {
  return zip.startsWith("27") || zip.startsWith("28");
}

function getState(zip: string) {
  if (isSC(zip)) return "SC";
  if (isGA(zip)) return "GA";
  if (isNC(zip)) return "NC";
  return "OTHER";
}

function isBarrierIsland(zip: string) {
  return ["31522"].includes(zip);
}

function isCharlestonArea(zip: string) {
  return zip.startsWith("294");
}

function isWestOf17SC(zip: string) {
  const eastOf17Prefixes = ["294", "295"];
  return !eastOf17Prefixes.some((p) => zip.startsWith(p));
}

function evaluateAmericanIntegrity(input: Input) {
  const state = getState(input.zip);

  if (!["SC", "GA", "NC"].includes(state)) {
    return { eligible: false, reason: "Wrong state" };
  }

  if (isBarrierIsland(input.zip)) {
    return { eligible: false, reason: "Barrier island" };
  }

  if (input.hasSolar) {
    return { eligible: false, reason: "No solar" };
  }

  if (state === "SC") {
    if (isCharlestonArea(input.zip)) {
      if (input.buildYear < 2014) {
        return { eligible: false, reason: "Charleston area must be 2014+" };
      }
      return { eligible: true, score: 9 };
    }

    if (input.buildYear < 1901) {
      return { eligible: false, reason: "Must be 1901+" };
    }

    return { eligible: true, score: 8 };
  }

  if (state === "GA" || state === "NC") {
    if (input.buildYear < 2023) {
      return { eligible: false, reason: "GA/NC must be 2023+" };
    }

    if (state === "NC") {
      return { eligible: true, score: 7 };
    }

    return { eligible: true, score: 8 };
  }

  return { eligible: false, reason: "Not eligible" };
}

function evaluateUniversal(input: Input) {
  const state = getState(input.zip);

  if (!["SC", "GA", "NC"].includes(state)) {
    return { eligible: false, reason: "Wrong state" };
  }

  if (state === "GA" && isBarrierIsland(input.zip)) {
    return { eligible: false, reason: "Closed coastal GA" };
  }

  let score = 7;

  if (input.hasSolar) score += 1;
  if (input.buildYear >= 2015) score += 1;

  if (state === "NC" && input.buildYear >= 2015) score += 1;

  return { eligible: true, score };
}

function evaluateFrontline(input: Input) {
  const state = getState(input.zip);

  if (!["GA", "NC"].includes(state)) {
    return { eligible: false, reason: "GA and NC only" };
  }

  let score = 9;

  if (state === "GA") score = 10;
  if (state === "NC" && input.buildYear < 2000) score = 10;
  if (input.hasSolar) score += 1;

  return { eligible: true, score };
}

function evaluateHOA(input: Input) {
  const state = getState(input.zip);

  if (state !== "SC") {
    return { eligible: false, reason: "SC only" };
  }

  if (input.hasSolar) {
    return { eligible: false, reason: "No solar" };
  }

  let score = 7;
  if (input.buildYear < 1995) score = 6;

  return { eligible: true, score };
}

function evaluateOrion180(input: Input) {
  const state = getState(input.zip);

  if (state !== "SC") {
    return { eligible: false, reason: "SC only" };
  }

  if (input.hasSolar) {
    return { eligible: false, reason: "No solar" };
  }

  return { eligible: true, score: 7 };
}

function evaluateHeritage(input: Input) {
  const state = getState(input.zip);

  if (state !== "SC") {
    return { eligible: false, reason: "SC only" };
  }

  let score = 6;
  if (input.hasSolar) score += 1;

  return { eligible: true, score };
}

function evaluateTowerHill(input: Input) {
  const state = getState(input.zip);

  if (state !== "SC") {
    return { eligible: false, reason: "SC only" };
  }

  if (!isWestOf17SC(input.zip)) {
    return { eligible: false, reason: "Must be west of 17" };
  }

  if (input.hasSolar) {
    return { eligible: false, reason: "No solar" };
  }

  return { eligible: true, score: 8 };
}

function evaluateAspera(input: Input) {
  const state = getState(input.zip);

  if (state !== "SC") {
    return { eligible: false, reason: "SC only" };
  }

  if (input.hasSolar) {
    return { eligible: false, reason: "No solar" };
  }

  return { eligible: true, score: 5 };
}

const carriers = [
  { label: "American Integrity", evaluate: evaluateAmericanIntegrity },
  { label: "Universal", evaluate: evaluateUniversal },
  { label: "Frontline", evaluate: evaluateFrontline },
  { label: "Homeowners of America", evaluate: evaluateHOA },
  { label: "Orion180", evaluate: evaluateOrion180 },
  { label: "Heritage", evaluate: evaluateHeritage },
  { label: "Tower Hill", evaluate: evaluateTowerHill },
  { label: "Aspera", evaluate: evaluateAspera }
];

function evaluate(input: Input): Result[] {
  let availableCarriers = carriers;

  if (input.mobileHome) {
    availableCarriers = carriers.filter(
      (c) => c.label === "Tower Hill" || c.label === "Aspera"
    );
  }

  const results: Result[] = availableCarriers.map((carrier) => {
    const res = carrier.evaluate(input);

    if (!res.eligible) {
      return {
        label: carrier.label,
        tier: "Do Not Quote",
        reasons: [res.reason]
      };
    }

    let tier = "Backup";
    if ((res.score || 0) >= 9) tier = "Best Bet";
    else if ((res.score || 0) >= 7) tier = "Competitive";

    return {
      label: carrier.label,
      tier,
      score: res.score
    };
  });

  return results
    .filter((r) => r.tier !== "Do Not Quote")
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}

export default function App() {
  const [form, setForm] = useState({
    zip: "",
    buildYear: "",
    roofYear: "",
    hasSolar: false,
    mobileHome: false,
    top3Only: true
  });

  const [results, setResults] = useState<Result[] | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let evaluated = evaluate({
      zip: form.zip.trim(),
      buildYear: Number(form.buildYear),
      roofYear: Number(form.roofYear),
      hasSolar: form.hasSolar,
      mobileHome: form.mobileHome
    });

    if (form.top3Only) {
      evaluated = evaluated.slice(0, 3);
    }

    setResults(evaluated);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Quick Quote Selector</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full p-2 border rounded"
          placeholder="ZIP Code"
          value={form.zip}
          onChange={(e) => setForm({ ...form, zip: e.target.value })}
        />

        <input
          className="w-full p-2 border rounded"
          placeholder="Build Year"
          type="number"
          value={form.buildYear}
          onChange={(e) => setForm({ ...form, buildYear: e.target.value })}
        />

        <input
          className="w-full p-2 border rounded"
          placeholder="Roof Year"
          type="number"
          value={form.roofYear}
          onChange={(e) => setForm({ ...form, roofYear: e.target.value })}
        />

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={form.hasSolar}
            onChange={(e) => setForm({ ...form, hasSolar: e.target.checked })}
          />
          <span>Solar</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={form.mobileHome}
            onChange={(e) => setForm({ ...form, mobileHome: e.target.checked })}
          />
          <span>Mobile Home</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={form.top3Only}
            onChange={(e) => setForm({ ...form, top3Only: e.target.checked })}
          />
          <span>Show Top 3 Only</span>
        </label>

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Find Best Carriers
        </button>
      </form>

      {results && (
        <div className="mt-6 space-y-2">
          {results.length === 0 ? (
            <div className="p-3 border rounded">No eligible carriers found.</div>
          ) : (
            results.map((r, i) => (
              <div key={i} className="p-3 border rounded">
                <strong>{r.label}</strong>: {r.tier}
                {r.score !== undefined && (
                  <div className="text-sm">Score: {r.score}</div>
                )}
                {r.reasons && (
                  <div className="text-sm text-red-500">
                    {r.reasons.join(", ")}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}