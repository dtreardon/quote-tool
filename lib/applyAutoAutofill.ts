import type { AutoFormState, DriverData } from '@/app/types/autoForm'

export type AutoApplyResult = {
  updates: Partial<AutoFormState>
  flashKeys: string[]
}

function normalizeSuffix(raw: string | null | undefined): string | null {
  if (!raw) return null
  const clean = raw.replace(/\.$/, '').trim()
  return ['Jr', 'Sr', 'II', 'III', 'IV'].includes(clean) ? clean : null
}

// Maps Claude's extracted JSON onto AutoFormState updates.
// Additive: only sets fields that are currently empty in the form.
// Pure — no side effects.
export function applyAutoExtractedData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  x: Record<string, any>,
  form: AutoFormState
): AutoApplyResult {
  const updates: Partial<AutoFormState> = {}
  const flashKeys: string[] = []

  // Only sets a top-level string field if the current value is empty
  const setIf = (key: keyof AutoFormState, val: string | null | undefined) => {
    if (val == null) return
    if (form[key]) return // additive: skip non-empty
    ;(updates as Record<string, string>)[key] = val
    flashKeys.push(key as string)
  }

  setIf('referred_by_name',    x.referred_by_name)
  setIf('referred_by_company', x.referred_by_company)
  setIf('mail_street',         x.mailing_address)
  setIf('mail_city',           x.mailing_city)
  setIf('mail_state',          x.mailing_state)
  setIf('mail_zip',            x.mailing_zip)
  setIf('garaging_street',     x.subject_address)
  setIf('garaging_city',       x.subject_city)
  setIf('garaging_state',      x.subject_state)
  setIf('garaging_zip',        x.subject_zip)

  // Driver 1 — additive per individual field
  const primary = form.drivers[0]
  if (primary) {
    const uid = primary.uid
    const driverPatch: Partial<DriverData> = {}

    const setDrvIf = (field: keyof DriverData, val: string | null | undefined) => {
      if (val == null) return
      if (primary[field]) return // additive
      ;(driverPatch as Record<string, string>)[field] = val as string
      flashKeys.push(`drv_${uid}_${field}`)
    }

    setDrvIf('first',  x.primary_first)
    setDrvIf('middle', x.primary_middle)
    setDrvIf('last',   x.primary_last)
    setDrvIf('dob',    x.primary_dob)
    setDrvIf('ssn',    x.primary_ssn_last4)
    setDrvIf('phone',  x.primary_phone)
    setDrvIf('email',  x.primary_email)

    const ns = normalizeSuffix(x.primary_suffix)
    if (ns != null && !primary.suffix) {
      driverPatch.suffix = ns
      flashKeys.push(`drv_${uid}_suffix`)
    }

    if (Object.keys(driverPatch).length > 0) {
      updates.drivers = form.drivers.map((d, i) => i === 0 ? { ...d, ...driverPatch } : d)
    }
  }

  return { updates, flashKeys }
}
