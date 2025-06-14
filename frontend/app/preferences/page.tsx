"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, RotateCcw, Save, Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

interface UserPreferences {
  domain_weight: number
  skills_weight: number
  title_weight: number
  description_weight: number
  country_weights: {
    [key: string]: number
  }
  platform_weights: {
    [key: string]: number
  }
}

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    domain_weight: 0.4,
    skills_weight: 0.3,
    title_weight: 0.2,
    description_weight: 0.1,
    country_weights: {
      Morocco: 1.0,
      France: 1.0,
      Canada:1.0,
    },
    platform_weights: {
      LinkedIn: 1.0,
      Indeed: 1.0,
      Glassdoor: 1.0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    fetchPreferences()
  }, [user, authLoading, router])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("authToken")
      const response = await fetch("http://127.0.0.1:8000/preferences", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error("Error fetching preferences:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger vos préférences",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWeightChange = (field: keyof UserPreferences, value: number[]) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value[0],
    }))
  }

  const handleCountryWeightChange = (country: string, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setPreferences((prev) => ({
      ...prev,
      country_weights: {
        ...prev.country_weights,
        [country]: numValue,
      },
    }))
  }

  const handlePlatformWeightChange = (platform: string, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setPreferences((prev) => ({
      ...prev,
      platform_weights: {
        ...prev.platform_weights,
        [platform]: numValue,
      },
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem("authToken")
      const response = await fetch("http://127.0.0.1:8000/preferences", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      })

      if (response.ok) {
        toast({
          title: "Préférences sauvegardées",
          description: "Vos préférences ont été mises à jour avec succès",
        })
        router.push("/stages")
      } else {
        throw new Error("Failed to save preferences")
      }
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos préférences",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setPreferences({
      domain_weight: 0.4,
      skills_weight: 0.3,
      title_weight: 0.2,
      description_weight: 0.1,
      country_weights: {
        Morocco: 1.0,
        France: 1.0,
        Canada:1.0,
      },
      platform_weights: {
        LinkedIn: 1.0,
        Indeed: 1.0,
        Glassdoor: 1.0,
      },
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement des préférences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => router.push("/stages")} className="mb-6 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Retour 
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Préférences</h1>
        <p className="text-muted-foreground mt-2">
          Personnalisez vos préférences pour améliorer les recommandations de stages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Criteria Weighting */}
        <Card>
          <CardHeader>
            <CardTitle>Pondération des critères</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ajustez l'importance relative de chaque critère dans le calcul des recommandations.
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="domain_weight">Domaine ({(preferences.domain_weight * 100).toFixed(0)}%)</Label>
              <Slider
                id="domain_weight"
                min={0}
                max={1}
                step={0.1}
                value={[preferences.domain_weight]}
                onValueChange={(value) => handleWeightChange("domain_weight", value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills_weight">Compétences ({(preferences.skills_weight * 100).toFixed(0)}%)</Label>
              <Slider
                id="skills_weight"
                min={0}
                max={1}
                step={0.1}
                value={[preferences.skills_weight]}
                onValueChange={(value) => handleWeightChange("skills_weight", value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title_weight">Titre ({(preferences.title_weight * 100).toFixed(0)}%)</Label>
              <Slider
                id="title_weight"
                min={0}
                max={1}
                step={0.1}
                value={[preferences.title_weight]}
                onValueChange={(value) => handleWeightChange("title_weight", value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_weight">
                Description ({(preferences.description_weight * 100).toFixed(0)}%)
              </Label>
              <Slider
                id="description_weight"
                min={0}
                max={1}
                step={0.1}
                value={[preferences.description_weight]}
                onValueChange={(value) => handleWeightChange("description_weight", value)}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Country Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Préférences de pays</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ajustez l'importance relative de chaque pays dans les recommandations.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(preferences.country_weights).map(([country, weight]) => (
                <div key={country} className="flex items-center space-x-4">
                  <Label className="min-w-[100px]">{country}</Label>
                  <Input
                    type="number"
                    value={weight}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={(e) => handleCountryWeightChange(country, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Platform Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Préférences de plateformes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ajustez l'importance relative de chaque plateforme dans les recommandations.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(preferences.platform_weights).map(([platform, weight]) => (
                <div key={platform} className="flex items-center space-x-4">
                  <Label className="min-w-[100px]">{platform}</Label>
                  <Input
                    type="number"
                    value={weight}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={(e) => handlePlatformWeightChange(platform, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => router.push("/stages")}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
