import Link from "next/link"
import { ArrowRight, BookOpen, BrainCircuit, MessageSquareText, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import HeroSection from "@/components/hero-section"
import FeatureCard from "@/components/feature-card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

import { LoginForm } from "@/components/login"



export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navbar />

      <main>
        <HeroSection />

        <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Nos Services</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Découvrez nos outils intelligents conçus pour vous accompagner tout au long de votre parcours académique
              et professionnel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Search className="h-8 w-8 text-emerald-500" />}
              title="Recherche de Stages"
              description="Trouvez des offres de stage adaptées à votre profil et vos compétences grâce à notre système de recommandation intelligent."
              href="/stages"
              color="emerald"
            />

            <FeatureCard
              icon={<BrainCircuit className="h-8 w-8 text-blue-500" />}
              title="Prédiction de Filière"
              description="Découvrez quelle spécialité correspond le mieux à vos performances académiques et centres d'intérêt."
              href="/prediction"
              color="blue"
            />

            <FeatureCard
              icon={<MessageSquareText className="h-8 w-8 text-violet-500" />}
              title="Chatbot Compétences"
              description="Consultez notre assistant intelligent pour découvrir les compétences clés requises pour votre métier cible."
              href="/chatbot"
              color="violet"
            />

            <FeatureCard
              icon={<BookOpen className="h-8 w-8 text-amber-500" />}
              title="Bibliothèque PFE"
              description="Accédez aux projets de fin d'études des anciens étudiants pour vous inspirer et explorer des sujets pertinents."
              href="/pfe"
              color="amber"
            />
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Prêt à commencer votre parcours ?</h2>
            <p className="max-w-2xl mx-auto mb-8">
              Rejoignez notre plateforme et bénéficiez d'un accompagnement personnalisé pour votre orientation
              académique et professionnelle.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/inscription" className="flex items-center gap-2">
                S'inscrire maintenant <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">À propos de notre plateforme</h2>
              <p className="text-slate-600 mb-6">
                Notre plateforme a été développée pour répondre aux besoins spécifiques des étudiants de l'ENSA
                Khouribga. Grâce à l'intelligence artificielle et aux modèles de langage avancés, nous offrons des
                solutions innovantes pour faciliter votre parcours académique et professionnel.
              </p>
              <Button variant="outline" asChild>
                <Link href="/about">En savoir plus</Link>
              </Button>
            </div>
            <div className="bg-slate-100 p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Témoignages</h3>
              <blockquote className="border-l-4 border-emerald-500 pl-4 italic text-slate-600 mb-6">
                "Grâce à cette plateforme, j'ai trouvé un stage parfaitement adapté à mes compétences et à mes
                aspirations professionnelles."
                <footer className="text-sm font-medium text-slate-800 mt-2">— Fatima, étudiante en 4ème année</footer>
              </blockquote>
              <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-600">
                "Le système de prédiction de filière m'a aidé à faire un choix éclairé pour ma spécialisation. Je suis
                très satisfait de mon parcours."
                <footer className="text-sm font-medium text-slate-800 mt-2">— Ahmed, étudiant en 3ème année</footer>
              </blockquote>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
