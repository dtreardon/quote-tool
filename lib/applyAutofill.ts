import type { FormState, InsuredData } from '@/app/types/form'

export type ApplyResult = {
  updates: Partial<FormState>
  flashKeys: string[]
}

function normalizeSuffix(raw: string | null | undefined): string | null {
  if (!raw) return null
  const clean = raw.replace(/\.$/, '').trim()
  return ['Jr', 'Sr', 'II', 'III', 'IV'].includes(clean) ? clean : null
}

// Maps Claude's extracted JSON onto FormState updates.
// Pure — no side effects. Caller is responsible for calling update() and markAutofilled().
export function applyExtractedData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  x: Record<string, any>,
  currentInsureds: InsuredData[],
  currentNewPurchase: string = ''
): ApplyResult {
  const updates: Partial<FormState> = {}
  const flashKeys: string[] = []

  const set = (key: keyof FormState, val: string | null | undefined) => {
    if (val == null) return
    ;(updates as Record<string, string>)[key] = val
    flashKeys.push(key as string)
  }

  set('prop_street',         x.subject_address)
  set('prop_city',           x.subject_city)
  set('prop_state',          x.subject_state)
  set('prop_zip',            x.subject_zip)
  set('mail_street',         x.mailing_address)
  set('mail_city',           x.mailing_city)
  set('mail_state',          x.mailing_state)
  set('mail_zip',            x.mailing_zip)
  set('prev_street',         x.previous_address)
  set('prev_city',           x.previous_city)
  set('prev_state',          x.previous_state)
  set('prev_zip',            x.previous_zip)
  set('loan_number',         x.loan_number)
  set('occupancy',           x.occupancy)
  set('referred_by_name',    x.referred_by_name)
  set('referred_by_company', x.referred_by_company)
  set('mortgagee_name',      x.mortgagee_name)
  set('mortgagee_street',    x.mortgagee_street)
  set('mortgagee_city',      x.mortgagee_city)
  set('mortgagee_state',     x.mortgagee_state)
  set('mortgagee_zip',       x.mortgagee_zip)

  const mortgageeKeys: (keyof FormState)[] = [
    'mortgagee_name', 'mortgagee_street', 'mortgagee_city', 'mortgagee_state', 'mortgagee_zip', 'loan_number',
  ]
  if (mortgageeKeys.some(k => k in updates)) {
    updates.mortgagee_open = true
  }

  set('closing_date', x.closing_date)
  set('sales_price',  x.sales_price != null ? String(x.sales_price) : null)

  if (x.closing_date != null && !currentNewPurchase) {
    updates.new_purchase = 'yes'
    flashKeys.push('new_purchase')
  }

  // Insureds
  let updatedInsureds = [...currentInsureds]

  const primaryPatch: Partial<InsuredData> = {}
  if (x.primary_first     != null) primaryPatch.first  = x.primary_first
  if (x.primary_middle    != null) primaryPatch.middle = x.primary_middle
  if (x.primary_last      != null) primaryPatch.last   = x.primary_last
  const ps = normalizeSuffix(x.primary_suffix)
  if (ps != null) primaryPatch.suffix = ps
  if (x.primary_dob       != null) primaryPatch.dob    = x.primary_dob
  if (x.primary_ssn_last4 != null) primaryPatch.ssn    = x.primary_ssn_last4
  if (x.primary_phone     != null) primaryPatch.phone  = x.primary_phone
  if (x.primary_email     != null) primaryPatch.email  = x.primary_email
  if (Object.keys(primaryPatch).length > 0) {
    const primaryUid = currentInsureds[0].uid
    ;(Object.keys(primaryPatch) as (keyof InsuredData)[]).forEach(f => {
      flashKeys.push(`ins_${primaryUid}_${f}`)
    })
    updatedInsureds = updatedInsureds.map((ins, idx) =>
      idx === 0 ? { ...ins, ...primaryPatch } : ins
    )
  }

  const coInsureds: Record<string, string | null>[] = Array.isArray(x.co_insureds) ? x.co_insureds : []
  if (coInsureds.length > 0) {
    const autoFields: (keyof InsuredData)[] = ['first', 'middle', 'last', 'suffix', 'dob', 'ssn', 'phone', 'email']
    const appended: InsuredData[] = coInsureds.map((ci, i) => {
      const uid = Date.now() + i + 1
      const ins: InsuredData = {
        uid,
        first:        ci.first        ?? '',
        middle:       ci.middle       ?? '',
        last:         ci.last         ?? '',
        suffix:       normalizeSuffix(ci.suffix) ?? '',
        dob:          ci.dob          ?? '',
        ssn:          ci.ssn_last4    ?? '',
        marital:      '',
        occupation:   '',
        relationship: '',
        phone:        ci.phone  ?? '',
        email:        ci.email  ?? '',
        showContact:  false,
      }
      autoFields.forEach(f => { if (ins[f]) flashKeys.push(`ins_${uid}_${f}`) })
      return ins
    })
    updatedInsureds = [...updatedInsureds, ...appended]
  }

  if (JSON.stringify(updatedInsureds) !== JSON.stringify(currentInsureds)) {
    updates.insureds = updatedInsureds
  }

  return { updates, flashKeys }
}
