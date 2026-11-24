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
    "Hello. Tell me what happened with your supplier, in your own words. You can type or record a voice note.",
  "intake.label": "Your message",
  "intake.placeholder":
    "e.g. I paid a supplier 2,000,000 shillings for goods but they never delivered.",
  "intake.send": "Send",
  "intake.skip": "I don't know",
  "intake.skipped": "I don't know",
  "intake.thinking": "MANYA is reading your message…",
  "intake.retry":
    "I couldn't find that clearly in your answer. Please say it exactly, for example 2,000,000 shillings or 10 November 2026.",
  "intake.understood":
    "I understand that you paid for goods that have not been delivered. Let me collect some details so we can organise your case.",
  "intake.otherCategory":
    "MANYA currently prepares reports for supplier non-delivery disputes. I'll still record what you tell me, but the guidance may not fit your situation.",
  "intake.done": "Thank you. I have what I need. Please review your report below.",
  "intake.reviewNow": "Review my report",
  "intake.micHint":
    "Tap the microphone to speak (up to 30 seconds). Check the text before sending.",
  "intake.voiceNotice":
    "Voice notes and Luganda text are sent to Sunbird AI to transcribe and translate; Sunbird may keep a copy.",
  "intake.aiNotice": "MANYA uses AI to read your messages. Check everything on the review screen.",
  "intake.error": "That didn't go through. Please try again.",
  "intake.translateError": "We couldn't translate your message. Try again, or switch to English.",
  "intake.heardEnglish": "Read as: {n}",

  "q.complainant.name": "What is your full name?",
  "q.complainant.business_name": "What is the name of your business?",
  "q.complainant.phone": "What phone number can people reach you on?",
  "q.respondent.name": "What is the supplier's name, or the name of their business?",
  "q.respondent.phone": "Do you have the supplier's phone number?",
  "q.transaction.date": "When did you make the payment?",
  "q.transaction.amount": "How much did you pay?",
  "q.transaction.currency": "In which currency did you pay? For example Uganda shillings.",
  "q.transaction.goods": "What goods did you pay for?",
  "q.transaction.agreement_type": "Was the agreement written, through WhatsApp, or verbal?",
  "q.delivery.expected_date": "Did the supplier give you a specific delivery date?",
  "q.delivery.status": "Were any of the goods delivered?",
  "q.previous_communication": "Have you contacted the supplier since the payment? What happened?",
  "q.requested_resolution":
    "What would you prefer: receiving the goods or getting your money back?",
  "q.arbitration_agreement":
    "Did your agreement say that disputes go to arbitration or a named mediator?",

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
  "field.arbitration_agreement": "Arbitration or mediation clause",

  "choice.transaction.agreement_type.written": "Written",
  "choice.transaction.agreement_type.verbal": "Verbal",
  "choice.transaction.agreement_type.whatsapp": "WhatsApp",
  "choice.transaction.agreement_type.other": "Other",
  "choice.delivery.status.not_delivered": "Not delivered",
  "choice.delivery.status.partly_delivered": "Partly delivered",
  "choice.delivery.status.delivered_late": "Delivered late",
  "choice.delivery.status.other": "Other",
  "choice.requested_resolution.refund": "Refund of my money",
  "choice.requested_resolution.delivery": "Delivery of the goods",
  "choice.requested_resolution.other": "Something else",
  "choice.arbitration_agreement.yes": "Yes",
  "choice.arbitration_agreement.no": "No",
  "choice.arbitration_agreement.unsure": "Not sure",

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
  "review.error": "We couldn't create the report. Please try again.",
  "review.disclaimer":
    "This report has been prepared from information provided by the reporting party and supporting materials made available to MANYA. It is a dispute preparation document, not a legal determination, certified statement or finding of liability.",

  "evidence.title": "Supporting evidence",
  "evidence.body":
    "Upload receipts, Mobile Money messages, invoices or WhatsApp screenshots. Your originals are kept unchanged.",
  "evidence.upload": "Upload a document",
  "evidence.uploading": "Uploading and reading your document…",
  "evidence.types": "PDF, JPG or PNG, up to 5 MB.",
  "evidence.empty": "No documents yet.",
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

  "pathway.negotiation.title": "Talk to the supplier directly",
  "pathway.mediation.title": "Mediation",
  "pathway.arbitration.title": "Arbitration",
  "pathway.small_claims.title": "Small Claims Procedure",
  "pathway.legal_referral.title": "Get legal advice",

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
