"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRecommendationActions } from "../hooks/useRecommendationActions";
import { useOptimisticRecommendations } from "../hooks/useOptimisticRecommendations";
import { recommendationApi } from "../services/recommendationApi";

interface Recommendation {
  id: number;
  title: string;
  company: string;
  location: string;
  country: string;
  platform: string;
  description: string;
  skills: string;
  domain: string;
  link: string;
  similarity_score: number;
  recommended_at: string;
  is_viewed: boolean;
  is_saved: boolean;
  duration?: string;
}

type RecommendationsApiResponse =
  | Recommendation[]
  | { recommendations: Recommendation[] };

export default function StageExplorer() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"match" | "date" | "company">("match");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use custom hooks for actions and optimistic updates
  const {
    markAsViewed,
    toggleSaved,
    loading: actionLoading,
    errors: actionErrors,
  } = useRecommendationActions({
    onSuccess: (action, listingId) => {
      console.log(`Action ${action} successful for listing ${listingId}`);
      // Confirm optimistic update for the specific field
      if (action === 'viewed') {
        confirmOptimisticUpdate(listingId, 'is_viewed');
      } else if (action === 'saved' || action === 'unsaved') {
        confirmOptimisticUpdate(listingId, 'is_saved');
      }
    },
    onError: (error, action, listingId) => {
      console.error(`Action ${action} failed for listing ${listingId}:`, error);
      // Revert optimistic update for the specific field
      if (action === 'viewed') {
        revertOptimisticUpdate(listingId, 'is_viewed');
      } else if (action === 'saved' || action === 'unsaved') {
        revertOptimisticUpdate(listingId, 'is_saved');
      }
    },
  });

  const {
    applyOptimisticUpdate,
    confirmOptimisticUpdate,
    revertOptimisticUpdate,
  } = useOptimisticRecommendations(recommendations, setRecommendations);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await recommendationApi.makeRequest<RecommendationsApiResponse>(
          "/recommendations"
        );

        if (Array.isArray(data)) {
          setRecommendations(data);
        } else if (Array.isArray(data.recommendations)) {
          setRecommendations(data.recommendations);
        } else {
          console.error("Réponse inattendue :", data);
          setRecommendations([]);
        }
      } catch (err: any) {
        console.error("Erreur lors du fetch :", err);
        setError(err.message ?? "Échec de la récupération des recommandations");
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  function togglePlatform(platform: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }

  function toggleStatus(status: string) {
    setSelectedStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }

  // Enhanced mark as viewed handler
  const handleMarkAsViewed = useCallback(async (id: number) => {
    const recommendation = recommendations.find(r => r.id === id);
    if (!recommendation || recommendation.is_viewed) return;

    // Apply optimistic update
    applyOptimisticUpdate(id, 'is_viewed', true);

    // Make API call
    await markAsViewed(id);
  }, [recommendations, applyOptimisticUpdate, markAsViewed]);

  // Enhanced save/unsave handler
  const handleToggleSaved = useCallback(async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const recommendation = recommendations.find(r => r.id === id);
    if (!recommendation) return;

    const newSavedState = !recommendation.is_saved;

    // Apply optimistic update
    applyOptimisticUpdate(id, 'is_saved', newSavedState);

    // Make API call
    await toggleSaved(id, recommendation.is_saved);
  }, [recommendations, applyOptimisticUpdate, toggleSaved]);

  function getScoreColor(score: number) {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  }

  const filteredRecommendations = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return recommendations.filter((rec) => {
      const matchesSearch =
        q === "" ||
        rec.title.toLowerCase().includes(q) ||
        rec.company.toLowerCase().includes(q) ||
        rec.description.toLowerCase().includes(q) ||
        rec.skills.toLowerCase().includes(q) ||
        rec.domain.toLowerCase().includes(q);

      const matchesLocation = selectedLocation === "all" || rec.country.toLowerCase() === selectedLocation.toLowerCase();
      const matchesPlatform = selectedPlatforms.length === 0 || selectedPlatforms.includes(rec.platform);
      const matchesStatus =
        selectedStatus.length === 0 ||
        (selectedStatus.includes("new") && !rec.is_viewed && !rec.is_saved) ||
        (selectedStatus.includes("viewed") && rec.is_viewed) ||
        (selectedStatus.includes("saved") && rec.is_saved);

      return matchesSearch && matchesLocation && matchesPlatform && matchesStatus;
    });
  }, [recommendations, searchTerm, selectedLocation, selectedPlatforms, selectedStatus]);

  const sortedRecommendations = useMemo(() => {
    return [...filteredRecommendations].sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.recommended_at).getTime() - new Date(a.recommended_at).getTime();
        case "company":
          return a.company.localeCompare(b.company);
        case "match":
        default:
          return b.similarity_score - a.similarity_score;
      }
    });
  }, [filteredRecommendations, sortBy]);

  if (loading) return <div>Chargement des recommandations…</div>;
  if (error) return <div>Erreur : {error}</div>;
  if (recommendations.length === 0) return <div>Aucune recommandation trouvée.</div>;

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Recommandations</h1>
        <p className="text-muted-foreground mt-2">
          Voici les offres de stage recommandées en fonction de votre profil.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              {/* Remplacer par icône Filter */}
              🔍 Filtres
            </h2>

            <div className="space-y-6">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1">
                  Mots-clés
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-9 w-full border border-slate-300 rounded-md py-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Localisation</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded-md py-2"
                >
                  <option value="all">Toutes</option>
                  <option value="Morocco">Maroc</option>
                  <option value="Canada">Canada</option>
                  <option value="France">France</option>
                </select>
              </div>

              {/* Platforms */}
              <fieldset>
                <legend className="text-sm font-medium text-slate-700 mb-2">Plateformes</legend>
                {["LinkedIn", "Indeed", "Glassdoor"].map((platform) => (
                  <div key={platform} className="flex items-center space-x-2 mb-1">
                    <input
                      id={`platform-${platform}`}
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor={`platform-${platform}`} className="text-sm text-slate-700">
                      {platform}
                    </label>
                  </div>
                ))}
              </fieldset>

              {/* Status */}
              <fieldset>
                <legend className="text-sm font-medium text-slate-700 mb-2">Statut</legend>
                {["new", "viewed", "saved"].map((status) => (
                  <div key={status} className="flex items-center space-x-2 mb-1">
                    <input
                      id={`status-${status}`}
                      type="checkbox"
                      checked={selectedStatus.includes(status)}
                      onChange={() => toggleStatus(status)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor={`status-${status}`} className="text-sm text-slate-700">
                      {status === "new" ? "Nouveau" : status === "viewed" ? "Vu" : "Sauvegardé"}
                    </label>
                  </div>
                ))}
              </fieldset>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Trier par</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-md py-2"
                >
                  <option value="match">Pertinence</option>
                  <option value="date">Date</option>
                  <option value="company">Entreprise</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-8">
          {sortedRecommendations.length === 0 && (
            <p className="text-center text-gray-500">Aucune offre ne correspond aux filtres.</p>
          )}

          {sortedRecommendations.map((rec) => {
            const isActionLoading = actionLoading[rec.id];
            const actionError = actionErrors[rec.id];

            return (
              <div
                key={rec.id}
                className="bg-white rounded-xl shadow border p-6 cursor-pointer hover:shadow-lg transition"
                onClick={() => handleMarkAsViewed(rec.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleMarkAsViewed(rec.id);
                }}
              >
                {/* Status indicators */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    {rec.is_viewed && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Vu
                      </span>
                    )}
                    {rec.is_saved && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Sauvegardé
                      </span>
                    )}
                  </div>
                  <span
                    className={`font-semibold ${getScoreColor(rec.similarity_score)}`}
                    title={`Score de similarité : ${rec.similarity_score.toFixed(2)}%`}
                  >
                    {rec.similarity_score.toFixed(2)}%
                  </span>
                </div>

                <h3 className="text-lg font-bold">{rec.title}</h3>
                <p className="text-sm text-slate-600 mb-1">
                  <strong>Entreprise : </strong>
                  <a href={rec.link} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                    {rec.company}
                  </a>
                </p>
                <p className="text-sm text-slate-600 mb-1">
                  <strong>Lieu :</strong> {rec.location}, {rec.country}
                </p>
                <p className="text-sm text-slate-600 mb-1">
                  <strong>Durée :</strong> {rec.duration ?? "N/A"}
                </p>
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Plateforme :</strong> {rec.platform}
                </p>
                <p className="text-sm text-slate-700 line-clamp-3 mb-2">{rec.description}</p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {rec.skills.split(",").map((skill) => (
                    <span
                      key={skill.trim()}
                      className="bg-green-200 text-green-800 text-xs font-semibold px-2 py-0.5 rounded"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>

                <div className="flex justify-end space-x-2">
                  {actionError && (
                    <div className="text-red-600 text-xs mr-2">
                      Erreur: {actionError}
                    </div>
                  )}
                  
                  <button
                    onClick={(e) => handleToggleSaved(rec.id, e)}
                    disabled={isActionLoading}
                    className={`rounded-md px-3 py-1 text-sm font-semibold transition-colors ${
                      rec.is_saved
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                    } ${isActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isActionLoading ? (
                      <span className="flex items-center gap-1">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {rec.is_saved ? "Suppression..." : "Sauvegarde..."}
                      </span>
                    ) : (
                      rec.is_saved ? "Désauvegarder" : "Sauvegarder"
                    )}
                  </button>

                  <a
                    href={rec.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md px-3 py-1 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Voir l'offre
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

