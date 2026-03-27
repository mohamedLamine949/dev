import Link from "next/link";

const stats = [
  { value: "2 400+", label: "Offres publiées" },
  { value: "15 000+", label: "Candidats inscrits" },
  { value: "350+", label: "Entreprises partenaires" },
];

const features = [
  {
    icon: "⚡",
    title: "Candidature en un clic",
    desc: "Votre coffre-fort de documents rend chaque candidature instantanée. Postulez en quelques secondes.",
  },
  {
    icon: "🔐",
    title: "Coffre-fort de documents",
    desc: "Déposez CV, diplômes, acte de naissance une seule fois. Réutilisez à chaque candidature.",
  },
  {
    icon: "🌍",
    title: "Mali & Diaspora",
    desc: "Offres ouvertes aux talents partout dans le monde. La diaspora malienne peut postuler depuis l'étranger.",
  },
  {
    icon: "✅",
    title: "Employeurs vérifiés",
    desc: "Les entreprises sont validées par NIF et RCCM. Plus de fausses offres, plus de risques.",
  },
];

const steps = [
  { n: "01", title: "Créez votre profil", desc: "Inscrivez-vous en 2 minutes. Déposez vos documents dans votre coffre-fort sécurisé." },
  { n: "02", title: "Explorez les offres", desc: "Filtrez par région, secteur, type de contrat. Des offres vérifiées, mises à jour quotidiennement." },
  { n: "03", title: "Postulez instantanément", desc: "Sélectionnez vos documents depuis votre coffre-fort. Votre dossier est prêt en un clic." },
];

// Partners — using text logos (no image dependencies)
const partners = [
  // Ministères
  { name: "Min. Éducation", type: "gov" },
  { name: "Min. Santé", type: "gov" },
  { name: "Min. Économie", type: "gov" },
  { name: "Min. Mines", type: "gov" },
  { name: "Min. Travail", type: "gov" },
  { name: "Min. Commerce", type: "gov" },
  // Banques
  { name: "BDM·SA", type: "bank" },
  { name: "BNDA", type: "bank" },
  { name: "Orabank Mali", type: "bank" },
  { name: "Coris Bank", type: "bank" },
  { name: "UBA Mali", type: "bank" },
  { name: "BMS·SA", type: "bank" },
  // Entreprises
  { name: "Orange Mali", type: "corp" },
  { name: "Sotelma", type: "corp" },
  { name: "EDM·SA", type: "corp" },
  { name: "Total Energies", type: "corp" },
  { name: "CMDT", type: "corp" },
  { name: "Groupe Mory", type: "corp" },
];

const testimonials = [
  {
    quote: "Grâce à MaliEmploi, j'ai trouvé mon poste de comptable en seulement 3 semaines. Le coffre-fort de documents m'a vraiment simplifié la vie.",
    name: "Aïssata Coulibaly",
    role: "Comptable — BDM·SA",
    city: "Bamako",
    initial: "A",
  },
  {
    quote: "Nous utilisons MaliEmploi pour tous nos recrutements depuis 6 mois. La qualité des profils et la rapidité du processus sont incomparables.",
    name: "Moussa Diallo",
    role: "DRH — Groupe Mory",
    city: "Bamako",
    initial: "M",
  },
  {
    quote: "Depuis Paris, j'ai postulé sur des offres au Mali et j'ai décroché un poste. La fonctionnalité diaspora est une révolution.",
    name: "Fatoumata Traoré",
    role: "Ingénieure IT",
    city: "Paris → Bamako",
    initial: "F",
  },
  {
    quote: "Interface claire, employeurs vérifiés, processus transparent. C'est exactement ce dont le marché de l'emploi malien avait besoin.",
    name: "Ibrahim Koné",
    role: "Chef de projet — EDM·SA",
    city: "Ségou",
    initial: "I",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">

      {/* Mali tri-color top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-[3px]">
        <div className="flex-1 bg-[#14B53A]" />
        <div className="flex-1 bg-[#FCD116]" />
        <div className="flex-1 bg-[#CE1126]" />
      </div>

      {/* Nav */}
      <nav className="fixed top-[3px] left-0 right-0 z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold tracking-tight text-lg">MaliEmploi</span>
            <span className="text-[11px] text-[#FCD116]/80 font-medium border border-[#FCD116]/30 rounded px-1.5 py-0.5 leading-none">🇲🇱</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors duration-150">
              Connexion
            </Link>
            <Link href="/register" className="text-sm bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-150">
              Commencer →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20 pb-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(20,181,58,0.07) 0%, transparent 70%)' }}
        />
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 100%, rgba(0,0,0,0.8) 0%, transparent 60%)' }}
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-8 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm text-gray-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14B53A] animate-pulse" />
            Plateforme nationale de l&apos;emploi — Mali
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-[-0.03em] leading-[1.05] mb-6 text-white">
            L&apos;emploi au Mali,{" "}
            <span className="inline bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #ffffff 0%, #6b6b6b 100%)' }}>
              repensé.
            </span>
          </h1>

          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            MaliEmploi connecte les talents maliens — et la diaspora — aux meilleures
            opportunités. Un coffre-fort de documents, des employeurs vérifiés,
            un processus de candidature simplifié.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/jobs"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black font-semibold px-7 py-3 text-sm hover:bg-gray-100 transition-all duration-150 shadow-lg shadow-white/10">
              Parcourir les offres <span>→</span>
            </Link>
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] text-white font-semibold px-7 py-3 text-sm hover:bg-white/[0.08] hover:border-white/20 transition-all duration-150">
              Créer un compte gratuitement
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 text-xs text-gray-600">
          {["Bamako", "Kayes", "Mopti", "Gao", "Sikasso", "Diaspora"].map((city, i) => (
            <span key={city} className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-[#14B53A]' : 'bg-gray-700'}`} />
              {city}
            </span>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-t border-white/[0.06] py-16">
        <div className="mx-auto max-w-4xl px-6 grid grid-cols-3 gap-8 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="text-4xl font-bold text-white tracking-tight">{s.value}</p>
              <p className="mt-1 text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARTNERS MARQUEE ── */}
      <section className="border-t border-white/[0.06] py-16 overflow-hidden">
        <div className="mx-auto max-w-5xl px-6 mb-8 text-center">
          <p className="text-xs uppercase tracking-widest text-gray-600">Ils nous font confiance</p>
        </div>

        {/* Marquee row 1 */}
        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10"
            style={{ background: 'linear-gradient(to right, #0a0a0a, transparent)' }} />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10"
            style={{ background: 'linear-gradient(to left, #0a0a0a, transparent)' }} />
          <div className="flex gap-4 animate-marquee whitespace-nowrap">
            {[...partners, ...partners].map((p, i) => (
              <div key={i}
                className="inline-flex items-center gap-2 shrink-0 rounded-xl border border-white/[0.07] bg-white/[0.03] px-5 py-3 text-sm font-medium text-gray-400 hover:border-white/20 hover:text-white transition-all cursor-default">
                <span className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${p.type === 'gov' ? 'bg-[#14B53A]/20 text-[#14B53A]' : p.type === 'bank' ? 'bg-[#FCD116]/20 text-[#FCD116]' : 'bg-white/10 text-gray-400'}`}>
                  {p.type === 'gov' ? 'GOV' : p.type === 'bank' ? 'BANK' : 'CORP'}
                </span>
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <p className="text-xs uppercase tracking-widest text-gray-600 mb-3">Processus</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Postulez en 3 étapes</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map(s => (
              <div key={s.n} className="relative">
                <div className="text-6xl font-black text-white/[0.04] mb-4 leading-none">{s.n}</div>
                <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <p className="text-xs uppercase tracking-widest text-gray-600 mb-3">Fonctionnalités</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Tout ce dont vous avez besoin</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
            {features.map((f, i) => (
              <div key={i} className="bg-[#0a0a0a] p-8 hover:bg-white/[0.02] transition-colors duration-200">
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="text-xs uppercase tracking-widest text-gray-600 mb-3">Témoignages</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Ce que disent nos utilisateurs</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {testimonials.map((t, i) => (
              <div key={i}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-200">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-3.5 h-3.5 text-[#FCD116]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <div className="mb-2 flex justify-center gap-1">
            <span className="h-0.5 w-8 bg-[#14B53A] rounded-full" />
            <span className="h-0.5 w-8 bg-[#FCD116] rounded-full" />
            <span className="h-0.5 w-8 bg-[#CE1126] rounded-full" />
          </div>
          <h2 className="mt-10 text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-gray-500 mb-8">
            Rejoignez des milliers de candidats et recruteurs qui font confiance à MaliEmploi. Gratuit, rapide, sécurisé.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/register"
              className="rounded-lg bg-white text-black font-semibold px-6 py-3 text-sm hover:bg-gray-100 transition-colors">
              Créer un compte →
            </Link>
            <Link href="/jobs"
              className="rounded-lg border border-white/10 text-white font-semibold px-6 py-3 text-sm hover:bg-white/[0.05] transition-colors">
              Voir les offres
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">MaliEmploi</span>
            <span className="text-gray-600 text-xs">🇲🇱 Plateforme nationale de l&apos;emploi</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <Link href="/jobs" className="hover:text-gray-400 transition-colors">Offres</Link>
            <Link href="/register" className="hover:text-gray-400 transition-colors">Inscription</Link>
            <Link href="/login" className="hover:text-gray-400 transition-colors">Connexion</Link>
          </div>
          <p className="text-xs text-gray-700">© 2026 MaliEmploi. Fait au Mali 🇲🇱</p>
        </div>
      </footer>

    </div>
  );
}
