"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import coastline from "../data/coastline.json";
import { point, pointToLineDistance } from "@turf/turf";

import { americanintegrity } from "../lib/carriers/americanintegrity";
import { homeownersofamerica } from "../lib/carriers/homeownersofamerica";
import { heritage } from "../lib/carriers/heritage";
import { frontline_ga } from "../lib/carriers/frontline_ga";
import { frontline_nc } from "../lib/carriers/frontline_nc";
import { frontline_sc } from "../lib/carriers/frontline_sc";
import { orion180_ga } from "../lib/carriers/orion180_ga";
import { orion180_sc } from "../lib/carriers/orion180_sc";
import { brokers } from "../lib/carriers/brokers";
import { msi } from "../lib/carriers/msi";
import { towerhill } from "../lib/carriers/towerhill";
import { oceanharbor } from "../lib/carriers/oceanharbor";
import { aspera } from "../lib/carriers/aspera";

// --- Universal imports
import { universal_ga } from "../lib/carriers/universal_ga";
import { universal_nc } from "../lib/carriers/universal_nc";
import { universal_fl } from "../lib/carriers/universal_fl";
import { universal_sc } from "../lib/carriers/universal_sc";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const carrierRegistry = [
  americanintegrity,
  homeownersofamerica,
  heritage,
  orion180_ga,
  orion180_sc,
  frontline_sc,
  frontline_ga,
  frontline_nc,
  universal_fl,
  universal_ga,
  universal_sc,
  universal_nc,
  msi,
  towerhill,
  oceanharbor,
  aspera,
  brokers,
];

function getAddressComponent(place: any, type: string) {
  const components = place?.address_components || [];
  return components.find((c: any) => c.types?.includes(type))?.short_name || "";
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

function scoreToTier(score?: number) {
  if (score == null) return "Backup";
  if (score >= 9) return "Best";
  if (score >= 7) return "Competitive";
  return "Backup";
}

function evaluateCarriers(input: any) {
  const eligibleCarriers = carrierRegistry
    .map((carrier: any) => {
      const result = carrier.evaluate(input);

      if (!result?.eligible) {
        return null;
      }

      return {
        label: carrier.label,
        key: carrier.key,
        tier: scoreToTier(result.score),
        score: result.score,
        reason: result.reason,
        alerts: result.alerts || [],
        isBrokerFallback: false,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0));

  const limitedCarriers = input.top3Only
    ? eligibleCarriers.slice(0, 3)
    : eligibleCarriers;

  const hasBrokerCarrier = limitedCarriers.some(
    (carrier: any) => carrier.key === "brokers"
  );

  const withBrokerFallback =
    limitedCarriers.length < 3 && !hasBrokerCarrier
      ? [
          ...limitedCarriers,
          {
            label: "Brokers",
            reason: "Submit for quotes",
            isBrokerFallback: true,
          },
        ]
      : limitedCarriers;

  return withBrokerFallback.sort((a: any, b: any) => {
    if (a.isBrokerFallback) return 1;
    if (b.isBrokerFallback) return -1;
    return (b.score ?? 0) - (a.score ?? 0);
  });
}

export default function Page() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);

  const [form, setForm] = useState({
    address: "",
    zip: "",
    city: "",
    state: "",
    county: "",
    buildYear: "",
    roofYear: "",
    policyType: "HO",
    roofType: "architectural",
    hasSolar: false,
    mobileHome: false,
    top3Only: true,
    distanceToCoast: null as number | null,
    lat: null as number | null,
    lng: null as number | null,
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
const countyRaw = getAddressComponent(place, "administrative_area_level_2");
const county = countyRaw.replace(" County", "");

      setForm((prev) => ({
        ...prev,
        address: place.formatted_address || "",
        zip,
        city,
        state,
        county,
        distanceToCoast: Number(distance.toFixed(2)),
        lat,
        lng,
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

  const staticMapUrl = useMemo(() => {
    if (!GOOGLE_MAPS_API_KEY || form.lat == null || form.lng == null) {
      return "";
    }

    const params = new URLSearchParams({
      center: `${form.lat},${form.lng}`,
      zoom: "20",
      size: "1200x800",
      scale: "2",
      maptype: "satellite",
      markers: `color:red|${form.lat},${form.lng}`,
      key: GOOGLE_MAPS_API_KEY,
    });

    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
  }, [form.lat, form.lng]);

  const zillowUrl = useMemo(() => {
    if (!form.address) return "";
    return `https://www.zillow.com/homes/${form.address
      .replace(/,/g, "")
      .replace(/\s+/g, "-")}_rb/`;
  }, [form.address]);

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

    if (!form.buildYear) {
      setError("Enter a build year.");
      return;
    }

if (!form.roofYear) {
  setForm((prev) => ({
    ...prev,
    roofYear: prev.buildYear,
  }));
}

    const evaluated = evaluateCarriers({
      zip: form.zip,
      state: form.state,
      county: form.county,
      buildYear: Number(form.buildYear),
      roofYear: Number(form.roofYear || form.buildYear),      roofType: form.roofType,
      policyType: form.policyType,
      hasSolar: form.hasSolar,
      mobileHome: form.mobileHome,
      top3Only: form.top3Only,
      distanceToCoast: form.distanceToCoast,
      barrierIsland: isBarrierIsland(form.zip),
    });

    setResults(evaluated);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="w-full bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-center">
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
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Homeowners Carrier Guide</h1>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-stretch">
            <div className="h-full">
              <form
                onSubmit={handleSubmit}
                className="flex h-full flex-col space-y-4 rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div>
                  <input
                    ref={inputRef}
                    className="w-full rounded-lg border border-gray-300 p-3 outline-none transition focus:border-blue-500"
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
                        lat: null,
                        lng: null,
                      }))
                    }
                  />

                  {form.address && zillowUrl && (
                    <a
                      href={zillowUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                    >
                      View property details (Zillow)
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14 3h7m0 0v7m0-7L10 14"
                        />
                      </svg>
                    </a>
                  )}

                  <div className="mt-2 text-xs text-gray-500">
                    {status === "missing-key" && "Add your Google Maps API key"}
                    {status === "error" && "Google Maps could not be loaded"}
                    {status === "ready" && "Start typing and select an address from the dropdown"}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3"
                    placeholder="ZIP"
                    value={form.zip}
                    readOnly
                  />
                  <input
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3"
                    placeholder="City"
                    value={form.city}
                    readOnly
                  />
                  <input
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3"
                    placeholder="State"
                    value={form.state}
                    readOnly
                  />
                </div>

                {form.distanceToCoast !== null && (
                  <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-gray-800">
                    Distance to coast: <strong>{form.distanceToCoast} miles</strong> | County: <strong>{form.county}</strong>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <select
                    className="w-full rounded-lg border border-gray-300 p-3 bg-white"
                    value={form.policyType}
                    onChange={(e) => setForm({ ...form, policyType: e.target.value })}
                  >
                    <option value="HO">HO</option>
                    <option value="DP">DP</option>
                  </select>

                  <select
                    className="w-full rounded-lg border border-gray-300 p-3 bg-white"
                    value={form.roofType}
                    onChange={(e) => setForm({ ...form, roofType: e.target.value })}
                  >
                    <option value="architectural">Architectural Shingle</option>
                    <option value="composition">Composition Shingle</option>
                    <option value="metal">Metal</option>
                    <option value="tile">Tile</option>
                    <option value="flat">Flat</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
  className="w-full rounded-lg border border-gray-300 p-3"
  placeholder="Build Year"
  type="number"
  value={form.buildYear}
  onChange={(e) => {
    const newBuildYear = e.target.value;

    setForm((prev) => {
      const shouldSyncRoof =
        prev.roofYear === "" || prev.roofYear === prev.buildYear;

      return {
        ...prev,
        buildYear: newBuildYear,
        roofYear: shouldSyncRoof ? newBuildYear : prev.roofYear,
      };
    });
  }}
/>

                  <input
                    className="w-full rounded-lg border border-gray-300 p-3"
                    placeholder="Roof Year"
                    type="number"
                    value={form.roofYear}
                    onChange={(e) => setForm({ ...form, roofYear: e.target.value })}
                  />
                </div>

                {roofAge !== null && !Number.isNaN(roofAge) && (
                  <div className="text-xs text-gray-500">
                    Estimated roof age: {roofAge} years
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.hasSolar}
                      onChange={(e) => setForm({ ...form, hasSolar: e.target.checked })}
                    />
                    <span>Solar</span>
                  </label>

                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.mobileHome}
                      onChange={(e) => setForm({ ...form, mobileHome: e.target.checked })}
                    />
                    <span>Mobile Home</span>
                  </label>

                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.top3Only}
                      onChange={(e) => setForm({ ...form, top3Only: e.target.checked })}
                    />
                    <span>Top 3 Only</span>
                  </label>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <button className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 self-start">
                  Find Carriers
                </button>
              </form>
            </div>

            <div className="h-full">
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
                <div className="border-b px-5 py-3">
                  <h2 className="text-sm font-semibold text-gray-900">Property view</h2>
                </div>

                {staticMapUrl ? (
                  <div className="aspect-[4/3] bg-gray-100">
                    <img
                      src={staticMapUrl}
                      alt="Satellite view of selected property"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-gray-50 p-6 text-center text-sm text-gray-500">
                    Satellite preview will appear after selecting an address.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Results</h2>
              {results && (
                <span className="text-sm text-gray-500">
                  {results.length} option{results.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {!results ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                Enter the property details and select <strong>Find Carriers</strong> to see eligible options.
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 ${
                      r.isBrokerFallback ? "border-gray-300 bg-gray-50" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{r.label}</div>
                        {r.isBrokerFallback ? (
                          <div className="mt-1 text-sm text-gray-700">Submit for quotes</div>
                        ) : (
                          <>
                            <div className="mt-1 text-sm text-gray-700">{r.tier}</div>
                            <div className="mt-2 text-xs text-gray-500">{r.reason}</div>

{r.alerts && r.alerts.length > 0 && (
  <div className="mt-2 space-y-1">
    {r.alerts.map((alert: string, idx: number) => (
      <div
        key={idx}
        className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs text-yellow-800"
      >
        <span>⚠️</span>
        <span>{alert}</span>
      </div>
    ))}
  </div>
)}
                          </>
                        )}
                      </div>

                      {!r.isBrokerFallback && (
                        <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                          Score: {r.score}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-xs text-gray-500">
          © 2026 Reardon Insurance, LLC
        </div>
      </div>
    </div>
  );
}