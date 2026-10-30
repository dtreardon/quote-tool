import { INITIAL_FORM, INITIAL_INSURED, homeUpdatedPatch, type FormState } from '@/app/types/form'
import { INITIAL_AUTO_FORM, INITIAL_DRIVER, INITIAL_VEHICLE, type AutoFormState } from '@/app/types/autoForm'
import { freshUids } from './sheetData'

// Builds a complete form from a recalled payload: every saved value is kept as-is,
// fields added to the form after the sheet was saved fall back to their defaults,
// list rows get fresh uids, and collapsible sections open when they hold data.

export function restoreHOForm(saved: Partial<FormState>): FormState {
  const base = Date.now()
  const f: FormState = { ...INITIAL_FORM, ...saved }

  f.insureds = freshUids(saved.insureds?.length ? saved.insureds : [INITIAL_INSURED], base)
    .map(ins => {
      const i = { ...INITIAL_INSURED, ...ins }
      return { ...i, showContact: i.showContact || !!(i.phone || i.email) }
    })
  f.claims       = freshUids(saved.claims, base + 1_000)
  f.quotes       = freshUids(saved.quotes?.length ? saved.quotes : INITIAL_FORM.quotes, base + 2_000)
  f.flood_quotes = freshUids(saved.flood_quotes?.length ? saved.flood_quotes : INITIAL_FORM.flood_quotes, base + 3_000)

  f.mortgagee_open = f.mortgagee_open || [
    f.mortgagee_name, f.mortgagee_street, f.mortgagee_city, f.mortgagee_state, f.mortgagee_zip, f.loan_number,
  ].some(Boolean)

  // Recalled renovation data is always shown (Home Updated row opens when it holds data)
  Object.assign(f, homeUpdatedPatch(f))

  return f
}

export function restoreAutoForm(saved: Partial<AutoFormState>): AutoFormState {
  const base = Date.now()
  return {
    ...INITIAL_AUTO_FORM,
    ...saved,
    drivers:  freshUids(saved.drivers?.length ? saved.drivers : [INITIAL_DRIVER], base).map(d => ({ ...INITIAL_DRIVER, ...d })),
    vehicles: freshUids(saved.vehicles?.length ? saved.vehicles : [INITIAL_VEHICLE], base + 1_000).map(v => ({ ...INITIAL_VEHICLE, ...v })),
    quotes:   freshUids(saved.quotes?.length ? saved.quotes : INITIAL_AUTO_FORM.quotes, base + 2_000),
  }
}
