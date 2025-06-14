"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Settings, Star, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ------------------------------------------------------------------ */
/*  Types                                                            */
/* ------------------------------------------------------------------ */

interface UserPreferences {
  locations: string[];
  domains: string[];
}

/* ------------------------------------------------------------------ */
/*  Helper d'appel API                                               */
/* ------------------------------------------------------------------ */

const fetchWithAuth = async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Token d'authentification manquant");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Erreur HTTP ${res.status}`);
  }
  return (await res.json()) as T;
};

/* ------------------------------------------------------------------ */
/*  Composant principal                                               */
/* ------------------------------------------------------------------ */

export default function StageHeroSection() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasUploadedCV, setHasUploadedCV] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    locations: [],
    domains: [],
  });

  /* ---------------------------- Effet initial ----------------------------- */
  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    setUserEmail(email);

    if (!email) return;

    /* ----------------------- Récupération des données ----------------------- */
    const checkExistingCV = async () => {
      try {
        const data = await fetchWithAuth<{ cv?: string }>(
          "http://127.0.0.1:8000/get_saved_analysis"
        );
        if (data?.cv) {
          setHasUploadedCV(true);
          setCurrentFile(data.cv);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du CV :", err);
      }
    };

    const checkRecommendations = async () => {
      try {
        const data = await fetchWithAuth<{ hasRecommendations?: boolean }>(
          "http://127.0.0.1:8000/recommendations"
        );
        setHasRecommendations(data?.hasRecommendations ?? false);
      } catch (err) {
        console.error("Erreur lors de la récupération des recommandations :", err);
      }
    };

    const fetchPreferences = async () => {
      try {
        const data = await fetchWithAuth<UserPreferences & Record<string, unknown>>(
          "http://127.0.0.1:8000/preferences"
        );
        setUserPreferences({
          locations: data?.locations ?? [],
          domains: data?.domains ?? [],
        });
      } catch (err) {
        console.error("Erreur lors de la récupération des préférences :", err);
      }
    };

    /* Lancement des appels en parallèle */
    checkExistingCV();
    checkRecommendations();
    fetchPreferences();
  }, []);

  /* ---------------------------- Handlers route ----------------------------- */
  const handleExploreStages = () => router.push("/stages");
  const handleUploadCV = () => router.push("/cv-upload");
  const handleViewRecommendations = () => router.push("/recommendations");
  const handleEditPreferences = () => router.push("/preferences");

  /* -------------------------------- Render --------------------------------- */
  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* ---------------------------------------------------------------- */}
          {/*  Colonne gauche : texte introductif                              */}
          {/* ---------------------------------------------------------------- */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 leading-tight">
              Trouvez le <span className="text-emerald-600">stage idéal</span> pour votre carrière
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Notre plateforme utilise l'intelligence artificielle pour analyser votre CV et vous recommander les stages
              qui correspondent le mieux à votre profil, vos compétences et vos aspirations.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={handleExploreStages} className="flex items-center gap-2">
                Explorer les stages <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">En savoir plus</Link>
              </Button>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/*  Colonne droite : étapes                                         */}
          {/* ---------------------------------------------------------------- */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800">Comment ça marche&nbsp;?</h2>
              <p className="text-slate-600 mt-1">
                Notre système intelligent analyse votre CV et vous propose les stages les plus adaptés
              </p>
            </div>

            <div className="space-y-6">
              {/* Étape 1 : CV */}
              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 text-sm font-medium">1</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-800">Téléchargez votre CV</h3>
                  <p className="text-sm text-slate-600">
                    Importez votre CV au format PDF pour que notre système puisse l'analyser.
                  </p>
                  <div className="flex items-center mt-2">
                    <Button size="sm" variant="outline" className="mr-2" onClick={handleUploadCV}>
                      {hasUploadedCV ? "Mettre à jour mon CV" : "Télécharger mon CV"}
                    </Button>
                    {hasUploadedCV && (
                      <Badge variant="outline" className="flex items-center">
                        <Check className="h-3 w-3 mr-1 text-green-500" />
                        CV téléchargé
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Étape 2 : Préférences */}
              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
                  <span className="text-violet-600 text-sm font-medium">2</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-800">Vos préférences</h3>
                  <p className="text-sm text-slate-600">
                    Personnalisez vos préférences pour affiner les recommandations de stages.
                  </p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={handleEditPreferences}>
                    <Settings className="h-3 w-3 mr-1" />
                    Modifier mes préférences
                  </Button>
                </div>
              </div>

              {/* Étape 3 : Recommandations */}
              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">3</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-800">Recommandations personnalisées</h3>
                  <p className="text-sm text-slate-600">
                    Notre système analyse votre CV et vos préférences pour vous proposer les stages les plus adaptés.
                  </p>
                  <div className="mt-2">
                    {hasRecommendations ? (
                      <div className="flex items-center">
                        
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          <Check className="h-3 w-3 mr-1" />
                          Disponibles
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Button size="sm" disabled className="mr-2">
                          <Star className="h-3 w-3 mr-1" />
                          Recommandations
                        </Button>
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          En attente
                        </Badge>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {hasRecommendations
                        ? "Vos recommandations sont prêtes ! Consultez-les maintenant."
                        : "Téléchargez votre CV et définissez vos préférences pour obtenir des recommandations."}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
