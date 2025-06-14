import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import StageHeroSection from "@/components/stage-hero-section"
import StageExplorer from "@/components/stage-explorer"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function StagePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navbar />

      <main>
        <StageHeroSection />

        <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Stages populaires</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Notre système de recommandation vous propose des offres de stage adaptées à votre profil et vos compétences. 
              Plus votre profil est complet, plus les recommandations seront pertinentes.
            </p>
          </div>

          <StageExplorer />
        </section>

        

        <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Pourquoi utiliser notre plateforme ?</h2>
              <p className="text-slate-600 mb-6">
                Notre plateforme utilise des algorithmes avancés d'intelligence artificielle pour analyser votre CV et
                vous proposer les stages qui correspondent le mieux à votre profil, vos compétences et vos aspirations
                professionnelles.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center mt-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                  </div>
                  <span className="ml-3 text-slate-600">
                    Recommandations personnalisées basées sur votre profil et vos compétences
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center mt-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                  </div>
                  <span className="ml-3 text-slate-600">
                    Accès à des offres exclusives de nos entreprises partenaires
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center mt-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                  </div>
                  <span className="ml-3 text-slate-600">Suivi de vos candidatures et notifications en temps réel</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center mt-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                  </div>
                  <span className="ml-3 text-slate-600">
                    Conseils personnalisés pour améliorer votre CV et vos chances de décrocher un stage
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Statistiques</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-2">500+</div>
                  <div className="text-sm text-slate-600">Offres de stage</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">200+</div>
                  <div className="text-sm text-slate-600">Entreprises partenaires</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-violet-600 mb-2">85%</div>
                  <div className="text-sm text-slate-600">Taux de satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-600 mb-2">1000+</div>
                  <div className="text-sm text-slate-600">Étudiants accompagnés</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
