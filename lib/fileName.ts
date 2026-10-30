import type { FormState } from '@/app/types/form'
import type { AutoFormState } from '@/app/types/autoForm'

// Saved PDF names. Each sheet stores `file_name`: empty means "auto" (follows the
// insured name / address / sheet type live); anything else is the agent's own name.
// ".pdf" is never part of the stored or displayed name — it is added on save.

// Names missing → no stray ", " or double spaces ("HO QUOTE SHEET" rather than ",  HO QUOTE SHEET")
const tidy = (s: string) => s.replace(/^\s*,\s*/, '').replace(/\s+/g, ' ').trim()

export function autoFileNameHO(form: FormState): string {
  const primary = form.insureds[0]
  const base = primary?.insuredType === 'entity'
    ? `${(primary?.entityName || '').toUpperCase()} ${form.policy_type || 'HO'} QUOTE SHEET ${form.prop_street || ''}`
    : `${(primary?.last || '').toUpperCase()}, ${(primary?.first || '').toUpperCase()} ${form.policy_type || 'HO'} QUOTE SHEET ${form.prop_street || ''}`
  return tidy(base)
}

export function autoFileNameAuto(form: AutoFormState): string {
  const primary = form.drivers[0]
  return tidy(`${(primary?.last || '').toUpperCase()}, ${(primary?.first || '').toUpperCase()} AUTO QUOTE SHEET`)
}

// Final name written to disk: Windows-illegal characters (\ / : * ? " < > |) and
// control characters stripped, a typed ".pdf" dropped, trailing dots/spaces removed
// (Windows disallows them), then ".pdf" appended. Falls back to the auto name.
export function saveFileName(custom: string | undefined, auto: string): string {
  const clean = (s: string) => s
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\.pdf$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/, '')
    .trim()
  const name = clean(custom || '') || clean(auto) || 'QUOTE SHEET'
  return `${name}.pdf`
}
