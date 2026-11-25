/**
 * Every interface string, in English. The Luganda version (lug.ts) is
 * generated from this file by scripts/translate-ui.ts and reviewed by a
 * Luganda speaker; any key it lacks falls back to English.
 *
 * Not in here, on purpose: the law itself (source texts, titles, currency
 * notes), which is never machine-translated, and the language names
 * "English" / "Oluganda", which always show in their own language.
 * `{n}` is a placeholder and must survive translation.
 */
export const en = {
  "nav.home": "MANYA home",
  "nav.tagline": "Commercial Justice Companion",
  "nav.dashboard": "Dashboard",
  "nav.cases": "My Cases",
  "nav.vault": "Business Vault",
  "nav.support": "Legal Support",
  "nav.profile": "Profile",
  "nav.language": "Language",
  "nav.menu": "Main menu",
  "shell.newCase": "New case",
  "shell.vaultShort": "Vault",
  "shell.notAdvice": "Legal information, not legal advice.",
  "stage.label": "Case progress",
  "stage.steps": "Report steps",
  "stage.done": "done",
  "demo.sampleTag": "Sample",

  "footer.notAdvice": "Preliminary legal information and dispute preparation, not legal advice.",
  "footer.body":
    "MANYA helps you prepare a dispute and find the right help. It does not decide who is right, conduct mediation or replace a lawyer.",
  "footer.sources": "Our legal sources",

  "landing.badge": "For traders in Kikuubo and across Uganda",
  "landing.title": "A supplier took your money and never delivered?",
  "landing.body":
    "Tell MANYA what happened, in Luganda or English, by voice or text. We turn it into an organised dispute report, keep your evidence in one place, and show you the ways to resolve it.",
  "landing.start": "Start my case",
  "landing.report": "Report",
  "landing.reportBody": "Explain what happened in your own words. MANYA asks only what is missing.",
  "landing.organise": "Organise",
  "landing.organiseBody":
    "Upload receipts and WhatsApp chats. We read them and flag anything that doesn't match.",
  "landing.resolve": "Resolve",
  "landing.resolveBody":
    "See your options, from talking to the supplier to mediation or small claims, with the law behind each.",
  "landing.loading": "Opening MANYA…",

  "demo.open": "Open the demo case",
  "demo.load": "Load demo cases",
  "demo.loading": "Loading the demo…",
  "demo.note": "Demo cases use a fictional trader and documents marked SAMPLE.",
  "demo.error": "We couldn't load the demo cases. Please try again.",
  "demo.live": "Start live demo",
  "demo.liveError": "We couldn't start the live demo. Please try again.",
  "demo.suggested": "Demo answer: tap to fill",

  "register.title": "Welcome to MANYA",
  "register.body":
    "A few details so your dispute report is complete. We collect only what a report needs.",
  "register.fullName": "Your full name",
  "register.phone": "Phone number",
  "register.phoneHint":
    "So a mediator or lawyer can reach you, only if you choose to share your case.",
  "register.businessName": "Business name (optional)",
  "register.businessType": "What does your business do?",
  "register.location": "Where is it? (optional)",
  "register.language": "Language",
  "register.save": "Continue",
  "register.saving": "Saving…",
  "register.error": "Check your name and phone number, then try again.",
  "register.privacy":
    "Your details are stored securely and only you can see your cases. Nothing is shared with anyone unless you give consent.",

  "businessType.general_retail": "General retail shop",
  "businessType.wholesale": "Wholesale",
  "businessType.food_beverages": "Food & beverages",
  "businessType.hardware": "Hardware & building materials",
  "businessType.clothing": "Clothing & textiles",
  "businessType.electronics": "Electronics & phones",
  "businessType.beauty": "Salon & beauty",
  "businessType.other": "Other",

  "dashboard.welcome": "Welcome, {n}",
  "dashboard.newTitle": "Start a new dispute",
  "dashboard.newBody": "Paid a supplier but the goods never came? Tell MANYA what happened.",
  "dashboard.newButton": "Report a dispute",
  "dashboard.active": "Active cases",
  "dashboard.completed": "Completed cases",
  "dashboard.none": "No cases yet.",
  "dashboard.vaultBody": "Licences, registration and agreements you can reuse in any case.",
  "dashboard.profile": "Your business",

  "cases.title": "My Cases",
  "cases.open": "Open case",
  "cases.respondent": "Supplier",
  "cases.amount": "Amount",
  "cases.updated": "Updated",
  "cases.unnamed": "Supplier not named yet",
  "cases.notFound": "This case doesn't exist or isn't yours.",

  "status.draft": "Draft",
  "status.collecting_information": "Intake in progress",
  "status.awaiting_user_confirmation": "Awaiting confirmation",
  "status.report_generated": "Report completed",
  "status.completed": "Closed",
  "status.paused": "Paused",
  "status.evidence": "Evidence collection",
  "status.ready": "Ready for resolution guidance",
  "status.referral": "Referral prepared",

  "case.tabReport": "Report",
  "case.tabOrganise": "Organise",
  "case.tabResolve": "Resolve",
  "case.progressReport": "Report",
  "case.progressEvidence": "Evidence",
  "case.progressResolve": "Resolution",
  "case.back": "All cases",
  "case.loading": "Loading your case…",

  "intake.greeting":
    "Tell me what happened with your business transaction. You can explain in your own words, in Luganda or English, by typing or with a voice note.",
  "intake.label": "Your message",
  "intake.answerHere": "Type your answer, or tap the microphone and speak",
  "intake.placeholder":
    "e.g. I paid a supplier 2,000,000 shillings for goods but they never delivered.",
  "intake.send": "Send",
  "intake.skip": "I don't know",
  "intake.skipped": "I don't know",
  "intake.thinking": "MANYA is reading your message…",
  "intake.retry":
    "Thanks. To keep your report accurate, please give that detail exactly, for example 2,000,000 shillings or 10 November 2026.",
  "intake.understood":
    "I understand that you paid for goods that have not been delivered. Let me collect some details so we can organise your case.",
  "intake.otherCategory":
    "Thank you, I've noted that. Let me collect some details so we can organise your case.",
  "intake.done": "Thank you. I have what I need. Please review your report below.",
  "intake.doneMissing":
    "Thank you. I have enough to prepare your report. A few details are still missing; they are marked below, and you can add them before confirming.",
  "intake.step": "Step {n} of 6",

  "ask.agreement":
    "Did you and the other party have an agreement about this? For example a written contract, an invoice, WhatsApp or SMS messages, or a verbal deal. And does anything you agreed say that disputes go to an arbitrator, or first to a mediator who helps both sides agree? It's fine to say you're not sure.",
  "ask.agreementClauses":
    "Does your agreement say anything about how disputes are handled? For example that they go to an arbitrator who decides, or first to a mediator who helps both sides agree. It's fine to say you're not sure.",
  "ask.parties":
    "Please share the other party's details: their name, their business or company name if you know it, and any phone number or contact you have.",
  "ask.partiesBoth":
    "To prepare your report: your name, business name and phone number, and the other party's name, business and phone number if you have them.",
  "ask.transaction": "A few details about the payment, please: {n}.",
  "ask.events":
    "After you paid, what happened? Were any goods delivered, have you contacted them, and what did they say? Mention dates if you remember them.",
  "ask.outcome":
    "What would you like to happen to resolve this, for example delivery of the goods or a refund? And do you have any records such as a payment confirmation, receipt, invoice, agreement or WhatsApp chat?",
  "ask.evidence":
    "Do you have any records that help show what happened, such as a payment confirmation, receipt, invoice, agreement or WhatsApp chat? You can upload them in the Organise tab.",
  "ask.clarify":
    "One more thing, so your report is accurate: {n}. If you don't know, tap \"I don't know\".",
  "intake.reviewNow": "Review my report",
  "intake.micHint":
    "Tap the microphone and speak: your words appear as you talk. Tap the square to stop, check the text, then tap the arrow to send.",
  "intake.voiceNotice":
    "Voice notes and Luganda text are sent to Sunbird AI to transcribe and translate; Sunbird may keep a copy.",
  "intake.aiNotice": "MANYA uses AI to read your messages. Check everything on the review screen.",
  "intake.error": "That didn't go through. Please try again.",
  "intake.translateError": "We couldn't translate your message. Try again, or switch to English.",
  "intake.heardEnglish": "Read as: {n}",

  "field.complainant.name": "Complainant name",
  "field.complainant.business_name": "Business name",
  "field.complainant.phone": "Contact phone",
  "field.respondent.name": "Supplier (respondent)",
  "field.respondent.phone": "Supplier phone",
  "field.transaction.date": "Date of payment",
  "field.transaction.amount": "Amount paid",
  "field.transaction.currency": "Currency",
  "field.transaction.goods": "Goods purchased",
  "field.transaction.agreement_type": "Type of agreement",
  "field.delivery.expected_date": "Agreed delivery date",
  "field.delivery.status": "Delivery status",
  "field.previous_communication": "Attempts to resolve it",
  "field.requested_resolution": "Outcome you want",
  "field.arbitration_agreement": "Arbitration clause in the agreement",
  "field.dispute_status": "Dispute status",
  "field.agreement_record": "Agreement recorded in a document or messages",
  "field.mediation_clause": "Mediation clause in the agreement",
  "field.separate_arbitration_agreement": "Separate written arbitration agreement",
  "field.complainant.email": "Email",
  "field.complainant.location": "Business location",
  "field.respondent.business_name": "Supplier's business name",
  "field.respondent.location": "Supplier's location",
  "field.transaction.payment_method": "Payment method",
  "field.evidence_available": "Records the trader has",

  "choice.transaction.agreement_type.written": "Written",
  "choice.transaction.agreement_type.verbal": "Verbal",
  "choice.transaction.agreement_type.whatsapp": "WhatsApp",
  "choice.transaction.agreement_type.invoice": "Invoice",
  "choice.transaction.agreement_type.sms": "SMS",
  "choice.transaction.agreement_type.other": "Other",
  "choice.delivery.status.not_delivered": "Not delivered",
  "choice.delivery.status.partly_delivered": "Partly delivered",
  "choice.delivery.status.delivered_late": "Delivered late",
  "choice.delivery.status.other": "Other",
  "choice.requested_resolution.refund": "Refund of my money",
  "choice.requested_resolution.delivery": "Delivery of the goods",
  "choice.requested_resolution.delivery_or_refund": "Delivery of the goods, or a refund",
  "choice.requested_resolution.money_owed": "Recovery of money owed",
  "choice.requested_resolution.compensation": "Compensation",
  "choice.requested_resolution.other": "Something else",
  "choice.arbitration_agreement.yes": "Yes",
  "choice.arbitration_agreement.no": "No",
  "choice.arbitration_agreement.unsure": "Not sure",
  "choice.agreement_record.yes": "Yes",
  "choice.agreement_record.no": "No",
  "choice.agreement_record.unsure": "Not sure",
  "choice.mediation_clause.yes": "Yes",
  "choice.mediation_clause.no": "No",
  "choice.mediation_clause.unsure": "Not sure",
  "choice.separate_arbitration_agreement.yes": "Yes",
  "choice.separate_arbitration_agreement.no": "No",
  "choice.separate_arbitration_agreement.unsure": "Not sure",
  "choice.transaction.payment_method.mobile_money": "Mobile money",
  "choice.transaction.payment_method.bank": "Bank transfer",
  "choice.transaction.payment_method.cash": "Cash",
  "choice.transaction.payment_method.other": "Other",
  "choice.dispute_status.ongoing": "Ongoing",
  "choice.dispute_status.resolved": "Resolved",

  "provenance.complainant": "Supplied by you",
  "provenance.document": "From a document",
  "provenance.verified": "Independently verified",
  "provenance.awaiting": "Awaiting your confirmation",

  "review.title": "Review your report",
  "review.body":
    "Check every detail. Correct anything that is wrong. Missing details are left blank, never guessed.",
  "review.notProvided": "Not provided",
  "review.unknown": "You said you don't know",
  "review.edit": "Edit",
  "review.save": "Save",
  "review.cancel": "Cancel",
  "review.confirm": "I confirm that this information is accurate to the best of my knowledge.",
  "review.generate": "Confirm and create PDF report",
  "review.generating": "Creating your report…",
  "review.download": "Download report (PDF), version {n}",
  "review.generated": "Your report is ready.",
  "review.missingRequired":
    "Some required details are still missing. You can still create the report; they will be listed as outstanding.",
  "review.narrative": "What you told MANYA",
  "review.groupParties": "Parties involved",
  "review.groupTransaction": "Transaction and what happened",
  "review.groupAgreement": "Agreement and dispute-resolution arrangements",
  "review.groupOutcome": "Outcome and records",
  "review.events": "What happened, in order",
  "review.accurate":
    "Does this accurately describe what happened? You can correct anything before your report is prepared.",
  "review.error": "We couldn't create the report. Please try again.",
  "review.disclaimer":
    "This report has been prepared from information provided by the reporting party and supporting materials made available to MANYA. It is a dispute preparation document, not a legal determination, certified statement or finding of liability.",

  "summary.title": "AI summary",
  "summary.body": "Get a short summary of what you reported, written by AI from your answers only.",
  "summary.create": "Summarise",
  "summary.again": "Summarise again",
  "summary.stop": "Stop",
  "summary.writing": "Writing…",
  "summary.translating": "Translating into Luganda…",
  "summary.notice":
    "Written by AI from your answers only. It is not legal advice; check it against your report.",
  "summary.error": "The summary isn't available right now. Your report is unaffected.",

  "evidence.title": "Supporting evidence",
  "evidence.body":
    "Upload receipts, Mobile Money messages, invoices or WhatsApp screenshots. Your originals are kept unchanged.",
  "evidence.upload": "Upload a document",
  "evidence.uploading": "Uploading and reading your document…",
  "evidence.types": "PDF, JPG or PNG, up to 5 MB.",
  "evidence.empty": "No documents yet.",
  "evidence.samples": "For demonstrations: download the fictional SAMPLE documents",
  "evidence.timeline": "Evidence in date order",
  "evidence.undated": "No date found",
  "evidence.confirm": "These details are correct",
  "evidence.confirmed": "Confirmed by you",
  "evidence.unconfirmed": "Please check what we read",
  "evidence.notVerified": "Not verified as authentic",
  "evidence.integrity": "File stored unchanged · fingerprint {n}",
  "evidence.extractionFailed": "We couldn't read this document. Enter the details yourself.",
  "evidence.lowConfidence": "We're not sure what this document is. Check the type and details.",
  "evidence.open": "View original",
  "evidence.category": "Type of document",
  "evidence.error": "That upload didn't work. Please try again.",
  "evidence.reviewFlag": "Please review",
  "evidence.reportFirst":
    "Upload evidence any time. Consistency checks start once your report has an amount, date and supplier.",

  "doc.documentType": "What it is",
  "doc.date": "Date",
  "doc.amount": "Amount",
  "doc.currency": "Currency",
  "doc.reference": "Transaction reference",
  "doc.sender": "Sender",
  "doc.recipient": "Recipient",
  "doc.description": "Description",

  "category.payment_evidence": "Payment evidence",
  "category.transaction_evidence": "Transaction evidence",
  "category.communication_evidence": "Communication evidence",
  "category.delivery_evidence": "Delivery evidence",
  "category.agreement": "Agreement",
  "category.business_record": "Business record",
  "category.other": "Other",
  "category.unknown": "Not sure",

  "consistency.amount":
    "Potential inconsistency: The transaction amount in the dispute report differs from the amount extracted from the uploaded document.",
  "consistency.currency":
    "Potential inconsistency: The currency in the dispute report differs from the currency on the uploaded document.",
  "consistency.date":
    "Potential inconsistency: The payment date in the dispute report differs from the date on the uploaded document.",
  "consistency.respondent":
    "Potential inconsistency: The supplier named in the dispute report doesn't match the recipient on the uploaded document.",
  "consistency.note":
    "Please review it. MANYA never changes your report on its own and draws no conclusion from a difference.",
  "consistency.reportSays": "Your report: {n}",
  "consistency.documentSays": "Document: {n}",

  "resolve.title": "Your options",
  "resolve.body":
    "These are preliminary options based on what you reported, not legal conclusions. Each one shows the law it relies on.",
  "resolve.needReport": "Finish and confirm your report first, so the options fit your case.",
  "resolve.status.potential_option": "Possible option",
  "resolve.status.requires_further_assessment": "Needs further assessment",
  "resolve.why": "Why this may fit",
  "resolve.steps": "How it works",
  "resolve.sources": "Law behind this",
  "resolve.providers": "Who can help",
  "resolve.prepare": "Prepare a referral",
  "resolve.lawNotTranslated":
    "The law is shown as written, in English. We never machine-translate it.",

  "pathway.clarify_agreement.title": "First, check the agreement",
  "pathway.arbitration.title": "Arbitration (if your agreement provides for it)",
  "pathway.agreed_mediation.title": "Mediation under your agreement",
  "pathway.negotiation.title": "Talk to the supplier directly",
  "pathway.mediation.title": "Voluntary mediation",
  "pathway.small_claims.title": "Small Claims Procedure",
  "pathway.legal_referral.title": "Get legal advice",

  "pathway.clarify_agreement.why":
    "Some details about your agreement are not clear yet. The right route depends on them, so MANYA won't point you to one until they are checked.",
  "pathway.clarify_agreement.steps":
    "If you can, upload the agreement, invoice or messages that record the deal in the Organise tab, or ask a legal aid provider to look at them.",

  "pathway.arbitration.why":
    "You reported that your agreement says disputes go to arbitration. Under Ugandan law an arbitration agreement must be in writing, which includes messages that keep a record.",
  "pathway.arbitration.whySeparate":
    "You reported a separate written agreement to go to arbitration. An arbitration agreement can be a clause in the contract or a separate written agreement.",
  "pathway.arbitration.verbal":
    "Your deal was made verbally, so check whether the arbitration term was ever written down.",
  "pathway.arbitration.check":
    "Whether the clause applies to this dispute, whether it is valid and enforceable, and what process it requires. This needs legal review; MANYA has not confirmed it.",
  "pathway.arbitration.steps":
    "Have the relevant clause reviewed to understand whether it applies to this dispute and what process it requires. If the parties can't agree on an arbitrator, CADR, now a department of the Ministry of Justice, handles appointments.",

  "pathway.agreed_mediation.why":
    "You reported that your agreement says disputes go to a mediator first. Mediation is different from arbitration: the mediator helps both sides agree but does not decide.",
  "pathway.agreed_mediation.check":
    "What the clause actually says: any process, named mediator or institution, and time limits. A mediation clause does not necessarily stop either side from going to court.",
  "pathway.agreed_mediation.steps":
    "Read the clause or have it reviewed, then propose mediation to the other party in writing, following any process it sets out.",

  "pathway.negotiation.why":
    "The law says a seller must deliver the goods the buyer paid for. Many disputes end when the supplier is reminded of this in writing.",
  "pathway.negotiation.check":
    "Keep a record of every message and promise. Agreeing to a new date or a part-refund is your choice.",
  "pathway.negotiation.steps":
    "Contact the supplier in writing (WhatsApp or a letter). Say what you paid, when, and ask for delivery or a refund by a clear date. Keep a copy of everything.",

  "pathway.mediation.whyNoClause":
    "No mediation clause was identified, but you don't need one: both sides can agree to mediation at any time. And if a case is filed in court, the Court Annexed Mediation Rules, 2026 let the parties refer it to mediation by mutual consent before the final decision.",
  "pathway.mediation.whyWithClause":
    "Besides any process in your agreement, both sides can agree to mediation at any time, and after a case is filed in court the 2026 Rules allow court-annexed mediation by mutual consent.",
  "pathway.mediation.check":
    "Whether the other party will agree. Mediation is voluntary: nobody is forced to accept an outcome. Court-annexed mediation is a possible later step, not a guaranteed right.",
  "pathway.mediation.steps":
    "Legal aid services such as Justice Centres Uganda and the Uganda Law Society offer mediation. In court-annexed mediation the parties choose a mediator, and the mediator charges no fee.",

  "pathway.small_claims.within":
    "Your claim of {n} is within the UGX 10,000,000 small claims limit, and claims about the supply of goods are covered. The amount is not the only condition.",
  "pathway.small_claims.over":
    "Your claim of {n} is above the UGX 10,000,000 small claims limit, and a claim can't be split to fit under it. Ask a lawyer about the right court.",
  "pathway.small_claims.whyUnknownAmount":
    "Small claims cover claims up to UGX 10,000,000. Add the amount to your report to check.",
  "pathway.small_claims.whyCurrency":
    "The small claims limit is in Uganda shillings and you paid in {n}, so the value needs to be converted and checked.",
  "pathway.small_claims.delivery":
    "You asked for delivery. Small claims don't cover a claim for delivery alone without an alternative claim for money.",
  "pathway.small_claims.arbitration":
    "Because an arbitration agreement may apply, a court may send the matter back to arbitration if the other side asks. Check this first.",
  "pathway.small_claims.conditions":
    "Other conditions apply: only an individual (not a company) can bring the claim, some kinds of dispute are excluded, and a notice of demand must be sent first.",
  "pathway.small_claims.steps":
    "Before filing, give the supplier a written notice of demand and 14 days to pay. Attach your agreement, receipts and other proof to the claim.",
  "pathway.small_claims.advocates":
    "Whether lawyers may appear in small claims hearings has been challenged in court. Check the current position with the court clerk.",

  "pathway.legal_referral.why":
    "The law lets a buyer take action against a seller who fails to deliver. A lawyer can assess your evidence and the best route. Free legal aid exists if you can't afford one.",
  "pathway.legal_referral.check":
    "A qualified legal professional may need to review your agreement and evidence before you choose a route.",
  "pathway.legal_referral.steps":
    "Contact a legal aid provider and share your dispute report, using a referral package you control.",

  "resolve.check": "What needs to be checked",
  "resolve.agreementSource":
    "This rests on your own agreement. MANYA has no reviewed legal source on enforcing mediation clauses.",
  "resolve.disclaimer":
    "MANYA provides preliminary legal information and dispute preparation, not legal advice. The appropriate resolution pathway depends on your agreement, the facts of your dispute and applicable Ugandan law. A qualified legal professional may need to review your case.",

  "referral.title": "Prepare a referral package",
  "referral.body":
    "Choose who to share with and exactly what to include. MANYA never sends anything on its own: you download the package and share it yourself.",
  "referral.provider": "Who will you contact?",
  "referral.include": "What to include",
  "referral.report": "Dispute intake report",
  "referral.index": "List of supporting documents",
  "referral.chronology": "Chronology of events",
  "referral.contact": "My contact details",
  "referral.documents": "Evidence files to attach",
  "referral.consent":
    "I give my consent for the information selected above to be put into a package that I will share with {n}.",
  "referral.create": "Create referral package",
  "referral.creating": "Creating your package…",
  "referral.ready": "Your package is ready. Share it with the provider yourself.",
  "referral.download": "Download package (PDF)",
  "referral.previous": "Packages you prepared",
  "referral.error": "We couldn't create the package. Please try again.",
  "referral.needConsent": "Tick the consent box to continue.",

  "provider.verified": "Verified",
  "provider.unverified": "Not verified",
  "provider.verification_pending": "Verification pending",
  "provider.inactive": "Inactive",
  "provider.source": "Checked against",
  "provider.lastChecked": "Last checked {n}",
  "provider.website": "Website",
  "provider.contact": "Contact",
  "provider.areas": "Can help with",

  "support.title": "Legal Support",
  "support.body":
    "Institutions that can help with commercial disputes. We list only organisations whose details we checked against their own official sources, with the date we checked.",
  "support.noPractitioners":
    "Individual mediators and lawyers are not listed yet: we have no authoritative register to verify them against.",

  "vault.title": "Business Vault",
  "vault.body":
    "Documents about your business that matter in any dispute: trading licence, registration certificate, supplier agreements.",
  "vault.notShared": "Vault documents are not part of any case unless you attach them.",

  "profile.title": "Your profile",
  "profile.saved": "Saved.",

  "mic.record": "Record a voice note",
  "mic.stop": "Stop recording",
  "mic.blocked":
    "Microphone access was blocked. Allow the microphone in your browser settings, or type instead.",
  "mic.notFound": "No microphone found on this device. Please type instead.",
  "mic.unsupported":
    "This browser can't record audio right now. Try Chrome on your phone, or type.",
  "mic.failed": "We couldn't start recording. Please type instead.",
  "mic.processFailed": "We couldn't process that recording. Please try again.",
  "mic.transcribeFailed": "We couldn't turn your voice into text. Please try again or type.",
  "mic.listening": "Listening… your words will appear here",
  "mic.finishing": "Finishing the transcription…",
  "mic.silent":
    "We didn't hear anything. Check that your microphone is on and not muted, then try again.",
  "mic.noWords": "We couldn't make out any words. Try again, a little closer to the phone.",

  "currency.current": "Current law",
  "currency.secondary": "Official summary. Confirm",
  "currency.historical": "Older text, may be outdated",

  "drawer.source": "Source {n}",
  "drawer.close": "Close",
  "drawer.exact": "Exact wording",
  "drawer.summary": "Close summary of the document",
  "drawer.stillLaw": "Is this still the law?",
  "drawer.document": "Document",
  "drawer.publisher": "Publisher",
  "drawer.asAt": "As at",
  "drawer.undated": "Undated by publisher",
  "drawer.open": "Open the official document",

  "common.loading": "Loading…",
  "common.error": "Something went wrong. Please try again.",
  "common.retry": "Try again",
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
