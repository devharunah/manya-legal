// Renders the SAMPLE evidence files in src/assets/demo with Playwright Chromium:
//   node scripts/make-demo-docs.mjs src/assets/demo
import { chromium } from "@playwright/test";

const out = process.argv[2];
const stamp = `<div class="stamp">SAMPLE – for demonstration only</div>`;
const base = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", Roboto, Arial, sans-serif; }
  html, body { position: relative; overflow: hidden; }
  .stamp { position: absolute; z-index: 10; top: 50%; left: 50%; width: 150%; text-align: center;
    transform: translate(-50%, -50%) rotate(-28deg); font-size: 30px; font-weight: 800; letter-spacing: 3px;
    color: rgba(200, 30, 30, 0.35); border-top: 4px solid rgba(200, 30, 30, 0.35);
    border-bottom: 4px solid rgba(200, 30, 30, 0.35); padding: 8px; pointer-events: none; }`;

const receipt = (amount, id, time) => `<!doctype html><html><head><style>${base}
  body { width: 390px; background: #f2f2f2; padding: 18px; }
  .card { background: #fff; border-radius: 14px; padding: 22px; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
  .tick { width: 54px; height: 54px; border-radius: 50%; background: #1f9d55; color: #fff; font-size: 32px;
    display: grid; place-items: center; margin: 0 auto 10px; }
  h1 { text-align: center; font-size: 17px; color: #333; }
  .amt { text-align: center; font-size: 30px; font-weight: 700; margin: 10px 0 16px; color: #111; }
  .row { display: flex; justify-content: space-between; font-size: 14px; padding: 9px 0; border-top: 1px solid #eee; }
  .row span:first-child { color: #777; } .row span:last-child { font-weight: 600; color: #222; text-align: right; }
  .foot { text-align: center; color: #999; font-size: 12px; margin-top: 14px; }
</style></head><body>${stamp}<div class="card">
  <div class="tick">✓</div><h1>Mobile Money · Payment successful</h1>
  <div class="amt">UGX ${amount}</div>
  <div class="row"><span>Sent to</span><span>${"KATO WHOLESALERS LTD"}<br>0701 987654</span></div>
  <div class="row"><span>From</span><span>NAKATO SARAH<br>0772 123456</span></div>
  <div class="row"><span>Date</span><span>${time}</span></div>
  <div class="row"><span>Transaction ID</span><span>${id}</span></div>
  <div class="row"><span>Fee</span><span>UGX 7,000</span></div>
  <div class="row"><span>Reason</span><span>Sugar order</span></div>
  <div class="foot">Mobile Money receipt</div>
</div></body></html>`;

const receipt2 = (amount, id, time) =>
  receipt(amount, id, time)
    .replace("KATO WHOLESALERS LTD", "SSEMANDA BRIAN")
    .replace("0701 987654", "0757 246810")
    .replace("Sugar order", "Soap cartons");

const chat = `<!doctype html><html><head><style>${base}
  body { width: 420px; background: #e9e4dc; }
  .top { background: #2f4f4f; color: #fff; padding: 14px 16px; font-weight: 600; font-size: 16px; }
  .top small { display: block; font-weight: 400; opacity: .8; font-size: 12px; }
  .wrap { padding: 12px 10px 18px; display: flex; flex-direction: column; gap: 8px; }
  .day { align-self: center; background: #fff; color: #555; font-size: 11px; padding: 3px 10px; border-radius: 8px; }
  .m { max-width: 78%; padding: 7px 10px 18px; border-radius: 9px; font-size: 14px; line-height: 1.35; position: relative; color: #111; }
  .m i { position: absolute; right: 8px; bottom: 3px; font-size: 10px; color: #777; font-style: normal; }
  .them { background: #fff; align-self: flex-start; } .me { background: #d6f5c9; align-self: flex-end; }
</style></head><body>${stamp}
  <div class="top">Kato Wholesalers (Kato John)<small>+256 701 987654</small></div>
  <div class="wrap">
    <div class="day">2 November 2026</div>
    <div class="m me">Hello Kato, I need 40 bags of sugar, 50 kg each. What is your price?<i>09:12</i></div>
    <div class="m them">Madam 50,000 per bag. 40 bags is 2,000,000. Pay half or full and I deliver by Tuesday 10th.<i>09:20</i></div>
    <div class="m me">OK I will pay the full 2,000,000 tomorrow by Mobile Money. Deliver by 10th please.<i>09:24</i></div>
    <div class="m them">Deal. Sending invoice now 👍<i>09:25</i></div>
    <div class="day">3 November 2026</div>
    <div class="m me">I have sent 2,000,000. Transaction ID 58213907461<i>10:45</i></div>
    <div class="m them">Received, thank you madam. Delivery on 10th.<i>11:02</i></div>
    <div class="day">11 November 2026</div>
    <div class="m me">Kato the sugar has not come. When are you delivering?<i>08:30</i></div>
    <div class="m them">Sorry the truck had a problem. Next week for sure.<i>14:10</i></div>
    <div class="day">18 November 2026</div>
    <div class="m me">It is now one week. Please deliver my sugar or return my money.<i>09:05</i></div>
    <div class="m me">Kato please reply.<i>17:40</i></div>
  </div></body></html>`;

const invoice = `<!doctype html><html><head><style>${base}
  @page { size: A4; margin: 0; }
  body { padding: 56px 60px; color: #222; font-size: 13px; }
  .head { display: flex; justify-content: space-between; border-bottom: 3px solid #333; padding-bottom: 14px; }
  .head h1 { font-size: 26px; letter-spacing: 1px; } .muted { color: #666; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-top: 26px; }
  th, td { border: 1px solid #ccc; padding: 9px; text-align: left; } th { background: #f4f4f4; }
  td.r, th.r { text-align: right; } .total td { font-weight: 700; background: #fafafa; }
  .meta { display: flex; justify-content: space-between; margin-top: 22px; line-height: 1.6; }
  .note { margin-top: 26px; color: #444; line-height: 1.6; }
</style></head><body>${stamp}
  <div class="head"><div><h1>KATO WHOLESALERS LTD</h1><div class="muted">Kikuubo Lane, Kampala · 0701 987654</div></div>
  <div style="text-align:right"><h1 style="font-size:20px">PROFORMA INVOICE</h1><div class="muted">No. INV-0412<br>Date: 2 November 2026</div></div></div>
  <div class="meta"><div><b>Bill to</b><br>Nakato Sarah<br>Nakato General Store, Kikuubo<br>0772 123456</div>
  <div style="text-align:right"><b>Delivery</b><br>To buyer's shop, Kikuubo<br>By 10 November 2026</div></div>
  <table><tr><th>Item</th><th class="r">Qty</th><th class="r">Unit price (UGX)</th><th class="r">Amount (UGX)</th></tr>
  <tr><td>Sugar, 50 kg bag</td><td class="r">40</td><td class="r">50,000</td><td class="r">2,000,000</td></tr>
  <tr class="total"><td colspan="3">Total</td><td class="r">2,000,000</td></tr></table>
  <div class="note">Payment by Mobile Money to 0701 987654 (Kato Wholesalers Ltd). Goods delivered after full payment.</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
async function shot(html, file) {
  await page.setContent(html);
  const body = await page.$("body");
  await body.screenshot({ path: `${out}/${file}`, type: "png" });
}
await shot(receipt("2,000,000", "58213907461", "03 Nov 2026, 10:42"), "momo-receipt-kato.png");
await shot(chat, "chat-kato-wholesalers.png");
await shot(receipt2("1,500,000", "58377120954", "12 Nov 2026, 15:18"), "momo-receipt-ssemanda.png");
await page.setContent(invoice);
await page.pdf({ path: `${out}/invoice-kato-INV-0412.pdf`, format: "A4", printBackground: true });
await browser.close();
console.log("done");
