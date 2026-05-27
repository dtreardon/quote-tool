import type { AutoFormState } from '@/app/types/autoForm'

function yn(v: string): string {
  if (!v) return ''
  return v.toLowerCase() === 'yes' ? 'Yes' : v.toLowerCase() === 'no' ? 'No' : v
}

export function buildAutoPrintHTML(form: AutoFormState, logoUrl: string): string {
  const today = new Date()
  const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`

  const primary = form.drivers[0]
  const firstN  = primary?.first || ''
  const lastN   = primary?.last  || ''
  const suggested = `${lastN.toUpperCase()}, ${firstN.toUpperCase()} AUTO QUOTE SHEET`

  const referredBy = form.referred_by_name
    ? form.referred_by_name + (form.referred_by_company ? ` (${form.referred_by_company})` : '')
    : '—'

  // Driver rows
  const driverRows = form.drivers.map((drv, idx) => {
    const isPrimary = idx === 0
    const fullName  = [drv.first, drv.middle, drv.last, drv.suffix].filter(Boolean).join(' ')
    const flags: string[] = []
    if (!isPrimary && drv.secondary_named_insured) flags.push('Secondary Named Insured')
    if (drv.sr22 === 'yes') flags.push('SR-22')
    return `
    <div class="info-row">
      <div class="info-card" style="flex:2.5">
        <div class="card-label">${isPrimary ? 'Driver 1 — Primary Named Insured' : `Driver ${idx + 1}`}</div>
        <div class="card-value large">${fullName}${flags.length ? ' <span style="color:#c0392b;font-size:7pt;font-weight:bold">[' + flags.join(', ') + ']</span>' : ''}</div>
      </div>
      <div class="info-card"><div class="card-label">DOB</div><div class="card-value">${drv.dob}</div></div>
      <div class="info-card"><div class="card-label">SSN</div><div class="card-value">${drv.ssn}</div></div>
      <div class="info-card"><div class="card-label">Marital</div><div class="card-value">${drv.marital}</div></div>
      <div class="info-card"><div class="card-label">Occupation</div><div class="card-value">${drv.occupation}</div></div>
    </div>
    <div class="info-row" style="margin-top:2px">
      <div class="info-card" style="flex:1.5"><div class="card-label">Phone</div><div class="card-value">${drv.phone}</div></div>
      <div class="info-card" style="flex:2"><div class="card-label">Email</div><div class="card-value">${drv.email}</div></div>
      <div class="info-card" style="flex:2"><div class="card-label">License #</div><div class="card-value">${drv.license_number}</div></div>
      <div class="info-card w50"><div class="card-label">Lic. State</div><div class="card-value">${drv.license_state}</div></div>
    </div>`
  }).join('')

  // Vehicle rows
  const vehicleRows = form.vehicles.map((veh, idx) => {
    const covs: string[] = []
    if (veh.comp === 'yes') covs.push(`Comp $${veh.comp_ded || '—'}`)
    if (veh.collision === 'yes') covs.push(`Collision $${veh.collision_ded || '—'}`)
    const covStr = covs.join(' / ') || 'Liability Only'
    const typeStr = [veh.type, veh.commercial_use ? '(Commercial)' : ''].filter(Boolean).join(' ')
    const hasLien = !!veh.lienholder_name
    return `
    <div class="info-row">
      <div class="info-card w50"><div class="card-label">#</div><div class="card-value xl">${idx + 1}</div></div>
      <div class="info-card" style="flex:0.7"><div class="card-label">Year</div><div class="card-value xl">${veh.year}</div></div>
      <div class="info-card" style="flex:1.5"><div class="card-label">Make</div><div class="card-value">${veh.make}</div></div>
      <div class="info-card" style="flex:2"><div class="card-label">Model</div><div class="card-value">${veh.model}</div></div>
      <div class="info-card"><div class="card-label">Color</div><div class="card-value">${veh.color}</div></div>
      <div class="info-card"><div class="card-label">Type</div><div class="card-value">${typeStr}</div></div>
      <div class="info-card" style="flex:2"><div class="card-label">VIN / Serial #</div><div class="card-value" style="font-family:monospace;font-size:7.5pt">${veh.vin}</div></div>
    </div>
    <div class="info-row" style="margin-top:2px">
      <div class="info-card"><div class="card-label">Annual Mileage</div><div class="card-value">${veh.annual_mileage}</div></div>
      <div class="info-card" style="flex:2"><div class="card-label">Physical Damage</div><div class="card-value">${covStr}</div></div>
      ${veh.notes ? `<div class="info-card" style="flex:3"><div class="card-label">Notes</div><div class="card-value muted">${veh.notes}</div></div>` : ''}
    </div>
    ${hasLien ? `<div class="info-row" style="margin-top:2px">
      <div class="info-card" style="flex:3"><div class="card-label">Lienholder</div><div class="card-value">${veh.lienholder_name}</div></div>
      <div class="info-card" style="flex:3"><div class="card-label">Address</div><div class="card-value">${[veh.lienholder_street, veh.lienholder_city, veh.lienholder_state, veh.lienholder_zip].filter(Boolean).join(', ')}</div></div>
      <div class="info-card" style="flex:1.5"><div class="card-label">Loan #</div><div class="card-value">${veh.loan_number}</div></div>
    </div>` : ''}`
  }).join('')

  // Quote rows
  const quoteRows = form.quotes.map((q, idx) => `
    <div class="quote-item">
      <div class="quote-num">${idx + 1}</div>
      <div class="quote-carrier">${q.carrier}</div>
      <div class="quote-premium">${q.premium ? '$' + q.premium : ''}</div>
    </div>`).join('')

  const isNew       = form.new_purchase === 'yes'
  const garagingAddr = [form.garaging_street, form.garaging_city, form.garaging_state, form.garaging_zip].filter(Boolean).join(', ')
  const mailingAddr  = form.mail_same_as_garaging
    ? 'Same as garaging'
    : [form.mail_street, form.mail_city, form.mail_state, form.mail_zip].filter(Boolean).join(', ')

  const anySr22 = form.drivers.some(d => d.sr22 === 'yes')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${suggested}</title>
<style>
  @page { size: letter portrait; margin: 0.25in 0.25in 0.2in 0.25in; }
  * { box-sizing: border-box; margin:0; padding:0; }
  body { font-family: Arial, sans-serif; font-size: 8.5pt; color: #111; background: white; }

  .header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:5px 0; border-bottom:2.5px solid #c8922a; margin-bottom:6px; }
  .header img { height:42px; width:auto; flex-shrink:0; }
  .header-policy-block { flex:1; display:flex; flex-direction:column; justify-content:center; }
  .header-policy-type { font-size:15pt; font-weight:900; color:#334e85; line-height:1.15; }
  .header-notes-box { flex:1.2; border:0.7pt solid #bbb; border-radius:3px; padding:4px 7px; min-height:48px; display:flex; flex-direction:column; }
  .header-notes-label { font-size:5.5pt; color:#aaa; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:2px; }
  .header-notes-content { font-size:7.5pt; color:#333; line-height:1.35; white-space:pre-wrap; flex:1; }
  .header-right { text-align:right; flex-shrink:0; }
  .hcard { margin-bottom:2px; }
  .hcard .card-label { font-size:6pt; color:#aaa; text-transform:uppercase; letter-spacing:0.08em; }
  .hcard .card-value { font-size:9pt; font-weight:bold; color:#111; line-height:1.2; }

  .section { margin-bottom:5px; }
  .section-head { background:#334e85; color:white; font-size:7pt; font-weight:bold; letter-spacing:0.08em; padding:3px 6px; margin-bottom:3px; text-transform:uppercase; }

  .info-row { display:flex; gap:0; margin-bottom:2px; border:0.4pt solid #ddd; border-radius:2px; overflow:hidden; }
  .info-card { flex:1; padding:3px 5px; border-right:0.4pt solid #e8e4e0; background:white; }
  .info-card:last-child { border-right:none; }
  .info-card.w50 { flex:0 0 50px; }
  .card-label { font-size:5.5pt; color:#aaa; text-transform:uppercase; letter-spacing:0.07em; line-height:1.2; }
  .card-value { font-size:9pt; font-weight:bold; color:#111; line-height:1.3; }
  .card-value.large { font-size:10pt; }
  .card-value.muted { font-weight:normal; color:#555; font-style:italic; }
  .card-value.xl { font-size:11pt; font-weight:900; }

  .two-col { display:flex; gap:8px; }
  .col-left { flex:1.7; }
  .col-right { width:188px; flex-shrink:0; }

  .cov-item { display:flex; justify-content:space-between; align-items:baseline; padding:2.5px 5px; border-bottom:0.3pt solid #eee; }
  .cov-item:last-child { border-bottom:none; }
  .cov-label { font-size:6pt; color:#888; text-transform:uppercase; letter-spacing:0.05em; }
  .cov-value { font-size:9.5pt; font-weight:bold; color:#111; }
  .cov-box { border:0.5pt solid #ccc; border-radius:2px; margin-bottom:5px; }

  .quote-item { display:flex; align-items:center; padding:3px 5px; border-bottom:0.3pt solid #eee; gap:6px; }
  .quote-item:last-child { border-bottom:none; }
  .quote-num { width:14px; font-size:7pt; color:#888; font-weight:bold; }
  .quote-carrier { flex:1; font-size:8.5pt; font-weight:bold; color:#111; }
  .quote-premium { font-size:10pt; font-weight:bold; color:#334e85; text-align:right; }

  .footer { margin-top:6px; padding-top:3px; border-top:0.5pt solid #ccc; display:flex; justify-content:space-between; font-size:6pt; color:#aaa; }
  .footer .filename { color:#334e85; font-weight:bold; }

  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <img src="${logoUrl}" alt="Robinson & Associates" onerror="this.style.display='none'" />
  <div class="header-policy-block">
    <div class="header-policy-type">Auto</div>
    ${anySr22 ? '<div style="color:#c0392b;font-size:9pt;font-weight:bold;margin-top:2px">⚠ SR-22 Required</div>' : ''}
  </div>
  <div class="header-notes-box">
    <div class="header-notes-label">Notes</div>
    <div class="header-notes-content">${form.notes || ''}</div>
  </div>
  <div class="header-right">
    <div class="hcard"><div class="card-label">Date</div><div class="card-value">${dateStr}</div></div>
    <div class="hcard"><div class="card-label">Agent</div><div class="card-value">${form.agent || '—'}</div></div>
    <div class="hcard"><div class="card-label">Referred By</div><div class="card-value">${referredBy}</div></div>
  </div>
</div>

<!-- FILE INFO -->
<div class="section">
  <div class="section-head">${isNew ? 'New Purchase' : 'Current Policy'}</div>
  <div class="info-row">
    ${isNew ? `
      <div class="info-card"><div class="card-label">Purchase Date</div><div class="card-value">${form.closing_date}</div></div>
      <div class="info-card"><div class="card-label">Purchase Price</div><div class="card-value">${form.sales_price ? '$' + form.sales_price : ''}</div></div>
    ` : `
      <div class="info-card" style="flex:2"><div class="card-label">Current Carrier</div><div class="card-value">${form.current_carrier}</div></div>
      <div class="info-card"><div class="card-label">Current Premium</div><div class="card-value">${form.premium ? '$' + form.premium : ''}</div></div>
    `}
  </div>
</div>

<!-- ADDRESSES -->
<div class="section">
  <div class="section-head">Addresses</div>
  <div class="info-row">
    <div class="info-card" style="flex:3"><div class="card-label">Garaging Address</div><div class="card-value">${garagingAddr}</div></div>
    <div class="info-card" style="flex:2"><div class="card-label">Mailing Address</div><div class="card-value">${mailingAddr}</div></div>
  </div>
</div>

<!-- TWO COLUMN: DRIVERS + VEHICLES (left) / COVERAGE + UW + QUOTES (right) -->
<div class="two-col">
  <div class="col-left">
    <div class="section">
      <div class="section-head">Drivers</div>
      ${driverRows}
    </div>

    <div class="section">
      <div class="section-head">Vehicles</div>
      ${vehicleRows}
    </div>
  </div>

  <div class="col-right">
    <div class="section">
      <div class="section-head">Coverage</div>
      <div class="cov-box">
        ${form.cov_bi ? `<div class="cov-item"><div class="cov-label">BI / PD</div><div class="cov-value">${form.cov_bi}</div></div>` : ''}
        ${form.cov_pd ? `<div class="cov-item"><div class="cov-label">Prop. Damage</div><div class="cov-value">$${form.cov_pd}</div></div>` : ''}
        ${(form.cov_um_bi || form.cov_um_pd) ? `<div class="cov-item"><div class="cov-label">UM</div><div class="cov-value">${[form.cov_um_bi, form.cov_um_pd].filter(Boolean).join(' / ')}</div></div>` : ''}
        ${(form.cov_uim_bi || form.cov_uim_pd) ? `<div class="cov-item"><div class="cov-label">UIM</div><div class="cov-value">${[form.cov_uim_bi, form.cov_uim_pd].filter(Boolean).join(' / ')}</div></div>` : ''}
        ${form.pip_med_pay ? `<div class="cov-item"><div class="cov-label">PIP / Med Pay</div><div class="cov-value">${form.pip_med_pay}</div></div>` : ''}
        ${form.rental_reimbursement ? `<div class="cov-item"><div class="cov-label">Rental Reimb.</div><div class="cov-value">${yn(form.rental_reimbursement)}</div></div>` : ''}
        ${form.roadside ? `<div class="cov-item"><div class="cov-label">Roadside</div><div class="cov-value">${yn(form.roadside)}</div></div>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-head">Underwriting</div>
      <div class="cov-box">
        ${form.has_dui ? `<div class="cov-item"><div class="cov-label">DUI / DWI</div><div class="cov-value" style="${form.has_dui === 'yes' ? 'color:#c0392b' : ''}">${yn(form.has_dui)}</div></div>` : ''}
        ${form.has_violations ? `<div class="cov-item"><div class="cov-label">Violations</div><div class="cov-value" style="${form.has_violations === 'yes' ? 'color:#c0392b' : ''}">${form.has_violations === 'yes' ? form.num_violations + ' violation(s)' : 'None'}</div></div>` : ''}
        ${form.has_accidents ? `<div class="cov-item"><div class="cov-label">At-Fault Accid.</div><div class="cov-value" style="${form.has_accidents === 'yes' ? 'color:#c0392b' : ''}">${form.has_accidents === 'yes' ? form.num_accidents + ' accident(s)' : 'None'}</div></div>` : ''}
        ${form.bankruptcy ? `<div class="cov-item"><div class="cov-label">Bankruptcy</div><div class="cov-value">${yn(form.bankruptcy)}</div></div>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-head">Quoted Through / Premium</div>
      <div class="cov-box">
        ${quoteRows}
      </div>
    </div>
  </div>
</div>

<!-- FOOTER -->
<div class="footer">
  <span class="filename">${suggested}</span>
  <span>QuoteSheetPRO — Reardon Insurance, LLC &copy; 2026 — All Rights Reserved</span>
</div>

</body>
</html>`
}
