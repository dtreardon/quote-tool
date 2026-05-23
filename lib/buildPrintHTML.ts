import type { FormState } from '@/app/types/form'

function yn(v: string): string {
  if (!v) return ''
  return v.toLowerCase() === 'yes' ? 'Yes' : v.toLowerCase() === 'no' ? 'No' : v
}

function covFmt(v: string): string {
  if (!v) return ''
  return '$' + String(v).replace(/^\$+/, '')
}

function dedFmt(v: string, mode: '$' | '%'): string {
  if (!v) return ''
  return mode === '$' ? `$${v}` : `${v}%`
}

export function buildPrintHTML(form: FormState, logoUrl: string): string {
  const today = new Date()
  const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`

  const firstN = form.insureds[0]?.first || ''
  const lastN  = form.insureds[0]?.last || ''
  const suggested = `${lastN.toUpperCase()}, ${firstN.toUpperCase()} ${form.policy_type || 'HO'} QUOTE SHEET ${form.prop_street || ''}`

  const isNew    = form.new_purchase === 'yes'
  const hasFlood = form.flood_quote === 'yes'
  const isMH     = form.policy_type === 'MH'

  const poolFeats: string[] = []
  if (form.pool_diving) poolFeats.push('Diving Board')
  if (form.pool_slide)  poolFeats.push('Slide')
  if (form.pool_fenced) poolFeats.push('Fenced w/Gate')

  // Insured rows
  const insuredRows = form.insureds.map((ins, idx) => {
    const isFirst = idx === 0
    const fullName = [ins.first, ins.middle, ins.last, ins.suffix].filter(Boolean).join(' ')
    const phone = ins.phone
    const email = ins.email
    const showPhone = isFirst || phone || email
    return `
      <div class="info-row">
        <div class="info-card" style="flex:2.5"><div class="card-label">${isFirst ? 'Insured' : 'Co-Insured'}</div><div class="card-value large">${fullName}</div></div>
        <div class="info-card"><div class="card-label">Date of Birth</div><div class="card-value">${ins.dob}</div></div>
        <div class="info-card"><div class="card-label">SSN</div><div class="card-value">${ins.ssn}</div></div>
        <div class="info-card"><div class="card-label">Marital</div><div class="card-value">${ins.marital}</div></div>
        <div class="info-card"><div class="card-label">Occupation</div><div class="card-value">${ins.occupation}</div></div>
        ${!isFirst ? `<div class="info-card"><div class="card-label">Relationship</div><div class="card-value">${ins.relationship}</div></div>` : ''}
      </div>
      ${showPhone ? `<div class="info-row" style="margin-top:2px">
        <div class="info-card" style="flex:1.5"><div class="card-label">Phone</div><div class="card-value">${phone}</div></div>
        <div class="info-card" style="flex:2.5"><div class="card-label">Email</div><div class="card-value">${email}</div></div>
      </div>` : ''}`
  }).join('')

  // Claim rows
  const claimRows = form.has_claims === 'yes' ? form.claims.map(c => `
    <div class="info-row">
      <div class="info-card w50"><div class="card-label">Date</div><div class="card-value">${c.date}</div></div>
      <div class="info-card" style="flex:2"><div class="card-label">Type</div><div class="card-value">${c.type}</div></div>
      <div class="info-card"><div class="card-label">Amount</div><div class="card-value">${c.amount ? '$' + c.amount : ''}</div></div>
      <div class="info-card" style="flex:2"><div class="card-label">Carrier</div><div class="card-value">${c.carrier}</div></div>
      <div class="info-card"><div class="card-label">Status</div><div class="card-value">${c.status}</div></div>
    </div>`).join('') : ''

  // Quote rows
  const quoteRows = form.quotes.map((q, idx) => `
    <div class="quote-item">
      <div class="quote-num">${idx + 1}</div>
      <div class="quote-carrier">${q.carrier}</div>
      <div class="quote-premium">${q.premium ? '$' + q.premium : ''}</div>
    </div>`).join('')

  const mhSection = isMH ? `
    <div class="section">
      <div class="section-head">MANUFACTURED HOME</div>
      <div class="info-row">
        <div class="info-card" style="flex:2"><div class="card-label">Make</div><div class="card-value">${form.mh_make}</div></div>
        <div class="info-card" style="flex:2"><div class="card-label">Model</div><div class="card-value">${form.mh_model}</div></div>
        <div class="info-card"><div class="card-label">Config</div><div class="card-value">${form.mh_config}</div></div>
        <div class="info-card"><div class="card-label">Location</div><div class="card-value">${form.mh_location}</div></div>
        <div class="info-card w50"><div class="card-label">Length</div><div class="card-value">${form.mh_length ? form.mh_length + 'ft' : ''}</div></div>
        <div class="info-card w50"><div class="card-label">Width</div><div class="card-value">${form.mh_width ? form.mh_width + 'ft' : ''}</div></div>
        <div class="info-card" style="flex:2"><div class="card-label">Serial #</div><div class="card-value">${form.mh_serial}</div></div>
      </div>
    </div>` : ''

  const floodQuoteRows = (form.flood_quotes ?? []).map((q, idx) => `
    <div class="quote-item">
      <div class="quote-num">${idx + 1}</div>
      <div class="quote-carrier">${q.carrier}</div>
      <div class="quote-premium">${q.premium ? '$' + q.premium : ''}</div>
    </div>`).join('')

  const floodSection = hasFlood ? `
    <div class="section">
      <div class="section-head">FLOOD INFORMATION</div>
      <div class="info-row">
        <div class="info-card"><div class="card-label">Flood Zone</div><div class="card-value">${form.flood_zone}</div></div>
        <div class="info-card"><div class="card-label">BFE</div><div class="card-value">${form.bfe || 'N/A'}</div></div>
        <div class="info-card"><div class="card-label">Elev. Certificate</div><div class="card-value">${yn(form.elevation_cert)}</div></div>
        <div class="info-card" style="flex:2"><div class="card-label">Flood Type</div><div class="card-value">${form.flood_type}</div></div>
      </div>
      <div class="info-row" style="margin-top:2px">
        <div class="info-card" style="flex:2"><div class="card-label">FIRM Panel</div><div class="card-value">${form.firm_panel}</div></div>
        <div class="info-card" style="flex:2"><div class="card-label">FIRM Eff. Date</div><div class="card-value">${form.firm_eff_date}</div></div>
      </div>
      <div class="info-row" style="margin-top:2px">
        <div class="info-card"><div class="card-label">Dwelling Cov</div><div class="card-value">${covFmt(form.flood_cov_dwelling)}</div></div>
        <div class="info-card"><div class="card-label">Contents Cov</div><div class="card-value">${covFmt(form.flood_cov_contents)}</div></div>
      </div>
      <div class="section-head" style="margin-top:4px">Flood Quoted Through / Premium</div>
      <div class="cov-box">
        ${floodQuoteRows}
      </div>
    </div>` : ''

  const showOtherAddresses = form.mail_same_as_subject || form.mail_street || form.prev_street

  const referredBy = form.referred_by_name
    ? form.referred_by_name + (form.referred_by_company ? ` (${form.referred_by_company})` : '')
    : '—'

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${suggested}</title>
<style>
  @page { size: letter portrait; margin: 0.25in 0.25in 0.2in 0.25in; }
  * { box-sizing: border-box; margin:0; padding:0; }
  body { font-family: Arial, sans-serif; font-size: 8.5pt; color: #111; background: white; }

  /* ── HEADER ── */
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
  .hcard .card-value.flood-yes { color:#c0392b; font-size:10pt; }
  .hcard .card-value.flood-no { color:#aaa; font-weight:normal; }

  /* ── SECTIONS ── */
  .section { margin-bottom:5px; }
  .section-head { background:#334e85; color:white; font-size:7pt; font-weight:bold; letter-spacing:0.08em; padding:3px 6px; margin-bottom:3px; text-transform:uppercase; }

  /* ── CARD FIELDS ── */
  .info-row { display:flex; gap:0; margin-bottom:2px; border:0.4pt solid #ddd; border-radius:2px; overflow:hidden; }
  .info-card { flex:1; padding:3px 5px; border-right:0.4pt solid #e8e4e0; background:white; }
  .info-card:last-child { border-right:none; }
  .info-card.w50 { flex:0 0 50px; }
  .card-label { font-size:5.5pt; color:#aaa; text-transform:uppercase; letter-spacing:0.07em; line-height:1.2; }
  .card-value { font-size:9pt; font-weight:bold; color:#111; line-height:1.3; }
  .card-value.large { font-size:10pt; }
  .card-value.muted { font-weight:normal; color:#555; font-style:italic; }
  .card-value.xl { font-size:11pt; font-weight:900; }

  /* ── TWO COLUMN ── */
  .two-col { display:flex; gap:8px; }
  .col-left { flex:1.7; }
  .col-right { width:188px; flex-shrink:0; }

  /* ── COVERAGE ── */
  .cov-item { display:flex; justify-content:space-between; align-items:baseline; padding:2.5px 5px; border-bottom:0.3pt solid #eee; }
  .cov-item:last-child { border-bottom:none; }
  .cov-label { font-size:6pt; color:#888; text-transform:uppercase; letter-spacing:0.05em; }
  .cov-value { font-size:9.5pt; font-weight:bold; color:#111; }
  .cov-box { border:0.5pt solid #ccc; border-radius:2px; margin-bottom:5px; }

  /* ── QUOTES ── */
  .quote-item { display:flex; align-items:center; padding:3px 5px; border-bottom:0.3pt solid #eee; gap:6px; }
  .quote-item:last-child { border-bottom:none; }
  .quote-num { width:14px; font-size:7pt; color:#888; font-weight:bold; }
  .quote-carrier { flex:1; font-size:8.5pt; font-weight:bold; color:#111; }
  .quote-premium { font-size:10pt; font-weight:bold; color:#334e85; text-align:right; }

  /* ── FOOTER ── */
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
    <div class="header-policy-type">${form.policy_type || '—'} &bull; ${form.occupancy || '—'}${form.rental_term ? ' – ' + form.rental_term : ''}</div>
  </div>
  <div class="header-notes-box">
    <div class="header-notes-label">Notes</div>
    <div class="header-notes-content">${form.notes || ''}</div>
  </div>
  <div class="header-right">
    <div class="hcard"><div class="card-label">Date</div><div class="card-value">${dateStr}</div></div>
    <div class="hcard"><div class="card-label">Agent</div><div class="card-value">${form.agent || '—'}</div></div>
    <div class="hcard"><div class="card-label">Referred By</div><div class="card-value">${referredBy}</div></div>
    <div class="hcard"><div class="card-label">Flood Quote</div><div class="card-value ${hasFlood ? 'flood-yes' : 'flood-no'}">${hasFlood ? '⚠ YES' : 'No'}</div></div>
  </div>
</div>

<!-- FILE INFO -->
<div class="section">
  <div class="section-head">${isNew ? 'New Purchase' : 'Current Policy'}</div>
  <div class="info-row">
    ${isNew ? `
      <div class="info-card" style="flex:1.5"><div class="card-label">Closing Date</div><div class="card-value">${form.closing_date}</div></div>
      <div class="info-card" style="flex:1.5"><div class="card-label">Sales Price</div><div class="card-value">${form.sales_price ? '$' + form.sales_price : ''}</div></div>
      <div class="info-card" style="flex:3"><div class="card-label">Contact (Atty/Lender)</div><div class="card-value">${form.closing_contact}</div></div>
    ` : `
      <div class="info-card" style="flex:2"><div class="card-label">Current Carrier</div><div class="card-value">${form.current_carrier}</div></div>
      <div class="info-card"><div class="card-label">Current Premium</div><div class="card-value">${form.premium ? '$' + form.premium : ''}</div></div>
      <div class="info-card"><div class="card-label">Purchase Year</div><div class="card-value">${form.purchase_year}</div></div>
    `}
  </div>
  ${form.mortgagee_name ? `
  <div class="info-row" style="margin-top:2px">
    <div class="info-card" style="flex:3"><div class="card-label">Mortgagee</div><div class="card-value">${form.mortgagee_name}</div></div>
    <div class="info-card" style="flex:3"><div class="card-label">Address</div><div class="card-value">${[form.mortgagee_street, form.mortgagee_city, form.mortgagee_state, form.mortgagee_zip].filter(Boolean).join(', ')}</div></div>
    <div class="info-card" style="flex:1.5"><div class="card-label">Loan #</div><div class="card-value">${form.loan_number}</div></div>
  </div>` : form.loan_number ? `
  <div class="info-row" style="margin-top:2px">
    <div class="info-card"><div class="card-label">Loan #</div><div class="card-value">${form.loan_number}</div></div>
  </div>` : ''}
</div>

<!-- INSURED -->
<div class="section">
  <div class="section-head">Insured Information</div>
  ${insuredRows}
</div>

<!-- SUBJECT PROPERTY -->
<div class="section">
  <div class="section-head">Subject Property Address</div>
  <div class="info-row">
    <div class="info-card" style="flex:3"><div class="card-label">Street</div><div class="card-value large">${form.prop_street}</div></div>
    <div class="info-card" style="flex:2"><div class="card-label">City</div><div class="card-value large">${form.prop_city}</div></div>
    <div class="info-card w50"><div class="card-label">State</div><div class="card-value large">${form.prop_state}</div></div>
    <div class="info-card"><div class="card-label">ZIP</div><div class="card-value large">${form.prop_zip}</div></div>
    <div class="info-card" style="flex:1.5"><div class="card-label">County</div><div class="card-value">${form.prop_county}</div></div>
  </div>
</div>

${showOtherAddresses ? `
<div class="section">
  <div class="section-head">Other Addresses</div>
  <div class="info-row">
    ${form.mail_same_as_subject
      ? `<div class="info-card"><div class="card-label">Mailing</div><div class="card-value muted">Same as Subject Property</div></div>`
      : `<div class="info-card" style="flex:3"><div class="card-label">Mailing Address</div><div class="card-value">${form.mail_street}</div></div>
         <div class="info-card" style="flex:2"><div class="card-label">City</div><div class="card-value">${form.mail_city}</div></div>
         <div class="info-card w50"><div class="card-label">State</div><div class="card-value">${form.mail_state}</div></div>
         <div class="info-card"><div class="card-label">ZIP</div><div class="card-value">${form.mail_zip}</div></div>`}
  </div>
  ${form.prev_street ? `<div class="info-row" style="margin-top:2px">
    <div class="info-card" style="flex:3"><div class="card-label">Previous Address</div><div class="card-value">${form.prev_street}</div></div>
    <div class="info-card" style="flex:2"><div class="card-label">City</div><div class="card-value">${form.prev_city}</div></div>
    <div class="info-card w50"><div class="card-label">State</div><div class="card-value">${form.prev_state}</div></div>
    <div class="info-card"><div class="card-label">ZIP</div><div class="card-value">${form.prev_zip}</div></div>
  </div>` : ''}
</div>` : ''}

<!-- TWO COLUMN -->
<div class="two-col">
  <div class="col-left">

    <!-- PROPERTY DETAILS -->
    <div class="section">
      <div class="section-head">Property Details</div>
      <div class="info-row">
        <div class="info-card"><div class="card-label">Year Built</div><div class="card-value xl">${form.year_built}</div></div>
        <div class="info-card w50"><div class="card-label">Stories</div><div class="card-value xl">${form.num_stories}</div></div>
        <div class="info-card"><div class="card-label">Sq Footage</div><div class="card-value xl">${form.sqft}</div></div>
        <div class="info-card w50"><div class="card-label">Beds</div><div class="card-value xl">${form.beds}</div></div>
        <div class="info-card w50"><div class="card-label">Full Bath</div><div class="card-value xl">${form.full_baths}</div></div>
        <div class="info-card w50"><div class="card-label">Half Bath</div><div class="card-value xl">${form.half_baths}</div></div>
      </div>
      <div class="info-row" style="margin-top:2px">
        <div class="info-card" style="flex:1.5"><div class="card-label">Construction</div><div class="card-value">${form.construction_type}</div></div>
        <div class="info-card" style="flex:1.5"><div class="card-label">Foundation</div><div class="card-value">${form.foundation_type}</div></div>
        <div class="info-card" style="flex:1.5"><div class="card-label">Garage</div><div class="card-value">${form.garage_type}${parseInt(form.garage_cars || '0') > 0 ? ' (' + form.garage_cars + ' Car)' : ''}</div></div>
        <div class="info-card" style="flex:1.5"><div class="card-label">Heat / Air</div><div class="card-value">${form.heat_air}</div></div>
        <div class="info-card w50"><div class="card-label">Laundry</div><div class="card-value">${form.laundry_floor}</div></div>
      </div>
    </div>

    <!-- ROOF & RENOVATIONS -->
    <div class="section">
      <div class="section-head">Roof &amp; Renovations</div>
      <div class="info-row">
        <div class="info-card"><div class="card-label">Roof Year</div><div class="card-value">${form.reno_roof}</div></div>
        <div class="info-card" style="flex:1.5"><div class="card-label">Shape</div><div class="card-value">${form.roof_shape}</div></div>
        <div class="info-card" style="flex:1.5"><div class="card-label">Type</div><div class="card-value">${form.roof_type}</div></div>
        <div class="info-card"><div class="card-label">Scope</div><div class="card-value">${form.reno_roof_scope}</div></div>
      </div>
      <div class="info-row" style="margin-top:2px">
        <div class="info-card"><div class="card-label">Electrical</div><div class="card-value">${form.reno_elec}${form.reno_elec_scope ? ' (' + form.reno_elec_scope + ')' : ''}</div></div>
        <div class="info-card"><div class="card-label">HVAC</div><div class="card-value">${form.reno_hvac}${form.reno_hvac_scope ? ' (' + form.reno_hvac_scope + ')' : ''}</div></div>
        <div class="info-card"><div class="card-label">Plumbing</div><div class="card-value">${form.reno_plum}${form.reno_plum_scope ? ' (' + form.reno_plum_scope + ')' : ''}</div></div>
        <div class="info-card"><div class="card-label">Water Heater</div><div class="card-value">${form.water_heater}${form.tankless === 'yes' ? ' (Tankless)' : ''}</div></div>
      </div>
    </div>

    <!-- SAFETY & FEATURES -->
    <div class="section">
      <div class="section-head">Safety &amp; Features</div>
      <div class="info-row">
        <div class="info-card" style="flex:1.5"><div class="card-label">Fire Alarm</div><div class="card-value">${form.fire_alarm}</div></div>
        <div class="info-card" style="flex:1.5"><div class="card-label">Burglar Alarm</div><div class="card-value">${form.burglar_alarm}</div></div>
        <div class="info-card"><div class="card-label">Sprinklered</div><div class="card-value">${yn(form.sprinklered)}${form.sprinkler_floor ? ' fl.' + form.sprinkler_floor : ''}</div></div>
        <div class="info-card"><div class="card-label">Gated</div><div class="card-value">${yn(form.gated)}</div></div>
        <div class="info-card w50"><div class="card-label">Fireplaces</div><div class="card-value">${form.fireplaces}</div></div>
        <div class="info-card"><div class="card-label">Trampoline</div><div class="card-value">${yn(form.trampoline)}</div></div>
      </div>
      <div class="info-row" style="margin-top:2px">
        <div class="info-card"><div class="card-label">Pool</div><div class="card-value">${form.pool === 'yes' ? 'Yes' + (poolFeats.length ? ' – ' + poolFeats.join(', ') : '') : 'No'}</div></div>
      </div>
    </div>

    <!-- UNDERWRITING -->
    <div class="section">
      <div class="section-head">Underwriting</div>
      <div class="info-row">
        <div class="info-card" style="flex:2"><div class="card-label">Bankruptcy / Foreclosure / Felony (5 yrs)</div><div class="card-value">${yn(form.bankruptcy)}</div></div>
        <div class="info-card"><div class="card-label">Dogs?</div><div class="card-value">${yn(form.has_dogs)}</div></div>
        ${form.has_dogs === 'yes' ? `
        <div class="info-card w50"><div class="card-label"># Dogs</div><div class="card-value">${form.num_dogs}</div></div>
        <div class="info-card"><div class="card-label">Biting Breed</div><div class="card-value">${yn(form.biting_dogs)}</div></div>` : ''}
      </div>
      ${claimRows ? `<div style="margin-top:2px">${claimRows}</div>` : ''}
    </div>

    ${mhSection}
    ${floodSection}

  </div><!-- /col-left -->

  <!-- RIGHT COLUMN -->
  <div class="col-right">
    <div class="section-head">Rating Info</div>
    <div class="cov-box" style="margin-bottom:5px">
      <div class="cov-item"><span class="cov-label">Protection Class</span><span class="cov-value">${form.protection_class}</span></div>
      <div class="cov-item"><span class="cov-label">Territory</span><span class="cov-value">${form.territory_code || '<span style="color:#ccc">N/A</span>'}</span></div>
      <div class="cov-item"><span class="cov-label">Miles to Fire Dept</span><span class="cov-value">${form.fire_dept_over ? form.miles_fire_dept + ' mi' : '&lt; 5 mi'}</span></div>
      <div class="cov-item"><span class="cov-label">Feet to Hydrant</span><span class="cov-value">${form.hydrant_over ? form.feet_hydrant + ' ft' : '&lt; 1,000 ft'}</span></div>
      <div class="cov-item"><span class="cov-label">Miles to Coast</span><span class="cov-value">${form.miles_coast || '<span style="color:#ccc">N/A</span>'}</span></div>
    </div>

    <div class="section-head">Desired Coverage</div>
    <div class="cov-box" style="margin-bottom:5px">
      <div class="cov-item"><span class="cov-label">Dwelling (A)</span><span class="cov-value">${covFmt(form.cov_dwelling)}</span></div>
      <div class="cov-item"><span class="cov-label">Other Structures (B)</span><span class="cov-value">${covFmt(form.cov_other_structures)}</span></div>
      <div class="cov-item"><span class="cov-label">Contents (C)</span><span class="cov-value">${covFmt(form.cov_contents)}</span></div>
      <div class="cov-item"><span class="cov-label">Loss of Use (D)</span><span class="cov-value">${covFmt(form.cov_loss_of_use)}</span></div>
      <div class="cov-item"><span class="cov-label">Liability (E)</span><span class="cov-value">${covFmt(form.cov_liability)}</span></div>
      <div class="cov-item"><span class="cov-label">Med Payments (F)</span><span class="cov-value">${covFmt(form.cov_med_payments)}</span></div>
      <div class="cov-item" style="border-top:0.5pt solid #ccc"><span class="cov-label">AOP Deductible</span><span class="cov-value">${dedFmt(form.cov_aop_ded, form.aop_ded_mode)}</span></div>
      <div class="cov-item"><span class="cov-label">${form.hur_type} Deductible</span><span class="cov-value">${dedFmt(form.cov_hurricane_ded, form.hur_ded_mode)}</span></div>
    </div>

    <div class="section-head">Quoted Through / Premium</div>
    <div class="cov-box" style="margin-bottom:5px">
      ${quoteRows}
    </div>
  </div><!-- /col-right -->
</div><!-- /two-col -->

<div class="footer">
  <span>QuoteSheetPRO is a product of Reardon Insurance, LLC &copy; 2026 &mdash; All Rights Reserved</span>
  <span class="filename">Suggested: ${suggested}.pdf</span>
</div>

</body>
</html>`
}
