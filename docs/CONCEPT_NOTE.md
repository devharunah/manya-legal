# Manya Legal: SME Legal Companion

**Concept note · Hack4Justice 2026 · Track: SME legal support**
Theme: *Advancing Integrated People-Centred Justice, Law and Order Service Delivery for Social Economic Transformation*

## 1. The problem

Uganda's small traders are expected to operate within a legal and regulatory framework that most of them have never been shown. A general merchandise retailer in Kikuubo meets questions with legal consequences every week:

- *What do I need to operate my shop legally?*
- *What happens if my trading licence lapses?*
- *My licence is expiring. What do I do, and what do I bring?*

The answers exist, but they are spread across Acts, statutory instruments and authority notices. They are written for lawyers, and they say nothing about how a rule applies to *this* shop. Paying for advice on routine compliance is out of reach for most micro-enterprises. The result is avoidable non-compliance, closures and fines, and a large informal sector that loses access to credit, tenders and growth.

We see three linked gaps:

1. **Accessibility:** the law is hard to find.
2. **Comprehension:** it is hard to understand.
3. **Application:** it is hard to turn into action for one particular business.

## 2. The solution

Manya Legal is a business-aware legal companion. It is not a generic chatbot. A trader:

1. **sets up a light business profile** (category, location, registration and licence status, with no personal ID numbers), stored only on their own device;
2. **asks in everyday language;**
3. **gets a structured answer**: a direct answer, *what the law says*, *what it means for your business*, *what you should do*, *what could change the answer*, and *what to double-check*, with the **official source behind every legal statement**.

A one-tap **"Plain language / Original law"** toggle sets the exact statutory wording beside the explanation. Traders can see that the explanation keeps the legal meaning, and judges, lawyers and officials can audit it.

## 3. How it works (and why it can be trusted)

| Step | What happens |
|---|---|
| Curated knowledge base | Official Ugandan sources only: the Trade (Licensing) Act (verbatim sections from ULII), URA's *Formalising a Business* guide (FY 2024-25), KCCA trading-licence guidance, and the 2017 Grading of Business Areas Instrument. |
| Legal-currency tagging | Every source and provision is labelled **current**, **official summary** or **older text**. Superseded rules, such as the old "expires 31 December" rule and outdated shilling penalties, are never presented as current law. |
| Retrieval + refusal gate | A deterministic search finds the relevant provisions. Questions outside our coverage (divorce, land, employment today) are **refused before any AI is involved**, with a referral to legal aid. |
| Grounded explanation | The AI may only use the retrieved provisions and must cite them. |
| Validation | Citations to anything not retrieved are stripped and the claim is marked "no source found". Any fee or fine amount that does not appear in our sources triggers a warning. |
| Pathways | Every answer ends with the right office (KCCA, URA, URSB) and, where needed, free legal aid (Uganda Law Society Legal Aid Project, Justice Centres Uganda). |

**Guardrails from day one:** we are not a substitute for a lawyer; we never invent Acts, sections, fees, fines or procedures; we separate what the law requires from how it may apply; we disclose uncertainty; and we collect the minimum data.

## 4. Local innovation

- Built around a real Ugandan user (a Kikuubo retailer) and real Ugandan sources (ULII, URA, KCCA, URSB).
- Designed for the phone: mobile-first and lightweight. The plain-language style is pitched at a trader, not a lawyer.
- Honest about Uganda's legal-currency problem. Many official copies online are older consolidations, so the product shows the date and status of each source.

## 5. Economic impact

- **Formalisation:** a clear three-step path (URSB name → URA TIN → trading licence) gives traders access to credit, tenders and tax clearance.
- **Fewer losses:** traders avoid closures, penalties and repeated trips caused by missing documents at renewal.
- **Lower cost of justice:** routine compliance questions are answered for free, and lawyers and legal aid are kept for disputes.
- **Better service delivery:** KCCA and URA receive better-prepared applicants.

## 6. Scale

The architecture is domain-agnostic. Adding a legal area means curating and tagging its sources, not rebuilding the product.

1. **Next domains:** employment obligations, tax compliance (presumptive tax, returns), commercial tenancy and supplier contracts, consumer protection.
2. **Other cities and districts:** add each local government's licensing guidance and fee grades.
3. **Languages and channels:** Luganda and other local languages, WhatsApp and USSD access for feature phones, voice for low-literacy users.
4. **Institutional partners:** JLOS institutions, KCCA, URA and URSB keep the source library current; the Uganda Law Society and Justice Centres take referrals.
5. **Legal review loop:** an evaluation set of questions with lawyer-reviewed expected answers (already in the codebase) becomes a standing quality check.

## 7. Measuring success

- Share of answers with every legal statement cited (target: 100%).
- Refusal accuracy on out-of-scope questions.
- Comprehension: whether traders can state the next step after reading an answer.
- Referrals completed to KCCA, URA, URSB and legal aid.

## 8. Status

A working prototype is deployed on Vercel. It includes onboarding, grounded Q&A over the curated library, a source browser and an automated test suite (unit, retrieval evals and end-to-end).

**Team:** _[add 3-5 member names and roles]_
