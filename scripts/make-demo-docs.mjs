// Renders the fictional SAMPLE evidence files with Playwright Chromium:
//   node scripts/make-demo-docs.mjs public/demo
// Every name, number, business and transaction here is invented test data.
import { chromium } from "@playwright/test";

const out = process.argv[2] ?? "public/demo";

const stamp = (text) => `<div class="stamp">${text}</div>`;
const base = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { position: relative; overflow: hidden; }
  body { font-family: "Segoe UI", Roboto, Arial, sans-serif; color: #222; }
  .stamp { position: absolute; z-index: 10; top: 50%; left: 50%; width: 160%; text-align: center;
    transform: translate(-50%, -50%) rotate(-30deg); font-size: 24px; font-weight: 800; letter-spacing: 2px;
    color: rgba(200, 30, 30, 0.33); border-top: 4px solid rgba(200, 30, 30, 0.33);
    border-bottom: 4px solid rgba(200, 30, 30, 0.33); padding: 10px; pointer-events: none; }
  .banner { background: #b91c1c; color: #fff; text-align: center; font-weight: 700; font-size: 12px;
    letter-spacing: 1px; padding: 6px; }`;

const page = (body, extra = "") =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${base}${extra}</style></head><body>${body}</body></html>`;

// File 1: mobile money transaction confirmation (PDF).
const receipt = page(
  `<div class="banner">SAMPLE — FICTIONAL DEMONSTRATION DOCUMENT — NOT A REAL TRANSACTION</div>
  ${stamp("SAMPLE — FICTIONAL DEMONSTRATION DOCUMENT — NOT A REAL TRANSACTION")}
  <div class="card">
    <div class="brand">Fictional Mobile Money Demo</div>
    <div class="tick">✓</div>
    <h1>Transaction confirmation</h1>
    <div class="amt">UGX 2,000,000</div>
    <div class="row"><span>Status</span><span>Successful</span></div>
    <div class="row"><span>Transaction ID</span><span>SAMPLE-TXN-20261110-001</span></div>
    <div class="row"><span>Date</span><span>10 November 2026, 11:24</span></div>
    <div class="row"><span>Sender</span><span>Sarah Namusoke<br>+256 700 000 101</span></div>
    <div class="row"><span>Recipient</span><span>Daniel Okello<br>+256 700 000 202</span></div>
    <div class="row"><span>Reference</span><span>Household merchandise</span></div>
    <p class="foot">Fictional Mobile Money Demo is not a real provider. This document records no real transaction.</p>
  </div>`,
  `@page { size: A5; margin: 0; } body { padding: 0 0 30px; }
  .card { margin: 26px 34px; border: 1px solid #ddd; border-radius: 14px; padding: 24px; }
  .brand { font-weight: 800; color: #0f5c8c; letter-spacing: .5px; font-size: 13px; }
  .tick { width: 54px; height: 54px; border-radius: 50%; background: #1f9d55; color: #fff; font-size: 30px; display: grid; place-items: center; margin: 14px auto 8px; }
  h1 { text-align: center; font-size: 17px; } .amt { text-align: center; font-size: 30px; font-weight: 700; margin: 8px 0 16px; }
  .row { display: flex; justify-content: space-between; font-size: 13px; padding: 9px 0; border-top: 1px solid #eee; }
  .row span:first-child { color: #777; } .row span:last-child { font-weight: 600; text-align: right; }
  .foot { margin-top: 14px; font-size: 10px; color: #888; text-align: center; }`,
);

// File 2: messaging screenshot (PNG).
const msg = (who, text, time) =>
  `<div class="m ${who === "Sarah" ? "me" : "them"}"><b>${who}</b>${text}<i>${time}</i></div>`;
const chat = page(
  `<div class="top">Daniel Okello · Okello Wholesale Supplies<small>+256 700 000 202 · SAMPLE chat</small></div>
  ${stamp("SAMPLE — FICTIONAL DEMONSTRATION")}
  <div class="wrap">
    <div class="day">10 November 2026</div>
    ${msg("Sarah", "I need the household merchandise we discussed. Can you confirm the total?", "09:12")}
    ${msg("Daniel", "Yes, the total is UGX 2,000,000.", "09:14")}
    ${msg("Sarah", "I will send the payment today. Please deliver by Thursday.", "09:16")}
    ${msg("Daniel", "Okay, once payment reflects, I will arrange delivery.", "09:17")}
    ${msg("Sarah", "Payment sent.", "11:30")}
    ${msg("Daniel", "Received. Thank you.", "11:42")}
    <div class="day">14 November 2026</div>
    ${msg("Sarah", "I was expecting delivery on Thursday. The goods have not arrived.", "10:15")}
    ${msg("Daniel", "There is a delay. I am checking with the transport team.", "10:31")}
    <div class="day">18 November 2026</div>
    ${msg("Sarah", "Please confirm when I will receive the goods. I need to resolve this.", "14:20")}
    ${msg("Daniel", "I will update you.", "14:48")}
  </div>`,
  `body { width: 430px; background: #e9e4dc; }
  .top { background: #2f4f4f; color: #fff; padding: 14px 16px; font-weight: 600; font-size: 15px; }
  .top small { display: block; font-weight: 400; opacity: .85; font-size: 12px; }
  .wrap { padding: 12px 10px 18px; display: flex; flex-direction: column; gap: 8px; }
  .day { align-self: center; background: #fff; color: #555; font-size: 11px; padding: 3px 10px; border-radius: 8px; }
  .m { max-width: 80%; padding: 6px 10px 18px; border-radius: 9px; font-size: 14px; line-height: 1.35; position: relative; }
  .m b { display: block; font-size: 11px; color: #2f6f5f; margin-bottom: 2px; }
  .m i { position: absolute; right: 8px; bottom: 3px; font-size: 10px; color: #777; font-style: normal; }
  .them { background: #fff; align-self: flex-start; } .me { background: #d6f5c9; align-self: flex-end; }`,
);

// File 3: commercial invoice (PDF).
const invoice = page(
  `<div class="banner">SAMPLE — FICTIONAL DEMONSTRATION DOCUMENT</div>
  ${stamp("SAMPLE — FICTIONAL DEMONSTRATION DOCUMENT")}
  <div class="doc">
  <div class="head"><div><h1>OKELLO WHOLESALE SUPPLIES</h1><div class="muted">Kampala · +256 700 000 202</div></div>
  <div style="text-align:right"><h2>INVOICE</h2><div class="muted">No. SAMPLE-INV-2026-011<br>Date: 10 November 2026</div></div></div>
  <div class="meta"><div><b>Seller</b><br>Okello Wholesale Supplies<br>Daniel Okello</div>
  <div><b>Buyer</b><br>Sarah's Home Essentials<br>Sarah Namusoke, Kikuubo, Kampala</div></div>
  <table><tr><th>Item</th><th class="r">Quantity</th><th class="r">Total</th></tr>
  <tr><td>Household storage containers</td><td class="r">20</td><td class="r">UGX 800,000</td></tr>
  <tr><td>Kitchen utensils</td><td class="r">10 sets</td><td class="r">UGX 700,000</td></tr>
  <tr><td>Cleaning accessories</td><td class="r">10 sets</td><td class="r">UGX 500,000</td></tr>
  <tr class="total"><td colspan="2">Total</td><td class="r">UGX 2,000,000</td></tr></table>
  <div class="meta"><div><b>Payment status:</b> Paid</div><div><b>Delivery date:</b> 12 November 2026</div></div>
  <p class="muted" style="margin-top:28px">Fictional document for demonstration only. No real business, person or transaction.</p>
  </div>`,
  `@page { size: A4; margin: 0; } .doc { padding: 40px 56px; font-size: 13px; }
  .head { display: flex; justify-content: space-between; border-bottom: 3px solid #333; padding-bottom: 14px; }
  h1 { font-size: 22px; } h2 { font-size: 20px; } .muted { color: #666; line-height: 1.5; }
  .meta { display: flex; justify-content: space-between; margin-top: 22px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  th, td { border: 1px solid #ccc; padding: 9px; text-align: left; } th { background: #f4f4f4; }
  .r { text-align: right; } .total td { font-weight: 700; background: #fafafa; }`,
);

// File 4: the trader's written statement (PDF).
const statement = page(
  `<div class="banner">SAMPLE — FICTIONAL TRADER STATEMENT FOR DEMONSTRATION</div>
  ${stamp("SAMPLE — FICTIONAL TRADER STATEMENT")}
  <div class="doc">
  <h1>Statement of Sarah Namusoke</h1>
  <p class="muted">Sarah's Home Essentials, Kikuubo, Kampala · +256 700 000 101 · Written 19 November 2026</p>
  <p>On 10 November 2026 I agreed with Daniel Okello of Okello Wholesale Supplies to buy household merchandise: 20 storage containers, 10 sets of kitchen utensils and 10 sets of cleaning accessories, for a total of UGX 2,000,000. We agreed this on WhatsApp and he sent me an invoice.</p>
  <p>The same day, 10 November 2026, I paid UGX 2,000,000 by mobile money. Mr Okello confirmed in WhatsApp that he received the payment. He said he would deliver by Thursday, 12 November 2026.</p>
  <p>The goods did not arrive on 12 November. On 14 November I messaged him; he said there was a delay with transport. On 18 November I followed up again and he only said he would update me. As of today, no goods have been delivered.</p>
  <p>We did not sign a formal contract, and I am not aware of anything in our agreement about arbitration or mediation.</p>
  <p>I would like either the merchandise I paid for to be delivered, or a refund of the UGX 2,000,000.</p>
  <p class="sig">Sarah Namusoke (fictional)</p>
  </div>`,
  `@page { size: A4; margin: 0; } .doc { padding: 48px 64px; font-size: 14px; line-height: 1.7; }
  h1 { font-size: 22px; margin-bottom: 4px; } .muted { color: #666; font-size: 12px; margin-bottom: 20px; }
  p { margin-bottom: 14px; } .sig { margin-top: 34px; font-style: italic; }`,
);

const browser = await chromium.launch();
const tab = await browser.newPage({ deviceScaleFactor: 2 });
await tab.setContent(receipt);
await tab.pdf({
  path: `${out}/SAMPLE_mobile_money_payment_confirmation.pdf`,
  format: "A5",
  printBackground: true,
});
await tab.setContent(chat);
await (await tab.$("body")).screenshot({
  path: `${out}/SAMPLE_whatsapp_supplier_conversation.png`,
  type: "png",
});
await tab.setContent(invoice);
await tab.pdf({
  path: `${out}/SAMPLE_commercial_invoice.pdf`,
  format: "A4",
  printBackground: true,
});
await tab.setContent(statement);
await tab.pdf({ path: `${out}/SAMPLE_trader_statement.pdf`, format: "A4", printBackground: true });
await browser.close();
console.log(`Wrote 4 SAMPLE files to ${out}`);
