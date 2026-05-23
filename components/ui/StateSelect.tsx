'use client'

import { selectCls } from './Field'

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID',
  'IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS',
  'MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK',
  'OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY',
]

interface StateSelectProps {
  value: string
  onChange: (v: string) => void
  className?: string
  autofilled?: boolean
}

export function StateSelect({ value, onChange, className = '', autofilled = false }: StateSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`${selectCls(autofilled)} uppercase ${className}`}
    >
      <option value="">--</option>
      {STATES.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  )
}
