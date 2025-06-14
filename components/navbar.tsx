"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const { authenticated, user } = useAuth();
  const isAuthenticated = authenticated && user
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 text-transparent bg-clip-text">
                FuturePath
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/stages" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
              Stages
            </Link>
            <Link href="/prediction" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
              Prédiction
            </Link>
            <Link href="/chatbot" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
              Chatbot
            </Link>
            <Link href="/pfe" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
              PFE
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {authenticated ? (
              <Button asChild>
                <Link href="/profile">Profil</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button asChild>
                  <Link href="/inscription">Inscription</Link>
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-blue-600 hover:bg-slate-100 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn("md:hidden", isMenuOpen ? "block" : "hidden")}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-b border-slate-200">
          <Link
            href="/stages"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100"
            onClick={() => setIsMenuOpen(false)}
          >
            Stages
          </Link>
          <Link
            href="/prediction"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100"
            onClick={() => setIsMenuOpen(false)}
          >
            Prédiction
          </Link>
          <Link
            href="/chatbot"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100"
            onClick={() => setIsMenuOpen(false)}
          >
            Chatbot
          </Link>
          <Link
            href="/pfe"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100"
            onClick={() => setIsMenuOpen(false)}
          >
            PFE
          </Link>
          <main>
        {authenticated && user ? (
          <div>
            <h1>Bienvenue, {user.email} !</h1>
            {/* Affiche d’autres infos utilisateur */}
          </div>
        ) : (
          <div>
            {/* Si non connecté, affiche par exemple des boutons Connexion / Inscription */}
            <button onClick={() => router.push("/login")}>Connexion</button>
            <button onClick={() => router.push("/inscription")}>Inscription</button>
          </div>
        )}
      </main>
        </div>
      </div>
    </header>
  )
}
