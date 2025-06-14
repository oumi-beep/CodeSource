import Link from "next/link"
import ResumeUploadForm from "@/components/resume-upload-form"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-emerald-600">StageMatch</span>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="#" className="text-slate-600 hover:text-slate-900">
                À propos
              </Link>
              <Link href="#" className="text-slate-600 hover:text-slate-900">
                Contact
              </Link>
              <Link href="#" className="text-slate-600 hover:text-slate-900">
                FAQ
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-4xl w-full mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Trouvez le stage idéal pour votre carrière</h1>
            <p className="text-slate-600 mb-6">
              Notre système intelligent analyse votre CV et vous recommande les stages qui correspondent le mieux à
              votre profil, vos compétences et vos aspirations professionnelles.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 text-sm font-medium">1</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-slate-800">Téléchargez votre CV</h3>
                  <p className="text-sm text-slate-600">
                    Importez votre CV au format PDF pour que notre système puisse l'analyser.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 text-sm font-medium">2</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-slate-800">Obtenez des recommandations</h3>
                  <p className="text-sm text-slate-600">
                    Notre algorithme analyse votre profil et vous propose les stages les plus pertinents.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 text-sm font-medium">3</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-slate-800">Postulez en un clic</h3>
                  <p className="text-sm text-slate-600">
                    Postulez directement aux offres qui vous intéressent depuis notre plateforme.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <ResumeUploadForm />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-slate-500">
            <p>© 2025 StageMatch. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
