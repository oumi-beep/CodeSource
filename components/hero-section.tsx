"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function HeroSection() {
  const [currentFeature, setCurrentFeature] = useState(0)
  const features = [
    "Trouvez le stage idéal",
    "Découvrez votre filière",
    "Développez vos compétences",
    "Explorez les PFE",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [features.length])

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-emerald-50 py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Votre parcours académique et professionnel, simplifié
            </h1>
            <div className="h-16 mb-6">
              <motion.div
                key={currentFeature}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-xl md:text-2xl font-medium text-emerald-600"
              >
                {features[currentFeature]}
              </motion.div>
            </div>
            <p className="text-slate-600 mb-8 text-lg">
              Une plateforme intelligente pour les étudiants de l'ENSA Khouribga, conçue pour vous guider dans vos choix
              académiques et professionnels.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/inscription" className="flex items-center gap-2">
                  Commencer <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">En savoir plus</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-video bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-xl"></div>
              <div className="p-8 flex flex-col h-full justify-center">
                <div className="space-y-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          i === 0
                            ? "bg-emerald-100 text-emerald-600"
                            : i === 1
                              ? "bg-blue-100 text-blue-600"
                              : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            i === 0 ? "bg-emerald-500" : i === 1 ? "bg-blue-500" : "bg-amber-500"
                          }`}
                          initial={{ width: "0%" }}
                          animate={{ width: `${i === currentFeature ? 100 : Math.random() * 60 + 20}%` }}
                          transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-sm text-slate-500 mb-2">Recommandation personnalisée</div>
                  <div className="text-slate-800 font-medium">
                    {currentFeature === 0 && "Stage en développement web chez Maroc Telecom"}
                    {currentFeature === 1 && "Filière recommandée: Génie Informatique"}
                    {currentFeature === 2 && "Compétence à développer: Intelligence Artificielle"}
                    {currentFeature === 3 && "PFE similaire: Système de recommandation pour étudiants"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-emerald-500/10 rounded-full filter blur-3xl"></div>
    </div>
  )
}
