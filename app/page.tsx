"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import coastline from "../data/coastline.json";
import { point, pointToLineDistance } from "@turf/turf";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

function getAddressComponent(place: any, type: string) {
  const components = place?.address_components || [];
  return components.find((c: any) => c.types?.includes(type))?.long_name || "";
}

function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Browser environment required"));
  }

  if ((window as any).google?.maps?.places) {
    return Promise.resolve((window as any).google);
  }

  const existing = document.querySelector(
    'script[data-google-maps="true"]'
  ) as HTMLScriptElement | null;

  if (existing) {
    return Promise.resolve((window as any).google);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.onload = () => resolve((window as any).google);
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });
}

function isBarrierIsland(zip: string) {
  return ["31522"].includes(zip);
}

function isSC(zip: string) {
  return zip.startsWith("29");
}

function isGA(zip: string) {
  return zip.startsWith("30") || zip.startsWith("31");
}

function isNC(zip: string) {
  return zip.startsWith("27");
}

function isFL(zip: string) {
  return zip.startsWith("32") || zip.startsWith("33") || zip.startsWith("34");
}

function isCharlestonArea(zip: string) {
  return ["294", "29401", "29403", "29407"].some((z) => zip.startsWith(z));
}

/* ---------------- CARRIERS ---------------- */

const carriers = {
  AmericanIntegrity: {
    label: "American Integrity",
    evaluate(input: any) {
      const { zip, buildYear, distanceToCoast } = input;

      if (isBarrierIsland(zip)) {
        return { eligible: false };
      }

      if (distanceToCoast != null && distanceToCoast <= 1) {
        return { eligible: false };
      }

      if (isGA(zip) || isNC(zip)) {
        if (buildYear < 2023) {
          return { eligible: false };
        }
        return { eligible: true, score: 9 };
      }

      if (isSC(zip)) {
        if (isCharlestonArea(zip)) {
          if (buildYear < 2014) {
            return { eligible: false };
          }
        } else if (buildYear < 1901) {
          return { eligible: false };
        }

        return { eligible: true, score: 8 };
      }

      return { eligible: false };
    },
  },

  HomeownersOfAmerica: {
    label: "Homeowners of America",
    evaluate(input: any) {
      const { zip, distanceToCoast } = input;

      if (!isSC(zip) && !isGA(zip) && !isNC(zip) && !isFL(zip)) {
        return { eligible: false };
      }

      if (distanceToCoast != null && distanceToCoast <= 0.5) {
        return { eligible: false };
      }

      return { eligible: true, score: 7 };
    },
  },

  Heritage: {
    label: "Heritage",
    evaluate(input: any) {
      if (input.buildYear < 1970) {
        return { eligible: false };
      }

      if (input.distanceToCoast != null && input.distanceToCoast <= 2) {
        return { eligible: false };
      }

      return { eligible: true, score: 6 };
    },
  },

  Orion180: {
    label: "Orion180",
    evaluate(input: any) {
      if (!isSC(input.zip)) {
        return { eligible: false };
      }

      if (input.distanceToCoast != null && input.distanceToCoast <= 1) {
        return { eligible: false };
      }

      return { eligible: true, score: 7 };
    },
  },

  Universal: {
    label: "Universal",
    evaluate(input: any) {
      if (isBarrierIsland(input.zip)) {
        return { eligible: false };
      }

      if (input.distanceToCoast != null && input.distanceToCoast <= 1) {
        return { eligible: false };
      }

      if (isGA(input.zip)) {
        if (input.coastalGA) {
          return { eligible: false };
        }
        return { eligible: true, score: 8 };
      }

      if (isNC(input.zip)) {
        return { eligible: true, score: 8 };
      }

      if (isSC(input.zip)) {
        if (input.buildYear >= 2015) {
          return { eligible: true, score: 8 };
        }
        return { eligible: true, score: 7 };
      }

      return { eligible: false };
    },
  },

  Frontline: {
    label: "Frontline",
    evaluate(input: any) {
      if (input.distanceToCoast != null && input.distanceToCoast <= 1) {
        return { eligible: false };
      }

      if (isGA(input.zip)) {
        return { eligible: true, score: 10 };
      }

      if (isNC(input.zip)) {
        return { eligible: true, score: input.buildYear < 2000 ? 9 : 8 };
      }

      return { eligible: false };
    },
  },
};

function evaluate(input: any) {
  return Object.values(carriers)
    .map((carrier: any) => {
      const res = carrier.evaluate(input);
      if (!res.eligible) return null;

      let tier = "Backup";
      if (res.score >= 9) tier = "Best";
      else if (res.score >= 7) tier = "Competitive";

      return {
        label: carrier.label,
        tier,
        score: res.score,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.score - a.score);
}

export default function Page() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);

  const [form, setForm] = useState({
    address: "",
    zip: "",
    city: "",
    state: "",
    buildYear: "",
    roofYear: "",
    hasSolar: false,
    mobileHome: false,
    top3Only: true,
    distanceToCoast: null as number | null,
  });

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [results, setResults] = useState<any[] | null>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setStatus("missing-key");
      return;
    }

    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    if (status !== "ready" || !inputRef.current || autocompleteRef.current) {
      return;
    }

    const google = (window as any).google;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["formatted_address", "address_components", "geometry"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();

      if (lat == null || lng == null) {
        setError("Could not get location from selected address.");
        return;
      }

      const propertyPoint = point([lng, lat]);

      const filteredFeatures = (coastline as any).features.filter((feature: any) => {
        const coords = feature.geometry.coordinates;

        return coords.some((c: number[]) => {
          const [featureLng, featureLat] = c;
          return (
            featureLng >= -87 &&
            featureLng <= -75 &&
            featureLat >= 24 &&
            featureLat <= 37
          );
        });
      });

      const distance = Math.min(
        ...filteredFeatures.map((feature: any) =>
          pointToLineDistance(propertyPoint, feature, { units: "miles" })
        )
      );

      const zip = getAddressComponent(place, "postal_code");
      const city = getAddressComponent(place, "locality");
      const state = getAddressComponent(place, "administrative_area_level_1");

      setForm((prev) => ({
        ...prev,
        address: place.formatted_address || "",
        zip,
        city,
        state,
        distanceToCoast: Number(distance.toFixed(2)),
      }));

      setError("");
      setResults(null);
    });

    autocompleteRef.current = autocomplete;
  }, [status]);

  const roofAge = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return form.roofYear ? currentYear - Number(form.roofYear) : null;
  }, [form.roofYear]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.address.trim()) {
      setError("Enter an address.");
      return;
    }

    if (!form.zip || form.zip.length < 5) {
      setError("Select a valid address from the dropdown.");
      return;
    }

    let evaluated = evaluate({
      zip: form.zip,
      buildYear: Number(form.buildYear),
      roofYear: Number(form.roofYear),
      hasSolar: form.hasSolar,
      mobileHome: form.mobileHome,
      distanceToCoast: form.distanceToCoast,
      coastalGA: isGA(form.zip) && (form.distanceToCoast ?? 999) <= 10,
    });

    if (form.top3Only) {
      evaluated = evaluated.slice(0, 3);
    }

    setResults(evaluated);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="w-full bg-white border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-center">
          <div className="relative h-14 w-64">
            <Image
              src="/logo.png"
              alt="Robinson & Associates logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="p-6 max-w-xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Homeowners Carrier Guide</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            ref={inputRef}
            className="w-full p-2 border rounded"
            placeholder="Enter property address"
            value={form.address}
onChange={(e) =>
  setForm((prev) => ({
    ...prev,
    address: e.target.value,
    zip: "",
    city: "",
    state: "",
    distanceToCoast: null,
  }))
}
          />
          <div className="text-xs text-gray-500 mt-1">
            {status === "missing-key" && "Add your Google Maps API key"}
            {status === "error" && "Google Maps could not be loaded"}
            {status === "ready" && "Start typing and select an address from the dropdown"}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <input
            className="w-full p-2 border rounded bg-gray-50"
            placeholder="ZIP"
            value={form.zip}
            readOnly
          />
          <input
            className="w-full p-2 border rounded bg-gray-50"
            placeholder="City"
            value={form.city}
            readOnly
          />
          <input
            className="w-full p-2 border rounded bg-gray-50"
            placeholder="State"
            value={form.state}
            readOnly
          />
        </div>

        {form.distanceToCoast !== null && (
          <div className="text-sm text-gray-700">
            Distance to coast: <strong>{form.distanceToCoast} miles</strong>
          </div>
        )}

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

        {roofAge !== null && !Number.isNaN(roofAge) && (
          <div className="text-xs text-gray-500">
            Estimated roof age: {roofAge} years
          </div>
        )}

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
          <span>Top 3 Only</span>
        </label>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Run Quote
        </button>
      </form>

          {results && (
            <div className="mt-6 space-y-2">
              {results.length === 0 ? (
                <div className="p-3 border rounded bg-white">No eligible carriers found.</div>
              ) : (
                results.map((r, i) => (
                  <div key={i} className="p-3 border rounded bg-white">
                    <strong>{r.label}</strong> — {r.tier}
                    <div className="text-sm">Score: {r.score}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 text-center text-xs text-gray-500">
          © 2026 Reardon Insurance, LLC
        </div>
      </div>
    </div>
  );
}