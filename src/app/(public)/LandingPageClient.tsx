"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, Play, Star, BookOpen, Brain, LineChart, Shield, HelpCircle, ChevronRight } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

export const FAQ_ITEMS = [
  { q: "À partir de quel âge ?", a: "NourAl est conçu pour les enfants de 4 à 12 ans. L'interface est très visuelle, ne nécessitant pas de savoir lire parfaitement le français au début." },
  { q: "Faut-il des connaissances préalables en arabe ?", a: "Pas du tout ! L'application reprend les bases depuis zéro avec l'alphabet, étape par étape." },
  { q: "Comment fonctionne l'abonnement ?", a: "Il coûte 2€ par mois et par profil enfant. Vous pouvez annuler d'un simple clic depuis votre espace parent." },
  { q: "Mes données sont-elles sécurisées ?", a: "Oui, nous respectons strictement le RGPD. Aucune publicité, aucune revente de données. Les enfants n'ont pas besoin d'adresse email." },
  { q: "Puis-je résilier à tout moment ?", a: "Oui, c'est sans engagement. L'abonnement s'arrêtera à la fin du mois en cours après résiliation." }
]

export default function LandingPageClient() {
  return (
    <>
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#0a192f]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-[#0a192f] to-[#0a192f] opacity-80"></div>

        {/* Étoiles décoratives CSS */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-yellow-200 rounded-full animate-pulse delay-75"></div>
        <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-blue-200 rounded-full animate-pulse delay-150"></div>

        {/* Lune SVG */}
        <svg className="absolute top-20 right-10 w-24 h-24 text-accent opacity-80 animate-[spin_60s_linear_infinite]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="inline-block mb-6 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
            <p className="text-white text-sm font-medium flex items-center gap-2">
              <span className="text-accent">⭐</span> Déjà +500 familles françaises inscrites
            </p>
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Ton enfant apprend l'arabe <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-200">en s'amusant 🌙</span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            L'application simple et ludique pour les familles musulmanes de France.
            Alphabet, mots, sourates — à partir de 4 ans.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inscription" className="px-8 py-4 bg-accent text-white rounded-2xl font-bold text-lg hover:bg-accent/90 transition shadow-xl hover:-translate-y-1 transform">
              Essayer gratuitement
            </Link>
            <Link href="#demo" className="px-8 py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition backdrop-blur-sm flex items-center justify-center gap-2">
              <Play fill="currentColor" size={20} /> Voir comment ça marche
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. PROBLÈME / SOLUTION */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-3xl lg:text-4xl font-bold text-primary mb-12">
            Vous voulez que votre enfant apprenne l'arabe, mais...
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              { icon: '💸', title: 'Trop cher', text: 'Les cours particuliers sont hors de prix.' },
              { icon: '🇬🇧', title: 'Pas adapté', text: 'Les apps sont souvent en anglais.' },
              { icon: '🥱', title: 'Trop scolaire', text: 'L\'enfant se démotive très vite.' }
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: i * 0.1 } } }} className="bg-red-50 p-6 rounded-3xl border border-red-100">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-xl text-primary mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
            <h3 className="text-2xl font-bold text-primary mb-4">NourAl a été pensé pour vous. ✨</h3>
            <p className="text-lg text-gray-600">Une méthode douce, amusante, entièrement en français, et accessible à toutes les familles.</p>
          </motion.div>
        </div>
      </section>

      {/* 3. FONCTIONNALITÉS */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Tout ce qu'il faut pour réussir</h2>
            <p className="text-xl text-gray-500">Conçu par des éducateurs, validé par les enfants.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-6">
                <BookOpen size={32} />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">Alphabet illustré</h3>
              <p className="text-gray-600">28 lettres de l'alphabet avec des dessins mémorisables, des sons natifs et des exemples simples.</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-16 h-16 bg-kids/10 rounded-2xl flex items-center justify-center text-kids mb-6">
                <Brain size={32} />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">QCM ludiques</h3>
              <p className="text-gray-600">Des quiz amusants qui s'adaptent au niveau de votre enfant pour une révision sans frustration.</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center text-success mb-6">
                <LineChart size={32} />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">Suivi parental</h3>
              <p className="text-gray-600">Un tableau de bord complet pour suivre les progrès, le temps passé et les mots maîtrisés.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. DÉMO INTERACTIVE */}
      <section id="demo" className="py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-4xl font-bold text-primary mb-12">Découvrez l'interface enfant</motion.h2>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-3xl mx-auto bg-blue-50 rounded-[3rem] p-8 md:p-12 border-8 border-gray-100 shadow-2xl relative">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-2 bg-gray-200 rounded-full"></div>
            <div className="bg-white rounded-3xl p-8 shadow-inner mt-4 flex flex-col items-center">
              <div className="bg-accent/10 w-48 h-48 rounded-full flex flex-col items-center justify-center mb-8 shadow-inner">
                <div className="text-[8rem] font-arabic text-accent leading-none">ب</div>
              </div>
              <p className="text-4xl font-bold text-primary mb-8">Baa</p>
              <button className="px-8 py-4 bg-accent text-white font-bold rounded-2xl text-xl hover:bg-accent/90 shadow-md w-full md:w-auto">
                Écouter le son
              </button>
            </div>
          </motion.div>

          <Link href="/apprendre" className="inline-flex items-center gap-2 mt-12 text-accent font-bold text-xl hover:underline">
            Voir tout le contenu gratuit <ChevronRight />
          </Link>
        </div>
      </section>

      {/* 5. TARIFS */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Un tarif simple et juste</h2>
            <p className="text-xl text-gray-500">Accessible à tous, sans mauvaises surprises.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan Gratuit */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-primary mb-2">Découverte</h3>
              <p className="text-gray-500 mb-6">Pour commencer en douceur</p>
              <div className="text-5xl font-bold text-primary mb-8">0€ <span className="text-lg text-gray-400 font-medium">/ toujours</span></div>
              <ul className="space-y-4 mb-10">
                <li className="flex gap-3 text-gray-600"><CheckCircle2 className="text-success shrink-0" /> 5 premières lettres</li>
                <li className="flex gap-3 text-gray-600"><CheckCircle2 className="text-success shrink-0" /> 3 mini-jeux basiques</li>
                <li className="flex gap-3 text-gray-600"><CheckCircle2 className="text-success shrink-0" /> 1 profil enfant</li>
                <li className="flex gap-3 text-gray-600"><CheckCircle2 className="text-success shrink-0" /> Sans carte bancaire</li>
              </ul>
              <Link href="/inscription" className="block w-full py-4 text-center bg-gray-100 text-primary font-bold rounded-2xl hover:bg-gray-200 transition">
                Créer un compte
              </Link>
            </motion.div>

            {/* Plan Premium */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-primary p-10 rounded-[2.5rem] shadow-2xl relative transform md:-translate-y-4">
              <div className="absolute top-0 right-10 transform -translate-y-1/2 bg-accent text-white px-4 py-1 rounded-full font-bold text-sm shadow-md">Recommandé</div>
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <p className="text-blue-200 mb-6">L'expérience complète</p>
              <div className="text-5xl font-bold text-white mb-8">2€ <span className="text-lg text-blue-300 font-medium">/ mois / enfant</span></div>
              <ul className="space-y-4 mb-10">
                <li className="flex gap-3 text-blue-100"><CheckCircle2 className="text-accent shrink-0" /> Alphabet complet</li>
                <li className="flex gap-3 text-blue-100"><CheckCircle2 className="text-accent shrink-0" /> Apprentissage des mots</li>
                <li className="flex gap-3 text-blue-100"><CheckCircle2 className="text-accent shrink-0" /> Petites sourates</li>
                <li className="flex gap-3 text-blue-100"><CheckCircle2 className="text-accent shrink-0" /> Répétition espacée (SM-2)</li>
                <li className="flex gap-3 text-blue-100"><CheckCircle2 className="text-accent shrink-0" /> Suivi parental détaillé</li>
                <li className="flex gap-3 text-blue-100"><CheckCircle2 className="text-accent shrink-0" /> Profils enfants illimités</li>
              </ul>
              <Link href="/inscription" className="block w-full py-4 text-center bg-accent text-white font-bold rounded-2xl hover:bg-accent/90 transition shadow-lg">
                Commencer l'essai gratuit
              </Link>
            </motion.div>
          </div>

          <div className="mt-12 text-center flex flex-col md:flex-row items-center justify-center gap-6 text-gray-500 font-medium">
            <span className="flex items-center gap-2"><Shield size={18} /> Sans engagement</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={18} /> Résiliable en 1 clic</span>
            <span className="flex items-center gap-2"><Shield size={18} /> Paiement sécurisé Stripe</span>
          </div>
        </div>
      </section>

      {/* 6. TÉMOIGNAGES */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-primary mb-16">Ils adorent NourAl</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Sarah", city: "Lyon", text: "Enfin une application en français, jolie et sans pubs ! Mon fils de 5 ans réclame sa leçon tous les soirs." },
              { name: "Karim", city: "Paris", text: "Pour 2€ par mois, c'est le meilleur investissement pour mes filles. Le dashboard parent est super bien fait." },
              { name: "Amina", city: "Marseille", text: "La méthode d'apprentissage est vraiment ludique. Ma fille a mémorisé 15 lettres en deux semaines." }
            ].map((t, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-gray-50 p-8 rounded-3xl">
                <div className="flex text-accent mb-4">
                  {[1, 2, 3, 4, 5].map(star => <Star key={star} fill="currentColor" size={20} />)}
                </div>
                <p className="text-gray-700 mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary text-white flex items-center justify-center rounded-full font-bold">{t.name[0]}</div>
                  <div>
                    <h4 className="font-bold text-primary">{t.name}</h4>
                    <p className="text-sm text-gray-500">{t.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-center gap-4 mb-12">
            <HelpCircle className="text-accent" size={40} />
            <h2 className="text-4xl font-bold text-primary">Questions Fréquentes</h2>
          </div>

          <div className="space-y-6">
            {FAQ_ITEMS.map((faq, i) => (
              <details key={i} className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer">
                <summary className="flex justify-between items-center font-bold text-lg text-primary list-none">
                  {faq.q}
                  <span className="transition group-open:rotate-180">
                    <ChevronRight />
                  </span>
                </summary>
                <p className="text-gray-600 mt-4 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA FINAL */}
      <section className="py-32 bg-[#0a192f] text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent via-[#0a192f] to-[#0a192f]"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-white mb-6">Prêt à commencer l'aventure ?</h2>
          <p className="text-xl text-gray-300 mb-10">Rejoignez des centaines de familles qui apprennent l'arabe en s'amusant.</p>
          <Link href="/inscription" className="inline-block px-10 py-5 bg-accent text-white rounded-2xl font-bold text-xl hover:bg-accent/90 transition shadow-2xl hover:scale-105 transform">
            Commencez gratuitement aujourd'hui
          </Link>
          <p className="text-gray-400 mt-6 text-sm">Aucune carte bancaire requise pour l'essai gratuit.</p>
        </div>
      </section>
    </>
  )
}
