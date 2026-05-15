import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="font-display text-xl text-[#1A1A18]">ColdCSV</span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-[#5A5A54] hover:text-[#1A1A18] transition"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-[#1A1A18] text-white px-4 py-2 rounded-pill hover:bg-[#2A2A26] transition"
          >
            Start free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <p className="text-sm text-[#2A6B4A] font-medium mb-4 tracking-wide uppercase">
          Cold outreach, reinvented
        </p>
        <h1 className="font-display text-5xl md:text-6xl text-[#1A1A18] leading-tight mb-6">
          Personalized cold emails.
          <br />
          <em>At scale.</em>
        </h1>
        <p className="text-lg text-[#5A5A54] max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload a CSV of prospects. Get back a CSV with an AI-written,
          hyper-personalized opening line for every single row. Turn a full day
          of research into 10 minutes.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/signup"
            className="bg-[#2A6B4A] text-white px-7 py-3 rounded-pill text-sm font-medium hover:bg-[#235c3f] transition"
          >
            Get started — it&apos;s free
          </Link>
          <span className="text-sm text-[#9A9A94]">
            10 free credits. No card required.
          </span>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl text-center text-[#1A1A18] mb-16">
          Three steps to better reply rates
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Upload your CSV",
              desc: "Drop in any prospect list. We detect first name, company, role, LinkedIn, and custom context columns automatically.",
            },
            {
              step: "02",
              title: "AI writes each line",
              desc: "Claude reads every row and crafts a genuine, specific opening line — not a template. Each one is unique.",
            },
            {
              step: "03",
              title: "Download and send",
              desc: "Your original CSV comes back with a new column: coldcsv_opening_line. Paste into your sequencer and go.",
            },
          ].map(({ step, title, desc }) => (
            <div
              key={step}
              className="bg-white border border-[#E8E8E2] rounded-2xl p-7"
            >
              <span className="text-[#9A9A94] text-sm font-mono">{step}</span>
              <h3 className="font-display text-xl text-[#1A1A18] mt-2 mb-3">
                {title}
              </h3>
              <p className="text-[#5A5A54] text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl text-center text-[#1A1A18] mb-4">
          Simple pricing
        </h2>
        <p className="text-center text-[#5A5A54] mb-14">
          Start free. Upgrade when you need more volume.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Free",
              price: "$0",
              credits: "10 credits",
              note: "Lifetime, no reset",
              cta: "Get started",
              href: "/signup",
              accent: false,
            },
            {
              name: "Pro",
              price: "$29",
              credits: "500 credits/mo",
              note: "Resets monthly",
              cta: "Start Pro",
              href: "/signup",
              accent: true,
            },
            {
              name: "Scale",
              price: "$79",
              credits: "2,000 credits/mo",
              note: "Resets monthly",
              cta: "Start Scale",
              href: "/signup",
              accent: false,
            },
          ].map(({ name, price, credits, note, cta, href, accent }) => (
            <div
              key={name}
              className={`bg-white border rounded-2xl p-7 flex flex-col ${
                accent
                  ? "border-[#2A6B4A] ring-1 ring-[#2A6B4A]/20"
                  : "border-[#E8E8E2]"
              }`}
            >
              {accent && (
                <span className="text-xs font-medium text-[#2A6B4A] bg-[#2A6B4A]/10 px-2.5 py-1 rounded-full w-fit mb-4">
                  Most popular
                </span>
              )}
              <p className="text-[#5A5A54] text-sm">{name}</p>
              <p className="font-display text-4xl text-[#1A1A18] mt-1">
                {price}
                {price !== "$0" && (
                  <span className="text-base text-[#9A9A94] font-sans">/mo</span>
                )}
              </p>
              <p className="text-[#1A1A18] font-medium text-sm mt-4">{credits}</p>
              <p className="text-[#9A9A94] text-xs mt-0.5">{note}</p>
              <Link
                href={href}
                className={`mt-8 text-center py-2.5 rounded-pill text-sm font-medium transition ${
                  accent
                    ? "bg-[#2A6B4A] text-white hover:bg-[#235c3f]"
                    : "bg-[#1A1A18] text-white hover:bg-[#2A2A26]"
                }`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8E8E2] py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-[#9A9A94]">
          <span className="font-display text-[#1A1A18]">ColdCSV</span>
          <span>© 2026 ColdCSV. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
