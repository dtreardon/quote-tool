import QuoteForm from '@/components/quote/QuoteForm'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>
}) {
  const key = process.env.ANTHROPIC_API_KEY
  const autofillEnabled = !!key && key !== 'placeholder-replace-later'
  const params = await searchParams
  return <QuoteForm autofillEnabled={autofillEnabled} sessionId={params.session} />
}
