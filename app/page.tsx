import QuoteForm from '@/components/quote/QuoteForm'

export default function Page() {
  const key = process.env.ANTHROPIC_API_KEY
  const autofillEnabled = !!key && key !== 'placeholder-replace-later'
  return <QuoteForm autofillEnabled={autofillEnabled} />
}
