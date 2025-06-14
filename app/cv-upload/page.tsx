"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, Save, Play, Loader2, ArrowLeft, Settings } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CVAnalysis {
  domain: string
  keywords: string[]
}

export default function CVUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [domain, setDomain] = useState("")
  const [keywords, setKeywords] = useState("")
  const [cvAnalysis, setCvAnalysis] = useState<CVAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [userDomains, setUserDomains] = useState<string[]>([])
  const [scrapingOptions, setScrapingOptions] = useState({
    withDescriptions: false,
    maxDescriptions: 20,
  })
  const { toast } = useToast()
  const router = useRouter()

  // Get token from localStorage (consider using a more secure method in production)
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken")
    }
    return null
  }

  // Load saved data on component mount
  useEffect(() => {
    const fetchSavedData = async () => {
      const token = getToken()
      if (!token) {
        toast({
          title: "Non authentifié",
          description: "Veuillez vous connecter",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      try {
        setIsLoading(true)
        const response = await fetch("http://127.0.0.1:8000/get_saved_analysis", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des données")
        }

        const data = await response.json()

        if (Array.isArray(data) && data.length > 0) {
          const analysis = data[0]
          setDomain(analysis.domain || "")
          setKeywords(analysis.keywords?.join(", ") || "")
          setCvAnalysis({
            domain: analysis.domain,
            keywords: analysis.keywords,
          })
        } else {
          setDomain("")
          setKeywords("")
          setCvAnalysis(null)
        }
      } catch (error) {
        console.error("Erreur récupération données sauvegardées :", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les données sauvegardées",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSavedData()
    fetchUserDomains()
  }, [toast, router])

  // Fetch user domains
  const fetchUserDomains = async () => {
    const token = getToken()
    if (!token) return

    try {
      const response = await fetch("http://127.0.0.1:8000/user/domains", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des domaines")
      }

      const data = await response.json()
      setUserDomains(data.domains || [])
    } catch (error) {
      console.error("Erreur récupération domaines:", error)
    }
  }

  // Handle file upload and analysis
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    const selectedFile = e.target.files[0]
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: "Format non supporté",
        description: "Veuillez sélectionner un fichier PDF ou DOCX",
        variant: "destructive",
      })
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est 5MB",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    setIsLoading(true)

    const token = getToken()
    if (!token) {
      toast({
        title: "Non authentifié",
        description: "Veuillez vous connecter",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("http://127.0.0.1:8000/upload_cv", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Erreur lors du traitement du CV")
      }

      const data = await response.json()

      setDomain(data.domain || "")
      setKeywords(data.keywords?.join(", ") || "")
      setCvAnalysis({
        domain: data.domain,
        keywords: data.keywords,
      })

      toast({
        title: "CV traité avec succès",
        description: "Le domaine et les mots-clés ont été extraits",
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Erreur de traitement",
        description: error.message || "Erreur lors du traitement du CV",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Start enhanced scraping
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!domain.trim() || !keywords.trim()) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir le domaine et les mots-clés",
        variant: "destructive",
      })
      return
    }

    const token = getToken()
    if (!token) {
      toast({
        title: "Non authentifié",
        description: "Veuillez vous connecter",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      // First save the analysis
      await fetch("http://127.0.0.1:8000/save_analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          domain: domain.trim(),
          keywords: keywords.split(",").map((k) => k.trim()),
        }),
      })

      // Then start enhanced scraping
      const url = new URL("http://127.0.0.1:8000/scraping/enhanced")
      url.searchParams.append("with_descriptions", scrapingOptions.withDescriptions.toString())
      url.searchParams.append("max_descriptions", scrapingOptions.maxDescriptions.toString())

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors du lancement du scraping")
      }

      toast({
        title: "Scraping amélioré lancé",
        description: `Les offres seront extraites bientôt${
          scrapingOptions.withDescriptions ? " avec descriptions détaillées" : ""
        }`,
      })

      router.push("/stages")
    } catch (error) {
      console.error(error)
      toast({
        title: "Erreur lors du scraping",
        description: "Erreur inconnue",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Save modifications
  const handleSave = async () => {
    if (!domain.trim() || !keywords.trim()) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir le domaine et les mots-clés",
        variant: "destructive",
      })
      return
    }

    const token = getToken()
    if (!token) {
      toast({
        title: "Non authentifié",
        description: "Veuillez vous connecter",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch("http://127.0.0.1:8000/save_analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          domain: domain.trim(),
          keywords: keywords.split(",").map((k) => k.trim()),
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde")
      }

      toast({
        title: "Modifications sauvegardées",
        description: "Vos données ont été enregistrées avec succès",
      })

      router.push("/stages")
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        title: "Erreur lors de la sauvegarde",
        description: "Impossible de sauvegarder les modifications",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  const handleReturnHome = () => {
    router.push("/stages")
  }

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <Button variant="ghost" onClick={handleReturnHome} className="mb-6 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Retour à l'accueil
      </Button>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Télécharger et analyser votre CV</CardTitle>
          <p className="text-muted-foreground">Téléchargez votre CV pour extraire domaine et mots-clés</p>
        </CardHeader>
        <CardContent className="space-y-8">
          {cvAnalysis ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Analyse extraite</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Domaine:</p>
                  <p className="text-base">{domain}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Mots-clés:</p>
                  <div className="flex flex-wrap gap-2">
                    {keywords
                      .split(",")
                      .filter(Boolean)
                      .map((keyword, idx) => (
                        <Badge key={idx} variant="secondary">
                          {keyword.trim()}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>Vous pouvez modifier ces informations avant de les sauvegarder.</AlertDescription>
              </Alert>
              <Separator />
            </div>
          ) : (
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>Aucun CV analysé pour le moment. Veuillez télécharger votre CV.</AlertDescription>
            </Alert>
          )}

          {userDomains.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Domaines configurés:</h3>
              <div className="flex flex-wrap gap-2">
                {userDomains.map((domain, idx) => (
                  <Badge key={idx} variant="outline">
                    {domain}
                  </Badge>
                ))}
              </div>
              <Separator className="my-2" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cv-file">{cvAnalysis ? "Mettre à jour le CV (optionnel)" : "Télécharger votre CV"}</Label>
              <Input
                id="cv-file"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                disabled={isLoading || isAnalyzing}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
              />
              {file && <p className="text-sm text-muted-foreground">Fichier sélectionné : {file.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domaine du stage *</Label>
              <Input
                id="domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Ex: Data Science, IA, BI"
                disabled={isAnalyzing}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Mots-clés (séparés par des virgules) *</Label>
              <Textarea
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Ex: python, machine learning, SQL"
                disabled={isAnalyzing}
                required
                rows={4}
              />
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="options">
                <AccordionTrigger className="text-sm font-medium flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Options de scraping avancées
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-4 bg-green-100 border-l-4 border-green-500 text-white-700 rounded-md text-sm">
                    ⚠️ Pour enrichir notre base de données et augmenter les chances de recommander des offres plus pertinentes, veuillez lancer le scraping.
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>


            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={handleSave} disabled={isAnalyzing}>
                {isAnalyzing ? (
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
              <Button type="submit" disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Lancement...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Lancer le scraping
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
