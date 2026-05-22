export type GoogleWindow = Record<string, {
  maps: {
    places: {
      Autocomplete: new (el: HTMLInputElement, opts: unknown) => unknown
    }
  }
}>

export type AcInstance = {
  addListener: (event: string, cb: () => void) => void
  getPlace: () => Record<string, unknown>
}

export function loadGoogleMaps(apiKey: string): Promise<unknown> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'))
  const w = window as unknown as Record<string, unknown>
  const g = w['google'] as { maps?: { places?: unknown } } | undefined
  if (g?.maps?.places) return Promise.resolve(g)
  const existing = document.querySelector('script[data-google-maps="true"]')
  if (existing) {
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        const g = (window as unknown as Record<string, unknown>)['google'] as { maps?: { places?: unknown } } | undefined
        if (g?.maps?.places) {
          clearInterval(check)
          resolve(g)
        }
      }, 50)
      setTimeout(() => {
        clearInterval(check)
        reject(new Error('Google Maps load timeout'))
      }, 10000)
    })
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    s.async = true
    s.defer = true
    s.dataset.googleMaps = 'true'
    s.onload = () => resolve(w['google'])
    s.onerror = () => reject(new Error('Google Maps failed to load'))
    document.head.appendChild(s)
  })
}

export function getPlaceComponent(place: Record<string, unknown>, type: string): string {
  const components = (place?.address_components as Array<{ types: string[]; short_name: string }>) || []
  return components.find(c => c.types?.includes(type))?.short_name || ''
}

export function streetFromPlace(place: Record<string, unknown>): string {
  const number = getPlaceComponent(place, 'street_number')
  const route  = getPlaceComponent(place, 'route')
  return [number, route].filter(Boolean).join(' ')
}
