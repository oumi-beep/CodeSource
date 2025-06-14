"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, BookOpen, Code, Network, Server, Zap, AlertCircle } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { type EtudiantData, type PredictionResult, predictFiliere } from "@/services/predection-api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getFiliereData } from "@/data/filieres-data"

export default function PredictionPage() {
  const [step, setStep] = useState(1)
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null)

  // État pour stocker toutes les données du formulaire
  const [formData, setFormData] = useState<EtudiantData>({
    // Valeurs par défaut
    Algebre1: 0,
    Analyse1: 0,
    Physique1_Meca: 0,
    Meca_Poin: 0,
    Informatique1: 0,
    LC1: 0,
    Algebre2: 0,
    Analyse2: 0,
    Physique2: 0,
    Chimie: 0,
    Informatique2: 0,
    LC2: 0,
    Algebre3: 0,
    Analyse3: 0,
    Mecanique2: 0,
    Electronique1: 0,
    Informatique3: 0,
    LC3: 0,
    Analyse4: 0,
    Math_applique: 0,
    Physique3: 0,
    Physique4: 0,
    Electronique2: 0,
    LC4: 0,

    Sexe: "",
    Age: 0,
    Statut_socio: "",
    Situation_geo: "",
    Orientation_Lycee: "",
    Mention_Bac: "",

    Programmation: 3,
    Reseaux_Cyber: 3,
    Data_AI: 3,
    Electronique_Embarque: 3,
    Genie_Proc: 3,
    Management_SI: 3,
  })

  // Récupérer les données de la filière prédite
  const filiereData = getFiliereData(predictionResult?.filiere_predite)

  // Fonction pour mettre à jour les données du formulaire
  const updateFormData = (field: keyof EtudiantData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    } else {
      // Appel direct de la fonction handleSubmit
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  // Fonction pour soumettre les données à l'API
  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Convertir les valeurs en nombres
      const dataToSend = {
        ...formData,
        Age: Number(formData.Age),
        Programmation: Number(formData.Programmation),
        Reseaux_Cyber: Number(formData.Reseaux_Cyber),
        Data_AI: Number(formData.Data_AI),
        Electronique_Embarque: Number(formData.Electronique_Embarque),
        Genie_Proc: Number(formData.Genie_Proc),
        Management_SI: Number(formData.Management_SI),
      }

      // Appel à l'API
      const result = await predictFiliere(dataToSend)
      setPredictionResult(result)
      setShowResults(true)
    } catch (err) {
      setError("Une erreur est survenue lors de la prédiction. Veuillez réessayer.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour formater les pourcentages
  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(1) + "%"
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Prédiction de Filière</h1>
          <p className="text-slate-600 max-w-3xl">
            Notre système d'intelligence artificielle analyse vos performances académiques et vos centres d'intérêt pour
            vous recommander la filière qui correspond le mieux à votre profil.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!showResults ? (
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      step >= i ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {i}
                  </div>
                ))}
              </div>
              <Progress value={step * 25} className="h-2" />
              <div className="flex justify-between mt-2 text-sm">
                <div className="text-blue-600 font-medium">Informations personnelles</div>
                <div className={step >= 2 ? "text-blue-600 font-medium" : "text-slate-500"}>Modules Semestre 1-2</div>
                <div className={step >= 3 ? "text-blue-600 font-medium" : "text-slate-500"}>Modules Semestre 3-4</div>
                <div className={step >= 4 ? "text-blue-600 font-medium" : "text-slate-500"}>Centres d'intérêt</div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  {step === 1 && "Informations personnelles"}
                  {step === 2 && "Notes des modules (Semestre 1-2)"}
                  {step === 3 && "Notes des modules (Semestre 3-4)"}
                  {step === 4 && "Centres d'intérêt"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="sexe" className="block text-sm font-medium text-slate-700 mb-1">
                          Sexe
                        </label>
                        <select
                          id="sexe"
                          value={formData.Sexe}
                          onChange={(e) => updateFormData("Sexe", e.target.value)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner</option>
                          <option value="M">Homme</option>
                          <option value="F">Femme</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="age" className="block text-sm font-medium text-slate-700 mb-1">
                          Âge
                        </label>
                        <input
                          type="number"
                          id="age"
                          min="17"
                          max="30"
                          value={formData.Age || ""}
                          onChange={(e) => updateFormData("Age", Number.parseInt(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="statut_socio" className="block text-sm font-medium text-slate-700 mb-1">
                          Statut socio-économique
                        </label>
                        <select
                          id="statut_socio"
                          value={formData.Statut_socio}
                          onChange={(e) => updateFormData("Statut_socio", e.target.value)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Bas">Bas</option>
                          <option value="Moyen">Moyen</option>
                          <option value="Élevé">Élevé</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="situation_geo" className="block text-sm font-medium text-slate-700 mb-1">
                          Situation géographique
                        </label>
                        <select
                          id="situation_geo"
                          value={formData.Situation_geo}
                          onChange={(e) => updateFormData("Situation_geo", e.target.value)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Urbain">Urbain</option>
                          <option value="Campagne">Campagne</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="orientation_lycee" className="block text-sm font-medium text-slate-700 mb-1">
                          Orientation au Lycée
                        </label>
                        <select
                          id="orientation_lycee"
                          value={formData.Orientation_Lycee}
                          onChange={(e) => updateFormData("Orientation_Lycee", e.target.value)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Science Maths">Science Maths</option>
                          <option value="Science Physique">Science Physique</option>
                          <option value="SVT">SVT</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="mention_bac" className="block text-sm font-medium text-slate-700 mb-1">
                          Mention au Bac
                        </label>
                        <select
                          id="mention_bac"
                          value={formData.Mention_Bac}
                          onChange={(e) => updateFormData("Mention_Bac", e.target.value)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Passable">Passable</option>
                          <option value="Assez Bien">Assez Bien</option>
                          <option value="Bien">Bien</option>
                          <option value="Très Bien">Très Bien</option>
                          <option value="Excellent">Excellent</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 mb-4">
                      Veuillez saisir vos notes pour les modules du premier et deuxième semestre (sur 20).
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="algebre1" className="block text-sm font-medium text-slate-700 mb-1">
                          Algèbre 1
                        </label>
                        <input
                          type="number"
                          id="algebre1"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Algebre1 || ""}
                          onChange={(e) => updateFormData("Algebre1", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="analyse1" className="block text-sm font-medium text-slate-700 mb-1">
                          Analyse 1
                        </label>
                        <input
                          type="number"
                          id="analyse1"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Analyse1 || ""}
                          onChange={(e) => updateFormData("Analyse1", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="physique1_meca" className="block text-sm font-medium text-slate-700 mb-1">
                          Physique 1 (Mécanique)
                        </label>
                        <input
                          type="number"
                          id="physique1_meca"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Physique1_Meca || ""}
                          onChange={(e) => updateFormData("Physique1_Meca", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="meca_poin" className="block text-sm font-medium text-slate-700 mb-1">
                          Mécanique du Point
                        </label>
                        <input
                          type="number"
                          id="meca_poin"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Meca_Poin || ""}
                          onChange={(e) => updateFormData("Meca_Poin", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="informatique1" className="block text-sm font-medium text-slate-700 mb-1">
                          Informatique 1
                        </label>
                        <input
                          type="number"
                          id="informatique1"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Informatique1 || ""}
                          onChange={(e) => updateFormData("Informatique1", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="lc1" className="block text-sm font-medium text-slate-700 mb-1">
                          Langue et Communication 1
                        </label>
                        <input
                          type="number"
                          id="lc1"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.LC1 || ""}
                          onChange={(e) => updateFormData("LC1", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="algebre2" className="block text-sm font-medium text-slate-700 mb-1">
                          Algèbre 2
                        </label>
                        <input
                          type="number"
                          id="algebre2"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Algebre2 || ""}
                          onChange={(e) => updateFormData("Algebre2", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="analyse2" className="block text-sm font-medium text-slate-700 mb-1">
                          Analyse 2
                        </label>
                        <input
                          type="number"
                          id="analyse2"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Analyse2 || ""}
                          onChange={(e) => updateFormData("Analyse2", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="physique2" className="block text-sm font-medium text-slate-700 mb-1">
                          Physique 2
                        </label>
                        <input
                          type="number"
                          id="physique2"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Physique2 || ""}
                          onChange={(e) => updateFormData("Physique2", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="chimie" className="block text-sm font-medium text-slate-700 mb-1">
                          Chimie
                        </label>
                        <input
                          type="number"
                          id="chimie"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Chimie || ""}
                          onChange={(e) => updateFormData("Chimie", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="informatique2" className="block text-sm font-medium text-slate-700 mb-1">
                          Informatique 2
                        </label>
                        <input
                          type="number"
                          id="informatique2"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Informatique2 || ""}
                          onChange={(e) => updateFormData("Informatique2", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="lc2" className="block text-sm font-medium text-slate-700 mb-1">
                          Langue et Communication 2
                        </label>
                        <input
                          type="number"
                          id="lc2"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.LC2 || ""}
                          onChange={(e) => updateFormData("LC2", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 mb-4">
                      Veuillez saisir vos notes pour les modules du troisième et quatrième semestre (sur 20).
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="algebre3" className="block text-sm font-medium text-slate-700 mb-1">
                          Algèbre 3
                        </label>
                        <input
                          type="number"
                          id="algebre3"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Algebre3 || ""}
                          onChange={(e) => updateFormData("Algebre3", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="analyse3" className="block text-sm font-medium text-slate-700 mb-1">
                          Analyse 3
                        </label>
                        <input
                          type="number"
                          id="analyse3"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Analyse3 || ""}
                          onChange={(e) => updateFormData("Analyse3", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="mecanique2" className="block text-sm font-medium text-slate-700 mb-1">
                          Mécanique 2
                        </label>
                        <input
                          type="number"
                          id="mecanique2"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Mecanique2 || ""}
                          onChange={(e) => updateFormData("Mecanique2", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="electronique1" className="block text-sm font-medium text-slate-700 mb-1">
                          Électronique 1
                        </label>
                        <input
                          type="number"
                          id="electronique1"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Electronique1 || ""}
                          onChange={(e) => updateFormData("Electronique1", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="informatique3" className="block text-sm font-medium text-slate-700 mb-1">
                          Informatique 3
                        </label>
                        <input
                          type="number"
                          id="informatique3"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Informatique3 || ""}
                          onChange={(e) => updateFormData("Informatique3", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="lc3" className="block text-sm font-medium text-slate-700 mb-1">
                          Langue et Communication 3
                        </label>
                        <input
                          type="number"
                          id="lc3"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.LC3 || ""}
                          onChange={(e) => updateFormData("LC3", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="analyse4" className="block text-sm font-medium text-slate-700 mb-1">
                          Analyse 4
                        </label>
                        <input
                          type="number"
                          id="analyse4"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Analyse4 || ""}
                          onChange={(e) => updateFormData("Analyse4", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="math_applique" className="block text-sm font-medium text-slate-700 mb-1">
                          Mathématiques Appliquées
                        </label>
                        <input
                          type="number"
                          id="math_applique"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Math_applique || ""}
                          onChange={(e) => updateFormData("Math_applique", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="physique3" className="block text-sm font-medium text-slate-700 mb-1">
                          Physique 3
                        </label>
                        <input
                          type="number"
                          id="physique3"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Physique3 || ""}
                          onChange={(e) => updateFormData("Physique3", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="physique4" className="block text-sm font-medium text-slate-700 mb-1">
                          Physique 4
                        </label>
                        <input
                          type="number"
                          id="physique4"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Physique4 || ""}
                          onChange={(e) => updateFormData("Physique4", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="electronique2" className="block text-sm font-medium text-slate-700 mb-1">
                          Électronique 2
                        </label>
                        <input
                          type="number"
                          id="electronique2"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.Electronique2 || ""}
                          onChange={(e) => updateFormData("Electronique2", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="lc4" className="block text-sm font-medium text-slate-700 mb-1">
                          Langue et Communication 4
                        </label>
                        <input
                          type="number"
                          id="lc4"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="Ex: 14.5"
                          value={formData.LC4 || ""}
                          onChange={(e) => updateFormData("LC4", Number.parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 mb-4">
                      Évaluez votre intérêt pour les domaines suivants sur une échelle de 1 à 5 (1 = Pas du tout
                      intéressé, 5 = Très intéressé).
                    </p>

                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-1">
                          <label htmlFor="programmation" className="text-sm font-medium text-slate-700">
                            Programmation
                          </label>
                          <span className="text-sm text-slate-500" id="programmation-value">
                            {formData.Programmation}
                          </span>
                        </div>
                        <input
                          type="range"
                          id="programmation"
                          min="1"
                          max="5"
                          value={formData.Programmation}
                          onChange={(e) => updateFormData("Programmation", Number.parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label htmlFor="reseaux_cyber" className="text-sm font-medium text-slate-700">
                            Réseaux et Cybersécurité
                          </label>
                          <span className="text-sm text-slate-500" id="reseaux_cyber-value">
                            {formData.Reseaux_Cyber}
                          </span>
                        </div>
                        <input
                          type="range"
                          id="reseaux_cyber"
                          min="1"
                          max="5"
                          value={formData.Reseaux_Cyber}
                          onChange={(e) => updateFormData("Reseaux_Cyber", Number.parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label htmlFor="data_ai" className="text-sm font-medium text-slate-700">
                            Data Science et Intelligence Artificielle
                          </label>
                          <span className="text-sm text-slate-500" id="data_ai-value">
                            {formData.Data_AI}
                          </span>
                        </div>
                        <input
                          type="range"
                          id="data_ai"
                          min="1"
                          max="5"
                          value={formData.Data_AI}
                          onChange={(e) => updateFormData("Data_AI", Number.parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label htmlFor="electronique_embarque" className="text-sm font-medium text-slate-700">
                            Électronique et Systèmes Embarqués
                          </label>
                          <span className="text-sm text-slate-500" id="electronique_embarque-value">
                            {formData.Electronique_Embarque}
                          </span>
                        </div>
                        <input
                          type="range"
                          id="electronique_embarque"
                          min="1"
                          max="5"
                          value={formData.Electronique_Embarque}
                          onChange={(e) => updateFormData("Electronique_Embarque", Number.parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label htmlFor="genie_proc" className="text-sm font-medium text-slate-700">
                            Génie des Procédés
                          </label>
                          <span className="text-sm text-slate-500" id="genie_proc-value">
                            {formData.Genie_Proc}
                          </span>
                        </div>
                        <input
                          type="range"
                          id="genie_proc"
                          min="1"
                          max="5"
                          value={formData.Genie_Proc}
                          onChange={(e) => updateFormData("Genie_Proc", Number.parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label htmlFor="management_si" className="text-sm font-medium text-slate-700">
                            Management et Systèmes d'Information
                          </label>
                          <span className="text-sm text-slate-500" id="management_si-value">
                            {formData.Management_SI}
                          </span>
                        </div>
                        <input
                          type="range"
                          id="management_si"
                          min="1"
                          max="5"
                          value={formData.Management_SI}
                          onChange={(e) => updateFormData("Management_SI", Number.parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={handlePrev} disabled={step === 1}>
                    Précédent
                  </Button>
                  <Button onClick={handleNext} disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Traitement...
                      </span>
                    ) : step < 4 ? (
                      "Suivant"
                    ) : (
                      "Voir les résultats"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Résultats de la prédiction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-8">
                  <div className="text-lg text-slate-600 mb-2">Filière recommandée</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {predictionResult?.filiere_predite || "Génie Informatique"}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Compatibilité avec les filières</h3>
                    <div className="space-y-4">
                      {predictionResult?.probabilites ? (
                        Object.entries(predictionResult.probabilites)
                          .sort((a, b) => b[1] - a[1])
                          .map(([filiere, proba]) => (
                            <div key={filiere}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">{filiere}</span>
                                <span className="text-sm font-medium text-blue-600">{formatPercentage(proba)}</span>
                              </div>
                              <Progress value={proba * 100} className="h-2" />
                            </div>
                          ))
                      ) : (
                        <>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Génie Informatique</span>
                              <span className="text-sm font-medium text-blue-600">92%</span>
                            </div>
                            <Progress value={92} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Génie des Réseaux et Systèmes</span>
                              <span className="text-sm font-medium text-blue-600">78%</span>
                            </div>
                            <Progress value={78} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Génie des Données</span>
                              <span className="text-sm font-medium text-blue-600">65%</span>
                            </div>
                            <Progress value={65} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Génie Électrique</span>
                              <span className="text-sm font-medium text-blue-600">45%</span>
                            </div>
                            <Progress value={45} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Génie Industriel</span>
                              <span className="text-sm font-medium text-blue-600">32%</span>
                            </div>
                            <Progress value={32} className="h-2" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Points forts identifiés</h3>
                    <ul className="space-y-2">
                      {filiereData.pointsForts.map((point, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="mt-1 text-emerald-500">
                            <Zap className="h-4 w-4" />
                          </div>
                          <span>{point.text}</span>
                        </li>
                      ))}
                    </ul>

                    <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-4">Débouchés professionnels</h3>
                    <ul className="space-y-2">
                      {filiereData.debouches.map((debouche, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="mt-1 text-blue-500">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                          <span>{debouche.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Découvrez la filière {predictionResult?.filiere_predite || "Génie Informatique"}
              </h2>

              <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Aperçu</TabsTrigger>
                  <TabsTrigger value="courses">Cours</TabsTrigger>
                  <TabsTrigger value="skills">Compétences</TabsTrigger>
                  <TabsTrigger value="careers">Carrières</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="p-6 bg-white rounded-lg border border-slate-200">
                  <div className="space-y-4">
                    <p>{filiereData.description}</p>
                    <p>
                      Les étudiants acquièrent des compétences variées et spécialisées. La formation met l'accent sur
                      les projets pratiques et les stages en entreprise pour préparer les étudiants au marché du
                      travail.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                        <span>Durée: 3 ans</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-blue-500" />
                        <span>Laboratoires spécialisés</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-blue-500" />
                        <span>Partenariats industriels</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Code className="h-5 w-5 text-blue-500" />
                        <span>Projets pratiques</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="courses" className="p-6 bg-white rounded-lg border border-slate-200">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Cours principaux</h3>
                    <ul className="space-y-2">
                      {filiereData.cours.map((cours, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="mt-1 text-blue-500">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-medium">{cours.titre}</span>
                            <p className="text-sm text-slate-600">{cours.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="skills" className="p-6 bg-white rounded-lg border border-slate-200">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Compétences développées</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filiereData.competences.map((competence, index) => {
                        const IconComponent = competence.icon
                        return (
                          <div key={index} className="bg-slate-50 p-4 rounded-lg">
                            <h4 className="font-medium flex items-center gap-2 mb-2">
                              <IconComponent className="h-5 w-5 text-blue-500" />
                              {competence.titre}
                            </h4>
                            <p className="text-sm text-slate-600">{competence.description}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="careers" className="p-6 bg-white rounded-lg border border-slate-200">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Débouchés professionnels</h3>
                    <p>
                      Les diplômés en {predictionResult?.filiere_predite || "Génie Informatique"} de l'ENSA Khouribga
                      sont très recherchés sur le marché du travail, tant au Maroc qu'à l'international. Voici
                      quelques-uns des postes qu'ils peuvent occuper:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      {filiereData.categoriesDebouches.map((categorie, index) => (
                        <div key={index} className="bg-slate-50 p-4 rounded-lg">
                          <h4 className="font-medium text-center mb-3">{categorie.categorie}</h4>
                          <ul className="space-y-2 text-sm">
                            {categorie.postes.map((poste, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4 text-blue-500" />
                                <span>{poste}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-center">
              <Button onClick={() => setShowResults(false)} variant="outline" className="mr-4">
                Modifier mes réponses
              </Button>
              <Button asChild>
                <Link href="/chatbot">Découvrir les compétences requises</Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
