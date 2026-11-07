// Policy number templates (Bind panel). Each carrier config may carry a
// `policyNumberTemplate`; this builder fills its tokens from the agent's local
// time (24-hour clock) at the moment the carrier is selected.
//
//   {YYrev}   last two digits of year reversed   2026 → "62"
//   {YYYYrev} full year reversed                 2026 → "6202"
//   {MMDDrev} month+day reversed                 Nov 07 → "1107" → "7011"
//   {HHMMrev} 24-hour time reversed              15:09 → "1509" → "9051"
//   {FORM}    H3 for HO, DP for dwelling
//   {ST}      subject property state
//
// No imports on purpose: scripts/test-policy-numbers.mjs loads this file directly in Node.

export type PolicyFormToken = 'H3' | 'DP'

export function policyFormToken(policyType: string): PolicyFormToken {
  return policyType === 'DP' ? 'DP' : 'H3'
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const rev = (s: string) => s.split('').reverse().join('')

export function buildPolicyNumber(
  template: string | undefined,
  opts: { date: Date; form: PolicyFormToken; state: string },
): string {
  if (!template) return ''
  const d = opts.date
  const yyyy = String(d.getFullYear())
  const tokens: Record<string, string> = {
    YYYYrev: rev(yyyy),
    YYrev:   rev(yyyy.slice(-2)),
    MMDDrev: rev(pad2(d.getMonth() + 1) + pad2(d.getDate())),
    HHMMrev: rev(pad2(d.getHours()) + pad2(d.getMinutes())),
    FORM:    opts.form,
    ST:      (opts.state || '').toUpperCase(),
  }
  return template.replace(/\{(\w+)\}/g, (m, k: string) => tokens[k] ?? m)
}
