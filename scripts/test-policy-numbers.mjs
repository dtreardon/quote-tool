// Policy number template check — run with: node scripts/test-policy-numbers.mjs
// Loads the real carrier configs and the shared builder (Node strips the TS types).
import assert from 'node:assert/strict'
import { buildPolicyNumber, policyFormToken } from '../lib/policyNumber.ts'
import { homeownersofamerica } from '../lib/carriers/homeownersofamerica.ts'
import { orion180_sc } from '../lib/carriers/orion180_sc.ts'
import { orion180_ga } from '../lib/carriers/orion180_ga.ts'
import { americanintegrity } from '../lib/carriers/americanintegrity.ts'
import { frontline_sc } from '../lib/carriers/frontline_sc.ts'
import { universal_sc } from '../lib/carriers/universal_sc.ts'
import { msi } from '../lib/carriers/msi.ts'

// Nov 07 2026, 15:09 agent local time
const date = new Date(2026, 10, 7, 15, 9)
const build = (carrier, policyType, state) =>
  buildPolicyNumber(carrier.policyNumberTemplate, { date, form: policyFormToken(policyType), state })

const cases = [
  [homeownersofamerica, 'HO', 'SC', '41-629051-00'],
  [orion180_sc,         'HO', 'SC', 'OICH3SC_06229051-01'],
  [americanintegrity,   'HO', 'SC', 'AGHSC6229051-01'],
  [frontline_sc,        'HO', 'SC', '6270119051'],
  [universal_sc,        'HO', 'SC', '6701-6202-9051'],
  [orion180_ga,         'DP', 'GA', 'OICDPGA_06229051-01'],
  [msi,                 'HO', 'SC', ''], // no template → blank
]

let failed = 0
for (const [carrier, type, st, expected] of cases) {
  const got = build(carrier, type, st)
  try {
    assert.equal(got, expected)
    console.log(`PASS  ${carrier.label.padEnd(22)} ${type} ${st}  ${got || '(blank)'}`)
  } catch {
    failed++
    console.log(`FAIL  ${carrier.label.padEnd(22)} ${type} ${st}  got "${got}", expected "${expected}"`)
  }
}

if (failed) { console.log(`\n${failed} failed`); process.exit(1) }
console.log(`\nAll ${cases.length} passed`)
