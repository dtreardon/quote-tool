export const AGENTS = ['Becca','GA/Danny','Jennie','Mallory','Rob','Sam']

// Shared by the HO and Auto sheets — an agent picked on either becomes the default for both
const STORAGE_KEY = 'qsp_last_agent'

export function loadSavedAgent(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY) ?? ''
    return AGENTS.includes(v) ? v : ''
  } catch {
    return ''
  }
}

export function saveAgent(agent: string) {
  try {
    if (agent) localStorage.setItem(STORAGE_KEY, agent)
    else localStorage.removeItem(STORAGE_KEY)
  } catch { /* storage unavailable — default just won't persist */ }
}
