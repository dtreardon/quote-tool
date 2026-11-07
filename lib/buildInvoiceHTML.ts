import type { FormState } from '@/app/types/form'
import { printMoney } from './formatters'
import { APP_VERSION } from './version'
import {
  billTo, expirationDate, formatMDY, insuredNames, mailingAddress, mortgageeAddress, propertyAddress,
  bindKey, type Address, type BindKind,
} from './bind'

// Invoice PDF (Bind panel), rendered through /api/pdf like the quote sheet.
// Letter portrait, same margins as the sheet. One invoice per policy: HO and
// flood always get separate invoices with their own numbers.

const NAVY = '#334e85'
const GOLD = '#c8922a'

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Stop PDF viewers turning the email into a mailto: link (same trick as the quote sheet)
const deLinkifyEmail = (v: string) => v.replace('@', '@‌')

const addressLines = (a: Address) => [a.street, a.cityStateZip].filter(Boolean).map(esc).join('<br>')

export function buildInvoiceHTML(form: FormState, kind: BindKind, logoUrl: string, title: string): string {
  const b        = form[bindKey(kind)]
  const premium  = printMoney(b.premium, 'cents')
  const paid     = b.status === 'paid'
  const isNew    = form.new_purchase === 'yes'
  const lineItem = kind === 'flood' ? 'Flood Annual Premium' : 'Homeowners Annual Premium'
  const insured  = insuredNames(form)
  const prop     = propertyAddress(form)

  const billToHTML = billTo(form, b) === 'mortgagee'
    ? `<div class="bt-name">${esc(form.mortgagee_name.trim())}</div>
       <div>${addressLines(mortgageeAddress(form))}</div>
       ${form.loan_number.trim() ? `<div class="bt-loan">Loan #: ${esc(form.loan_number.trim())}</div>` : ''}`
    : `<div class="bt-name">${esc(insured)}</div>
       <div>${addressLines(mailingAddress(form))}</div>`

  const details: [string, string][] = [
    ['Insured',          esc(insured)],
    ['Property Address', [prop.street, prop.cityStateZip].filter(Boolean).map(esc).join(', ')],
    ['Carrier',          esc(b.carrier)],
    ['Policy Number',    esc(b.policy_number)],
    ['Effective Date',   esc(b.effective_date)],
    ['Expiration Date',  esc(expirationDate(b.effective_date))],
  ]

  const remarks = paid
    ? `<p>Annual premium of ${premium} has been paid in full.</p>`
    : `<p>Annual premium of ${premium} is due in full on ${esc(b.effective_date)}. Please make check payable to and mail to:</p>
       <p class="remit">Robinson &amp; Associates<br>5 Retreat Pl<br>St Simons Island, GA 31522</p>`

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  @page { size: letter portrait; margin: 0.25in 0.25in 0.2in 0.25in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; background: white; }
  .page { min-height: 100%; display: flex; flex-direction: column; padding: 0.25in 0.35in 0; position: relative; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; padding-bottom: 12px; border-bottom: 2.5px solid ${GOLD}; }
  .agency img { height: 52px; width: auto; display: block; margin-bottom: 8px; }
  .agency-name { font-size: 12pt; font-weight: 700; color: ${NAVY}; margin-bottom: 2px; }
  .agency div { line-height: 1.45; }
  .inv-box { border: 1.5px solid ${NAVY}; border-radius: 4px; min-width: 2.4in; overflow: hidden; }
  .inv-title { background: ${NAVY}; color: white; font-size: 18pt; font-weight: 900; letter-spacing: 0.12em; text-align: center; padding: 6px 12px; }
  .inv-row { display: flex; justify-content: space-between; gap: 16px; padding: 5px 12px; border-top: 0.5pt solid #ddd; }
  .inv-row span:first-child { color: #666; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.05em; padding-top: 1px; }
  .inv-row span:last-child { font-weight: 700; }

  .stamp { position: absolute; top: 1.55in; right: 0.55in; transform: rotate(-12deg); border: 4px solid #1a7f37; color: #1a7f37; opacity: 0.55;
           font-size: 24pt; font-weight: 900; letter-spacing: 0.08em; padding: 6px 16px; border-radius: 6px; white-space: nowrap; }

  .label { font-size: 8.5pt; font-weight: 700; color: ${NAVY}; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; }
  .bill-to { margin-top: 22px; line-height: 1.45; }
  .bt-name { font-weight: 700; }
  .bt-loan { margin-top: 2px; }

  .details { margin-top: 22px; border: 0.7pt solid #ccc; border-radius: 4px; }
  .details .row { display: flex; padding: 6px 10px; border-top: 0.5pt solid #e3e3e3; }
  .details .row:first-child { border-top: none; }
  .details .k { width: 1.6in; flex-shrink: 0; color: #666; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.04em; padding-top: 1px; }
  .details .v { font-weight: 600; }

  table.items { width: 100%; border-collapse: collapse; margin-top: 22px; }
  table.items th { background: ${NAVY}; color: white; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; padding: 6px 10px; }
  table.items th:last-child, table.items td:last-child { text-align: right; }
  table.items td { padding: 8px 10px; border-bottom: 0.5pt solid #ddd; }
  table.items tr.total td { border-bottom: none; border-top: 2px solid ${GOLD}; font-weight: 900; font-size: 11pt; color: ${NAVY}; }

  .remarks { margin-top: 22px; line-height: 1.5; }
  .remarks p + p { margin-top: 6px; }
  .remit { padding-left: 14px; font-weight: 600; }
  .closing { margin-top: 10px !important; font-weight: 900; }

  .spacer { flex: 1; }
  .footer { margin-top: 16px; padding-top: 3px; border-top: 0.5pt solid #ccc; display: flex; justify-content: space-between; font-size: 6pt; color: #aaa; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="agency">
      <img src="${logoUrl}" alt="Robinson &amp; Associates" onerror="this.style.display='none'" />
      <div class="agency-name">Robinson &amp; Associates Ins., Inc.</div>
      <div>5 Retreat Pl, St Simons Island, GA 31522</div>
      <div>Phone (912) 638-9717 | Fax (912) 638-6868</div>
      <div>${deLinkifyEmail('scteam@robinsoninsures.com')}</div>
    </div>
    <div class="inv-box">
      <div class="inv-title">INVOICE</div>
      <div class="inv-row"><span>Invoice #</span><span>${esc(b.invoice_number)}</span></div>
      <div class="inv-row"><span>Invoice Date</span><span>${formatMDY(new Date())}</span></div>
    </div>
  </div>

  ${paid ? '<div class="stamp">PAID IN FULL</div>' : ''}

  <div class="bill-to">
    <div class="label">Bill To</div>
    ${billToHTML}
  </div>

  <div class="details">
    ${details.map(([k, v]) => `<div class="row"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')}
  </div>

  <table class="items">
    <thead><tr><th>Description</th><th>Amount</th></tr></thead>
    <tbody>
      <tr><td>${lineItem}</td><td>${premium}</td></tr>
      <tr class="total"><td>Total</td><td>${premium}</td></tr>
    </tbody>
  </table>

  <div class="remarks">
    <div class="label">Remarks</div>
    ${remarks}
    ${isNew ? '<p class="closing">A SIGNED COPY OF THE CLOSING DISCLOSURE IS REQUIRED TO MAINTAIN COVERAGE. PLEASE SEND WITH PAYMENT.</p>' : ''}
  </div>

  <div class="spacer"></div>
  <div class="footer">
    <span>QuoteSheetPRO is a product of Reardon Insurance, LLC &copy; 2026, All Rights Reserved</span>
    <span>v${APP_VERSION}</span>
  </div>
</div>
</body>
</html>`
}
