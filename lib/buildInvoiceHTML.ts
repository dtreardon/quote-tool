import type { FormState } from '@/app/types/form'
import { printMoney } from './formatters'
import { APP_VERSION } from './version'
import {
  bindKey, expirationDate, formatMDY, insuredNames, insuredPhone, invoiceTitle, mailingAddress,
  mortgageeAddress, propertyAddress, type Address, type BindKind,
} from './bind'

// Invoice PDF (Invoice panel), rendered through /api/pdf like the quote sheet.
// Modeled on the top half of a carrier-issued policy invoice: plain, office-made —
// Arial, black text, #d9d9d9 label cells, 1px black borders, square corners.
// Letter portrait, one page. HO and flood always get separate invoices.

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Stop PDF viewers turning the email into a mailto: link (same trick as the quote sheet)
const deLinkifyEmail = (v: string) => v.replace('@', '@‌')

const addressLines = (a: Address) => [a.street, a.cityStateZip].filter(Boolean).map(esc).join('<br>')

// Mortgagee header carries ISAOA/ATIMA unless the stored name already has it
const mortgageeHeader = (name: string) => /ISAOA/i.test(name) ? name : `${name} ISAOA/ATIMA`

export function buildInvoiceHTML(form: FormState, kind: BindKind, logoUrl: string, title: string): string {
  const b         = form[bindKey(kind)]
  const premium   = printMoney(b.premium, 'cents')
  const paid      = b.status === 'paid'
  const isNew     = form.new_purchase === 'yes'
  const effective = esc(b.effective_date)
  const insured   = esc(insuredNames(form))
  const prop      = propertyAddress(form)
  const mortgagee = form.mortgagee_name.trim()

  const infoRows: [string, string][] = [
    ['INVOICE NUMBER',  esc(b.invoice_number)],
    ['CARRIER',         esc(b.carrier)],
    ['POLICY NUMBER',   esc(b.policy_number)],
    ['EFFECTIVE DATE',  effective],
    ['EXPIRATION DATE', esc(expirationDate(b.effective_date))],
  ]

  const phone = insuredPhone(form)
  const partiesRows = mortgagee
    ? `<tr><th>MORTGAGEE: ${esc(mortgageeHeader(mortgagee))}</th><th>INSURED: ${insured}</th></tr>
       <tr><td>${addressLines(mortgageeAddress(form))}</td><td>${addressLines(mailingAddress(form))}</td></tr>
       <tr><td>Loan #: ${esc(form.loan_number.trim())}</td><td>${phone ? `Telephone: ${esc(phone)}` : ''}</td></tr>`
    : `<tr><th colspan="2">INSURED: ${insured}</th></tr>
       <tr><td colspan="2">${addressLines(mailingAddress(form))}</td></tr>
       ${phone ? `<tr><td colspan="2">Telephone: ${esc(phone)}</td></tr>` : ''}`

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
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { font-family: Arial, sans-serif; font-size: 9.5pt; color: #000; background: white; }
  .page { min-height: 100%; display: flex; flex-direction: column; padding: 0.2in 0.3in 0; }

  table { border-collapse: collapse; }
  th, td { border: 1px solid #000; padding: 4px 7px; text-align: left; vertical-align: top; }
  th { background: #d9d9d9; font-weight: 700; }

  .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  .agency img { height: 50px; width: auto; display: block; margin-bottom: 6px; }
  .agency div { font-size: 8pt; line-height: 1.35; }
  .agency .name { font-weight: 700; }
  .doc { text-align: right; }
  .doc-title { font-size: 14pt; font-weight: 700; letter-spacing: 0.02em; }
  .issued { font-weight: 700; margin: 6px 0 8px; }
  .info { margin-left: auto; font-size: 8.5pt; }
  .info th { width: 1.35in; }
  .info td { min-width: 1.9in; text-align: left; }

  .parties { width: 100%; margin-top: 20px; table-layout: fixed; }
  .parties td { height: 1.4em; line-height: 1.35; }

  .payment { margin-top: 18px; line-height: 1.45; }
  .payment p + p { margin-top: 6px; }
  .remit { padding-left: 18px; }

  .amount-wrap { position: relative; margin-top: 18px; display: flex; justify-content: center; }
  .amounts th { width: 1.6in; }
  .amounts td { width: 1.4in; font-weight: 700; text-align: right; }

  .closing { margin-top: 18px; font-weight: 700; }

  /* Red rubber stamp: double border, slight tilt, warped edges and ink gaps (SVG filter) */
  .stamp { position: absolute; left: calc(50% + 1.6in); top: 4px; transform: rotate(-9deg);
           color: #c4161c; border: 5px double #c4161c; padding: 4px 10px 2px; font-size: 17pt; font-weight: 900;
           letter-spacing: 0.06em; white-space: nowrap; opacity: 0.85; mix-blend-mode: multiply; filter: url(#rubber); }

  .spacer { flex: 1; }
  .footer { margin-top: 16px; padding: 3px 0 2px; display: flex; justify-content: space-between; font-size: 6.5pt; color: #888; }
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
      <div class="name">Robinson &amp; Associates Ins., Inc.</div>
      <div>5 Retreat Pl, St Simons Island, GA 31522</div>
      <div>Phone (912) 638-9717 | Fax (912) 638-6868</div>
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

  <table class="parties">
    ${partiesRows}
    <tr><th colspan="2">LOCATION OF PROPERTY INSURED:</th></tr>
    <tr><td colspan="2">${[prop.street, prop.cityStateZip].filter(Boolean).map(esc).join(', ')}</td></tr>
  </table>

  <div class="payment">${payment}</div>

  <div class="amount-wrap">
    <table class="amounts">
      ${amounts.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}
    </table>
    ${paid ? '<div class="stamp">PAID IN FULL</div>' : ''}
  </div>

  ${isNew ? '<p class="closing">A SIGNED COPY OF THE CLOSING DISCLOSURE IS REQUIRED TO MAINTAIN COVERAGE. PLEASE SEND WITH PAYMENT.</p>' : ''}

  <div class="spacer"></div>
  <div class="footer">
    <span>QuoteSheetPRO is a product of Reardon Insurance, LLC &copy; 2026, All Rights Reserved</span>
    <span>v${APP_VERSION}</span>
  </div>
</div>
</body>
</html>`
}
