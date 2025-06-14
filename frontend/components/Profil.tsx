"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, MapPin, GraduationCap, Languages, Wrench, FileText, Upload, ArrowLeft, LogOut } from "lucide-react"

type UserProfile = {
  user_id: string
  nom: string
  competences: string[]
  domaine_prefere: string
  lieu_souhaite: string
  langues: string[]
  outils: string[]
  niveau_etudes: string
  email: string
  cvFilename?: string | null
}

// Custom hook for user profile data
function useUserProfile() {
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const email = localStorage.getItem("userEmail")
      if (!email) throw new Error("Utilisateur non connecté")

      const token = localStorage.getItem("authToken")
      if (!token) throw new Error("Token d'authentification manquant")

      const res = await fetch(
        `http://127.0.0.1:8000/api/user-profile?email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      if (!res.ok) throw new Error("Impossible de charger les infos utilisateur")

      const data: UserProfile = await res.json()
      setUserInfo(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  return { userInfo, loading, error, refetch: fetchUserProfile }
}

// Profile info 
function ProfileInfo({ userInfo }: { userInfo: UserProfile }) {
  const profileFields = [
    { icon: User, label: "ID", value: userInfo.user_id },
    { icon: User, label: "Nom complet", value: userInfo.nom },
    { icon: Mail, label: "Email", value: userInfo.email },
    { icon: MapPin, label: "Lieu souhaité", value: userInfo.lieu_souhaite },
    { icon: GraduationCap, label: "Niveau d'études", value: userInfo.niveau_etudes },
    { icon: FileText, label: "Domaine préféré", value: userInfo.domaine_prefere },
  ]

  const arrayFields = [
    { icon: Wrench, label: "Compétences", value: userInfo.competences },
    { icon: Languages, label: "Langues", value: userInfo.langues },
    { icon: Wrench, label: "Outils", value: userInfo.outils },
  ]

  return (
    <div className="space-y-6">
      {profileFields.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-base">{value}</p>
          </div>
        </div>
      ))}

      {arrayFields.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-start gap-3">
          <Icon className="h-5 w-5 text-muted-foreground mt-1" />
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(value) &&
                value.map((item, index) => (
                  <Badge key={index} variant="secondary">
                    {item}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-6 w-full max-w-md" />
      <Skeleton className="h-6 w-full max-w-sm" />
      <Skeleton className="h-6 w-full max-w-lg" />
      <Skeleton className="h-6 w-full max-w-md" />
    </div>
  )
}

export default function ProfilePage () {
  const { userInfo, loading, error, refetch } = useUserProfile()
  const router = useRouter()
  const { toast } = useToast()
  const { logout } = useAuth()
  const { setAuthenticated, setUser } = useAuth();

  // Redirection si pas connecté
  useEffect(() => {
    if (!localStorage.getItem("userEmail")) {
      router.push("/profile")
    }
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: 'include', 
      });
      localStorage.removeItem("authToken");
      localStorage.removeItem("userProfile");
      setAuthenticated?.(false);
      setUser?.(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("authToken");
      localStorage.removeItem("userProfile");
      setAuthenticated?.(false);
      setUser?.(null);
      window.location.href = "/";
    }
  };

  if (loading) return <ProfileSkeleton />

  if (error)
    return (
      <Alert variant="destructive" className="max-w-4xl mx-auto p-6">
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={refetch} className="mt-4">
          Réessayer
        </Button>
      </Alert>
    )

  if (!userInfo)
    return (
      <Alert variant="destructive" className="max-w-4xl mx-auto p-6">
        <AlertDescription>Impossible de récupérer les données utilisateur.</AlertDescription>
      </Alert>
    )

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profil Utilisateur</h1>
        <Button variant="ghost" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'accueil
        </Button>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>

      <ProfileInfo userInfo={userInfo} />

    </div>
  )
}
