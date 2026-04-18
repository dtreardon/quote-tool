"use client";

import { useState } from "react";

type Result = {
  label: string;
  tier: string;
  score?: number;
  reasons?: string[];
};

function isCoastalZIP(zip: string) {
  const coastalZips = ["294", "295"];
  return coastalZips.some((z) => zip.startsWith(z));
}

function isUpstateZIP(zip: string) {
  const upstateZips = ["296"];
  return upstateZips.some((z) => zip.startsWith(z));
}

function isWestOfI95(zip: string) {
  return !isCoastalZIP(zip);
}

const rules = {
  AmericanIntegrity: {
    label: "American Integrity",
    minYear: 2005,
    maxRoofAge: 10,
    requiresWestOfI95: true,
    baseScore: 6,
    boosts: { newerHome: 2, newRoof: 2 }
  },
  HomeownersOfAmerica: {
    label: "Homeowners of America",
    minYear: 2005,
    maxRoofAge: 15,
    requiresCoastal: true,
    baseScore: 6,
    boosts: { newerHome: 2, coastal: 2 }
  },
  Heritage: {
    label: "Heritage",
    minYear: 1970,
    maxRoofAge: 10,
    baseScore: 5,
    boosts: { newRoof: 2 }
  },
  Orion180: {
    label: "Orion180",
    minYear: 1970,
    maxRoofAge: 20,
    baseScore: 7,
    boosts: { newerHome: 2, coastal: 3 }
  },
  Universal: {
    label: "Universal",
    minYear: 1970,
    maxRoofAge: 20,
    blocksUpstate: true,
    baseScore: 5,
    boosts: { smallHome: 2, solar: 2 }
  }
};

function evaluate(input: any): Result[] {
  const results: Result[] = [];

  const coastal = isCoastalZIP(input.zip);
  const upstate = isUpstateZIP(input.zip);
  const westOfI95 = isWestOfI95(input.zip);

  Object.values(rules).forEach((r: any) => {
    let eligible = true;
    let reasons: string[] = [];

    if (input.yearBuilt < r.minYear) {
      eligible = false;
      reasons.push("Year too old");
    }

    if (input.roofAge > r.maxRoofAge) {
      eligible = false;
      reasons.push("Roof too old");
    }

    if (r.requiresWestOfI95 && !westOfI95) {
      eligible = false;
      reasons.push("Not west of I-95");
    }

    if (r.requiresCoastal && !coastal) {
      eligible = false;
      reasons.push("Not coastal ZIP");
    }

    if (r.blocksUpstate && upstate) {
      eligible = false;
      reasons.push("Closed in upstate");
    }

    if (!eligible) {
      results.push({ label: r.label, tier: "Do Not Quote", reasons });
      return;
    }

    let score = r.baseScore;

    if (input.yearBuilt > 2015 && r.boosts.newerHome) score += r.boosts.newerHome;
    if (input.roofAge < 5 && r.boosts.newRoof) score += r.boosts.newRoof;
    if (coastal && r.boosts.coastal) score += r.boosts.coastal;
    if (input.hasSolar && r.boosts.solar) score += r.boosts.solar;
    if (input.smallHome && r.boosts.smallHome) score += r.boosts.smallHome;

    let tier = "Backup";
    if (score >= 9) tier = "Best Bet";
    else if (score >= 7) tier = "Competitive";

    results.push({ label: r.label, tier, score });
  });

  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}

export default function App() {
  const [form, setForm] = useState({
    zip: "",
    yearBuilt: "",
    roofAge: "",
    hasSolar: false,
    smallHome: false,
    top3Only: true
  });

  const [results, setResults] = useState<Result[] | null>(null);

  const handleSubmit = (e: any) => {
    e.preventDefault();

    let evaluated = evaluate({
      zip: form.zip,
      yearBuilt: Number(form.yearBuilt),
      roofAge: Number(form.roofAge),
      hasSolar: form.hasSolar,
      smallHome: form.smallHome
    });

    if (form.top3Only) {
      evaluated = evaluated
        .filter((r) => r.tier !== "Do Not Quote")
        .slice(0, 3);
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
          placeholder="Year Built"
          type="number"
          value={form.yearBuilt}
          onChange={(e) => setForm({ ...form, yearBuilt: e.target.value })}
        />

        <input
          className="w-full p-2 border rounded"
          placeholder="Roof Age"
          type="number"
          value={form.roofAge}
          onChange={(e) => setForm({ ...form, roofAge: e.target.value })}
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
            checked={form.smallHome}
            onChange={(e) => setForm({ ...form, smallHome: e.target.checked })}
          />
          <span>Small / Low Coverage Home</span>
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
          {results.map((r, i) => (
            <div key={i} className="p-3 border rounded">
              <strong>{r.label}</strong>: {r.tier}
              {r.score && <div className="text-sm">Score: {r.score}</div>}
              {r.reasons && (
                <div className="text-sm text-red-500">
                  {r.reasons.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
