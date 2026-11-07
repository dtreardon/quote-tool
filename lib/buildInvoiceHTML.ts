import type { FormState } from '@/app/types/form'
import { printMoney } from './formatters'
import { APP_VERSION } from './version'
import {
  bindKey, expirationDate, formatMDY, insuredNames, invoiceTitle, mailingAddress,
  mortgageeAddress, propertyAddress, type BindKind,
} from './bind'

// Invoice PDF (Invoice panel), rendered through /api/pdf like the quote sheet.
// Modeled on the top half of a carrier-issued policy invoice: plain, office-made —
// Arial, black text, #d9d9d9 label cells, 1px black borders, square corners.
// All body text is 9pt (title 16pt); one cell padding and one section gap throughout.
// Letter portrait, one page. HO and flood always get separate invoices.

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Stop PDF viewers turning the email into a mailto: link (same trick as the quote sheet)
const deLinkifyEmail = (v: string) => v.replace('@', '@‌')

const lines = (...l: string[]) => l.map(v => v.trim()).filter(Boolean).map(esc).join('<br>')

export function buildInvoiceHTML(form: FormState, kind: BindKind, logoUrl: string, title: string): string {
  const b         = form[bindKey(kind)]
  const premium   = printMoney(b.premium, 'cents')
  const paid      = b.status === 'paid'
  const isNew     = form.new_purchase === 'yes'
  const effective = esc(b.effective_date)
  const prop      = propertyAddress(form)
  const mortgagee = form.mortgagee_name.trim()

  const infoRows: [string, string][] = [
    ['INVOICE NUMBER',  esc(b.invoice_number)],
    ['CARRIER',         esc(b.carrier)],
    ['POLICY NUMBER',   esc(b.policy_number)],
    ['EFFECTIVE DATE',  effective],
    ['EXPIRATION DATE', esc(expirationDate(b.effective_date))],
  ]

  // Name and address as one block per column. ISAOA/ATIMA gets its own line unless
  // the stored mortgagee name already contains it.
  const mAddr = mortgageeAddress(form)
  const loan  = form.loan_number.trim()
  const mortgageeBlock = lines(mortgagee, /ISAOA/i.test(mortgagee) ? '' : 'ISAOA/ATIMA', mAddr.street, mAddr.cityStateZip, loan ? `Loan #: ${loan}` : '')
  const iAddr = mailingAddress(form)
  const insuredBlock = lines(insuredNames(form), iAddr.street, iAddr.cityStateZip)
  const partiesRows = mortgagee
    ? `<tr><th>MORTGAGEE</th><th>INSURED</th></tr>
       <tr><td>${mortgageeBlock}</td><td>${insuredBlock}</td></tr>`
    : `<tr><th colspan="2">INSURED</th></tr>
       <tr><td colspan="2">${insuredBlock}</td></tr>`

  const payment = paid
    ? `<p>Annual premium of ${premium} has been paid in full.</p>`
    : `<p>Annual premium of ${premium} is due in full on ${effective}. Please make check payable to and mail to:</p>
       <p class="remit">Robinson &amp; Associates<br>5 Retreat Pl<br>St Simons Island, GA 31522</p>`

  const amounts: [string, string][] = paid
    ? [['Annual Premium', premium], ['Amount Paid', premium], ['Balance Due', '$0.00']]
    : [['Annual Premium', premium], ['Payment Due', premium], ['Payment Due Date', effective]]

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  @page { size: letter portrait; margin: 0.25in 0.25in 0.2in 0.25in; }
  /* One font everywhere — nothing may inherit an app/web font */
  html, body, body * { font-family: Arial, "Liberation Sans", Helvetica, sans-serif; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { font-size: 9pt; line-height: 1.3; color: #000; background: white; }
  :root { --gap: 12px; --pad: 3px 6px; }
  .page { min-height: 100%; display: flex; flex-direction: column; padding: 0.15in 0.25in 0; }
  .section { margin-top: var(--gap); }

  table { border-collapse: collapse; font-size: 9pt; line-height: 1.3; }
  th, td { border: 1px solid #000; padding: var(--pad); text-align: left; vertical-align: top; font-weight: 400; }
  th { background: #d9d9d9; font-weight: 700; }

  .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  .agency img { width: 2.5in; height: auto; display: block; margin-bottom: 8px; }
  .doc { text-align: right; }
  .doc-title { font-size: 16pt; line-height: 1.2; font-weight: 700; }
  .issued { font-weight: 700; margin: 6px 0; }
  .info { margin-left: auto; }

  .full { width: 100%; table-layout: fixed; }

  .amount-wrap { position: relative; display: flex; justify-content: center; }
  .amounts td { min-width: 1.15in; text-align: right; }

  /* Payment block: the most important text on the page — boxed, light fill, bold */
  .payment { border: 1px solid #000; background: #f2f2f2; padding: var(--pad); font-weight: 700; }
  /* Due: one blank line above the mailing address, indented 0.5in */
  .payment .remit { margin-top: 1.3em; padding-left: 0.5in; }

  .closing { font-weight: 700; }

  /* Red rubber stamp: double border, slight tilt, warped edges and ink gaps (SVG filter) */
  .stamp { position: absolute; left: calc(50% + 1.35in); top: 3px; transform: rotate(-9deg);
           color: #c4161c; border: 4px double #c4161c; padding: 3px 8px 2px; font-size: 13pt; font-weight: 900;
           letter-spacing: 0.06em; white-space: nowrap; opacity: 0.85; mix-blend-mode: multiply; filter: url(#rubber); }

  .spacer { flex: 1; }
  .footer { margin-top: var(--gap); padding: 3px 0 2px; display: flex; justify-content: space-between; font-size: 6.5pt; color: #888; }
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="rubber" x="-10%" y="-20%" width="120%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4" result="warp"/>
    <feDisplacementMap in="SourceGraphic" in2="warp" scale="4" xChannelSelector="R" yChannelSelector="G" result="warped"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="11" result="speck"/>
    <feColorMatrix in="speck" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3 0 0 0 2.6" result="mask"/>
    <feComposite in="warped" in2="mask" operator="in"/>
  </filter>
</svg>
<div class="page">
  <div class="top">
    <div class="agency">
      <img src="${logoUrl}" alt="Robinson &amp; Associates" onerror="this.style.display='none'" />
      <div>Robinson &amp; Associates Ins., Inc.</div>
      <div>5 Retreat Pl, St Simons Island, GA 31522</div>
      <div>(912) 638-9717</div>
      <div>${deLinkifyEmail('scteam@robinsoninsures.com')}</div>
    </div>
    <div class="doc">
      <div class="doc-title">${invoiceTitle(form, kind)}</div>
      <div class="issued">DATE ISSUED: ${formatMDY(new Date())}</div>
      <table class="info">
        ${infoRows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}
      </table>
    </div>
  </div>

  <table class="full section">
    ${partiesRows}
  </table>

  <table class="full section">
    <tr><th>LOCATION OF PROPERTY INSURED:</th></tr>
    <tr><td>${[prop.street, prop.cityStateZip].filter(Boolean).map(esc).join(', ')}</td></tr>
  </table>

  <div class="payment section">${payment}</div>

  <div class="amount-wrap section">
    <table class="amounts">
      ${amounts.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}
    </table>
    ${paid ? '<div class="stamp">PAID IN FULL</div>' : ''}
  </div>

  ${isNew ? '<p class="closing section">A SIGNED COPY OF THE CLOSING DISCLOSURE IS REQUIRED TO MAINTAIN COVERAGE. PLEASE SEND WITH PAYMENT.</p>' : ''}

  <div class="spacer"></div>
  <div class="footer">
    <span>QuoteSheetPRO is a product of Reardon Insurance, LLC &copy; 2026, All Rights Reserved</span>
    <span>v${APP_VERSION}</span>
  </div>
</div>
</body>
</html>`
}
