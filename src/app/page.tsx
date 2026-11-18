import {
  ArrowRight,
  BookOpenCheck,
  FileSearch,
  Languages,
  ListChecks,
  MapPin,
  ShieldCheck,
  Store,
} from "lucide-react";
import Link from "next/link";

const PROBLEMS = [
  {
    icon: FileSearch,
    title: "Hard to find",
    body: "The rules a trader must follow are spread across Acts, statutory instruments and authority notices.",
  },
  {
    icon: Languages,
    title: "Hard to understand",
    body: "Even when you find the law, it is written for lawyers, not for someone running a shop in Kikuubo.",
  },
  {
    icon: ListChecks,
    title: "Hard to apply",
    body: "Knowing what a section says is not the same as knowing what to do about your own business tomorrow.",
  },
];

const STEPS = [
  {
    icon: Store,
    title: "Tell us about your business",
    body: "Five quick questions: what you sell, where, and what you have registered. Nothing is stored on our servers.",
  },
  {
    icon: BookOpenCheck,
    title: "Ask in your own words",
    body: "We search a curated library of Ugandan law and official guidance, and only answer from what we find.",
  },
  {
    icon: ShieldCheck,
    title: "Get answers you can check",
    body: "What the law says, what it means for you, what to do next, and the exact source behind every point.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="bg-grain text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-300/30 bg-white/5 px-3 py-1 text-xs font-medium text-gold-200">
              <MapPin className="size-3.5" aria-hidden /> Built for small traders in Uganda
            </p>
            <h1 className="mt-6 font-display text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Understand the law that runs <span className="text-gold-300">your business</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-brand-100/90">
              Manya Legal turns Ugandan business law into plain answers for your shop: what the law
              requires, what it means for you, and what to do next. Every answer shows its official
              source.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/onboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-3.5 font-semibold text-brand-950 shadow-lg shadow-gold-500/20 transition hover:bg-gold-300"
              >
                Set up my business <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/ask?demo=1"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                Try the Kikuubo trader demo
              </Link>
            </div>
          </div>

          <div className="animate-rise rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur [animation-delay:120ms] sm:p-6">
            <p className="text-sm text-brand-100/80">A trader in Kikuubo asks</p>
            <p className="mt-2 rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-ink">
              My trading licence is expiring. What should I do?
            </p>
            <div className="mt-4 rounded-2xl rounded-tr-sm border border-white/10 bg-brand-950/60 p-4 text-sm leading-6">
              <p className="font-semibold text-gold-200">Direct answer</p>
              <p className="mt-1 text-brand-50">
                Renew it before it lapses. A trading licence is valid for 12 months from the date it
                was issued, and you must renew straight away when it ends.
              </p>
              <p className="mt-3 font-semibold text-gold-200">What to bring to KCCA</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-brand-50">
                <li>Last year&apos;s original licence and KCCA receipt</li>
                <li>Your National ID and TIN</li>
              </ul>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-400/15 px-2.5 py-1 text-xs text-gold-200">
                <BookOpenCheck className="size-3.5" aria-hidden /> URA, Formalising a Business
                (2024-25), Step 3
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-brand-900">
          Traders are expected to follow laws they were never shown.
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PROBLEMS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-600">
            The difference
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-900">
            Same law, made usable.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <figure className="rounded-2xl border border-line bg-paper p-6">
              <figcaption className="text-xs font-semibold uppercase tracking-wider text-muted">
                The law as written: Trade (Licensing) Act, s.8(1)
              </figcaption>
              <blockquote className="mt-3 font-display text-lg leading-8 text-ink/80 italic">
                “Subject to subsection (2), no person shall trade in any goods or carry on any
                business specified in the Schedule to this Act unless he or she is in possession of
                a trading licence granted to him or her for that purpose under this Act.”
              </blockquote>
            </figure>
            <figure className="rounded-2xl border border-brand-200 bg-brand-50 p-6">
              <figcaption className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                What Manya Legal tells a Kikuubo retailer
              </figcaption>
              <p className="mt-3 text-lg leading-8 text-brand-950">
                You need a trading licence for your shop before you sell. In Kampala you get it from
                KCCA, and it is for your specific premises. Some sellers, such as farmers selling
                their own produce or traders inside a market established under the Markets Act, are
                exempt, but a general retail shop is not.
              </p>
            </figure>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-brand-900">
          How it works
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li
              key={title}
              className="relative rounded-2xl border border-line bg-white p-6 shadow-sm"
            >
              <span className="absolute top-6 right-6 font-display text-3xl font-semibold text-brand-100">
                {i + 1}
              </span>
              <span className="grid size-10 place-items-center rounded-xl bg-gold-100 text-gold-700">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-6 rounded-3xl bg-brand-900 p-6 text-brand-50 sm:p-10 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h3 className="font-display text-2xl font-semibold text-white">Our promise</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6">
              <li>We only answer from official Ugandan sources, and we show you each one.</li>
              <li>We never make up a law, a section, a fee or a fine.</li>
              <li>
                When our sources don&apos;t cover your question, we say so and point you to help.
              </li>
              <li>
                We are not your lawyer. For disputes and court matters, we refer you to legal aid.
              </li>
            </ul>
          </div>
          <Link
            href="/onboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-3.5 font-semibold text-brand-950 transition hover:bg-gold-300"
          >
            Get started <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}
