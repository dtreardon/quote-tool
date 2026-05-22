'use client'

interface RadioGroupProps {
  name: string
  value: string
  onChange: (v: string) => void
  options?: { value: string; label: string }[]
}

export function YesNo({ name, value, onChange }: RadioGroupProps) {
  return (
    <div className="flex gap-4 mt-1">
      {['yes', 'no'].map(opt => (
        <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-[13px]">
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="w-[15px] h-[15px] accent-navy flex-shrink-0"
          />
          {opt === 'yes' ? 'Yes' : 'No'}
        </label>
      ))}
    </div>
  )
}

export function RadioGroup({ name, value, onChange, options = [] }: RadioGroupProps) {
  return (
    <div className="flex gap-4 mt-1 flex-wrap">
      {options.map(opt => (
        <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer text-[13px]">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="w-[15px] h-[15px] accent-navy flex-shrink-0"
          />
          {opt.label}
        </label>
      ))}
    </div>
  )
}
