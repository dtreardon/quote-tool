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
  const eligibleCarriers = Object.values(carriers)
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
        isBrokerFallback: false,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.score - a.score);

  const limitedCarriers = input.top3Only
    ? eligibleCarriers.slice(0, 3)
    : eligibleCarriers;

  const withBrokerFallback =
    limitedCarriers.length < 3
      ? [
          ...limitedCarriers,
          {
            label: "Brokers",
            isBrokerFallback: true,
          },
        ]
      : limitedCarriers;

  return withBrokerFallback.sort((a: any, b: any) => {
    if (a.isBrokerFallback) return 1;
    if (b.isBrokerFallback) return -1;
    return b.score - a.score;
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
    buildYear: "",
    roofYear: "",
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

      setForm((prev) => ({
        ...prev,
        address: place.formatted_address || "",
        zip,
        city,
        state,
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

    const evaluated = evaluate({
      zip: form.zip,
      buildYear: Number(form.buildYear),
      roofYear: Number(form.roofYear),
      hasSolar: form.hasSolar,
      mobileHome: form.mobileHome,
      top3Only: form.top3Only,
      distanceToCoast: form.distanceToCoast,
      coastalGA: isGA(form.zip) && (form.distanceToCoast ?? 999) <= 10,
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
              <form onSubmit={handleSubmit} className="flex h-full flex-col space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
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
                  Distance to coast: <strong>{form.distanceToCoast} miles</strong>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  className="w-full rounded-lg border border-gray-300 p-3"
                  placeholder="Build Year"
                  type="number"
                  value={form.buildYear}
                  onChange={(e) => setForm({ ...form, buildYear: e.target.value })}
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
                          <div className="mt-1 text-sm text-gray-700">{r.tier}</div>
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
