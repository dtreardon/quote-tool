import AutoForm from '@/components/auto/AutoForm'

export const metadata = {
  title: 'Auto Quote Sheet — QuoteSheetPRO',
}

export default function AutoPage() {
  const key = process.env.ANTHROPIC_API_KEY
  const autofillEnabled = !!key && key !== 'placeholder-replace-later'
  return <AutoForm autofillEnabled={autofillEnabled} />
}
