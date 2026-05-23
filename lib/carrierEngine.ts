import { frontline_sc } from './carriers/frontline_sc'
import { frontline_nc } from './carriers/frontline_nc'
import { frontline_ga } from './carriers/frontline_ga'
import { orion180_ga } from './carriers/orion180_ga'
import { orion180_sc } from './carriers/orion180_sc'
import { universal_ga } from './carriers/universal_ga'
import { universal_nc } from './carriers/universal_nc'
import { universal_fl } from './carriers/universal_fl'
import { universal_sc } from './carriers/universal_sc'
import { msi } from './carriers/msi'
import { brokers } from './carriers/brokers'
import { towerhill } from './carriers/towerhill'
import { aspera } from './carriers/aspera'
import { homeownersofamerica } from './carriers/homeownersofamerica'
import { heritage } from './carriers/heritage'
import { americanintegrity } from './carriers/americanintegrity'
import { oceanharbor } from './carriers/oceanharbor'

const ALL_CARRIERS = [
  frontline_sc, frontline_nc, frontline_ga,
  orion180_ga, orion180_sc,
  universal_ga, universal_nc, universal_fl, universal_sc,
  msi, brokers, towerhill, aspera,
  homeownersofamerica, heritage, americanintegrity, oceanharbor,
]

export interface CarrierInput {
  state: string
  zip: string
  county: string
  distanceToCoast: number | null
  buildYear: number | null
  roofYear: number | null
  roofType: string
  policyType: string
  mobileHome: boolean
  barrierIsland: boolean
  dwellingCov: number | null
}

export interface EligibleCarrier {
  key: string
  label: string
  eligible: true
  score: number
  reason: string
  alerts: string[]
}

export interface IneligibleCarrier {
  key: string
  label: string
  eligible: false
  reason: string
}

export interface EligibilityResults {
  eligible: EligibleCarrier[]
  ineligible: IneligibleCarrier[]
}

function normalizeRoofType(raw: string): string {
  const t = raw.toLowerCase()
  if (t.includes('architectural') || t.includes('dimensional')) return 'architectural'
  if (t.includes('3-tab') || t.includes('asphalt') || t.includes('composition')) return 'composition'
  if (t.includes('metal') || t.includes('steel')) return 'metal'
  if (t.includes('tile') || t.includes('clay') || t.includes('concrete') || t.includes('slate')) return 'tile'
  if (t.includes('flat') || t.includes('tpo') || t.includes('built-up') || t.includes('modified')) return 'flat'
  if (t.includes('wood') || t.includes('shake')) return 'composition'
  return t
}

export function runEligibility(input: CarrierInput): EligibilityResults {
  const isMH = input.mobileHome || input.policyType === 'MH'
  const currentYear = new Date().getFullYear()

  const engineInput = {
    state: input.state,
    zip: input.zip,
    county: input.county,
    distanceToCoast: input.distanceToCoast ?? 999,
    buildYear: input.buildYear ?? currentYear,
    roofYear: input.roofYear ?? currentYear,
    roofType: normalizeRoofType(input.roofType),
    policyType: isMH ? 'HO' : input.policyType,
    mobileHome: isMH,
    barrierIsland: input.barrierIsland,
    hasSolar: false,
    xwind: false,
    xWindExposure: false,
    wildfire: 'none',
  }

  const eligible: EligibleCarrier[] = []
  const ineligible: IneligibleCarrier[] = []

  for (const carrier of ALL_CARRIERS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = carrier.evaluate(engineInput)
    if (result.eligible) {
      eligible.push({
        key: carrier.key,
        label: carrier.label,
        eligible: true,
        score: result.score ?? 5,
        reason: result.reason ?? '',
        alerts: result.alerts ?? [],
      })
    } else {
      ineligible.push({
        key: carrier.key,
        label: carrier.label,
        eligible: false,
        reason: result.reason ?? 'Ineligible',
      })
    }
  }

  eligible.sort((a, b) => b.score - a.score)
  return { eligible, ineligible }
}
