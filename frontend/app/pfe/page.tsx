import { Search, Filter, BookOpen, Calendar, User, Download, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function PFEPage() {
  // Exemple de projets PFE
  const projects = [
    {
      id: 1,
      title: "Système de recommandation pour l'orientation des étudiants",
      author: "Ahmed Bensouda",
      year: 2023,
      supervisor: "Dr. Karim Hamid",
      tags: ["IA", "Machine Learning", "Éducation"],
      abstract:
        "Ce projet propose un système intelligent qui aide les étudiants à choisir leur filière en fonction de leurs performances académiques et de leurs centres d'intérêt. Il utilise des algorithmes de machine learning pour analyser les données et générer des recommandations personnalisées.",
    },
    {
      id: 2,
      title: "Plateforme de gestion des stages pour les étudiants ingénieurs",
      author: "Fatima Zahra El Alami",
      year: 2022,
      supervisor: "Dr. Nadia Tazi",
      tags: ["Web", "Base de données", "Gestion"],
      abstract:
        "Cette plateforme facilite la recherche et la gestion des stages pour les étudiants ingénieurs. Elle permet aux entreprises de publier des offres, aux étudiants de postuler, et aux encadrants de suivre l'avancement des stages.",
    },
    {
      id: 3,
      title: "Système de détection d'intrusion basé sur l'apprentissage profond",
      author: "Youssef Mansouri",
      year: 2023,
      supervisor: "Dr. Hassan Berrada",
      tags: ["Cybersécurité", "Deep Learning", "Réseaux"],
      abstract:
        "Ce projet développe un système de détection d'intrusion utilisant des techniques d'apprentissage profond pour identifier les comportements malveillants sur les réseaux informatiques. Il offre une protection avancée contre les cyberattaques.",
    },
    {
      id: 4,
      title: "Application mobile pour l'apprentissage adaptatif",
      author: "Salma Bennani",
      year: 2022,
      supervisor: "Dr. Mohammed Alaoui",
      tags: ["Mobile", "IA", "Éducation"],
      abstract:
        "Cette application mobile propose un parcours d'apprentissage personnalisé qui s'adapte au rythme et aux préférences de chaque utilisateur. Elle utilise des algorithmes d'IA pour optimiser l'expérience d'apprentissage.",
    },
    {
      id: 5,
      title: "Optimisation de la chaîne logistique avec l'Internet des Objets",
      author: "Karim Idrissi",
      year: 2021,
      supervisor: "Dr. Laila Benabdellah",
      tags: ["IoT", "Logistique", "Optimisation"],
      abstract:
        "Ce projet explore l'utilisation de l'Internet des Objets (IoT) pour optimiser la chaîne logistique. Il propose une solution qui permet de suivre les produits en temps réel et d'améliorer l'efficacité des processus logistiques.",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Bibliothèque PFE</h1>
          <p className="text-slate-600 max-w-3xl">
            Explorez les Projets de Fin d'Études (PFE) réalisés par les anciens étudiants de l'ENSA Khouribga. Une
            source précieuse d'inspiration et d'apprentissage pour vos propres projets.
          </p>
        </div>

        <div className="mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Rechercher par titre, auteur, mots-clés..." className="pl-9" />
                </div>
              </div>
              <div className="flex gap-2">
                <select className="rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                  <option value="">Toutes les années</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                </select>
                <select className="rounded-md border border-slate-300 py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                  <option value="">Toutes les filières</option>
                  <option value="gi">Génie Informatique</option>
                  <option value="grs">Génie des Réseaux et Systèmes</option>
                  <option value="gd">Génie des Données</option>
                  <option value="ge">Génie Électrique</option>
                  <option value="gind">Génie Industriel</option>
                </select>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="all">
          <div className="mb-6">
            <TabsList>
              <TabsTrigger value="all">Tous les projets</TabsTrigger>
              <TabsTrigger value="ia">Intelligence Artificielle</TabsTrigger>
              <TabsTrigger value="web">Développement Web</TabsTrigger>
              <TabsTrigger value="mobile">Applications Mobiles</TabsTrigger>
              <TabsTrigger value="security">Cybersécurité</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-6">
            {projects.map((project) => (
              <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">{project.title}</h3>

                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-slate-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {project.author}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {project.year}
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        Encadrant: {project.supervisor}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-slate-600 mb-4">{project.abstract}</p>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        Télécharger
                      </Button>
                      <Button size="sm" className="flex items-center gap-1">
                        <ArrowUpRight className="h-4 w-4" />
                        Voir les détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="ia" className="space-y-6">
            {projects
              .filter(
                (p) => p.tags.includes("IA") || p.tags.includes("Machine Learning") || p.tags.includes("Deep Learning"),
              )
              .map((project) => (
                <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">{project.title}</h3>

                      <div className="flex flex-wrap gap-4 mb-4 text-sm text-slate-500">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {project.author}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {project.year}
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          Encadrant: {project.supervisor}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-slate-600 mb-4">{project.abstract}</p>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          Télécharger
                        </Button>
                        <Button size="sm" className="flex items-center gap-1">
                          <ArrowUpRight className="h-4 w-4" />
                          Voir les détails
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          {/* Autres TabsContent similaires pour les autres catégories */}
        </Tabs>

        <div className="mt-8 flex justify-center">
          <Button variant="outline" className="mr-2">
            Page précédente
          </Button>
          <Button variant="outline" className="mx-1">
            1
          </Button>
          <Button variant="outline" className="mx-1">
            2
          </Button>
          <Button variant="outline" className="mx-1">
            3
          </Button>
          <Button variant="outline" className="ml-2">
            Page suivante
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
