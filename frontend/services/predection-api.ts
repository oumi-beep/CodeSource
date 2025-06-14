// Service pour communiquer avec l'API de prédiction
import { API_CONFIG } from "@/config/api-config"

export interface EtudiantData {
  // Notes des modules
  Algebre1: number
  Analyse1: number
  Physique1_Meca: number
  Meca_Poin: number
  Informatique1: number
  LC1: number
  Algebre2: number
  Analyse2: number
  Physique2: number
  Chimie: number
  Informatique2: number
  LC2: number
  Algebre3: number
  Analyse3: number
  Mecanique2: number
  Electronique1: number
  Informatique3: number
  LC3: number
  Analyse4: number
  Math_applique: number
  Physique3: number
  Physique4: number
  Electronique2: number
  LC4: number

  // Informations personnelles
  Sexe: string
  Age: number
  Statut_socio: string
  Situation_geo: string
  Orientation_Lycee: string
  Mention_Bac: string

  // Centres d'intérêt
  Programmation: number
  Reseaux_Cyber: number
  Data_AI: number
  Electronique_Embarque: number
  Genie_Proc: number
  Management_SI: number
}

export interface PredictionResult {
  filiere_predite: string
  probabilites: Record<string, number>
}

export async function predictFiliere(data: EtudiantData): Promise<PredictionResult> {
  try {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`http://localhost:8000/predict`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",

      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la prédiction:", error)
    throw error
  }
}
