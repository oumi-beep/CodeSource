"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Bot, User, Lightbulb, BookOpen, Briefcase, Code, Database, Server, Cpu } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Bonjour ! Je suis GenieusEnsa, votre assistant intelligent. Je vous guide à travers tout ce qui concerne l’ENSAKH (événements, clubs, départements, enseignants, etc.) et je réponds aussi à vos questions générales : compétences clés, entretiens,... Posez votre question, je suis là pour vous !",

    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Suggestions spécifiques à ENSAKH
  const suggestions = [
    "Donner la liste de tous les filières de'ENSAKH",
    "Peux-tu me donner des informations sur Dataverse ?",
    "Peux-tu me donner une description du club Codex à l’ENSAKH ?", "Quels sont les partenariats de l'ENSAKH ?",
    "Quelles sont toutes les questions les plus courantes posées lors d’un entretien en Data Analytics ?"
  ]

  // Fonction pour envoyer une requête au backend Python
  const handleSendMessage = async () => {
    if (input.trim() === "") return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      // Appel à l'API Python backend
      const token = localStorage.getItem("authToken")
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          history: messages
            .filter((msg) => msg.role !== "assistant" || msg.id !== "1")
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Désolé, je n'ai pas pu traiter votre demande.",
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Erreur lors de l'appel à l'API:", error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Désolé, une erreur s'est produite lors de la communication avec le serveur. Veuillez vérifier que le backend Python est en cours d'exécution sur le port 8000.",
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">GenieusEnsa – L’intelligence qui éclaire votre avenir</h1>
          <p className="text-slate-600 max-w-3xl">
            GenieusEnsa est votre assistant intelligent conçu pour vous guider dans l’univers de l’École Nationale des Sciences Appliquées de Khouribga.
            Il répond à toutes vos questions sur les <strong>filières</strong>, <strong>départements</strong>,<strong>clubs</strong>, <strong>événements</strong>, <strong>enseignants</strong>, <strong>partenariats</strong>, et <strong>statistiques</strong>.
            Mais il va encore plus loin : demandez-lui les <strong>compétences requises</strong> dans un domaine ou des <strong>conseils d'entretien</strong>.
            Quelle que soit votre question, GenieusEnsa vous apporte une réponse claire et précise.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-violet-500" />
                Suggestions
              </h2>

              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2 px-3 whitespace-normal break-words"
                    onClick={() => {
                      setInput(suggestion)
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Catégories d'informations</h3>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setInput("Tous les événements")}
                      className="text-sm text-violet-600 hover:text-violet-800 flex items-center gap-2 w-full text-left"
                    >
                      <BookOpen className="h-4 w-4" />
                      Événements
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setInput("Tous les clubs")}
                      className="text-sm text-violet-600 hover:text-violet-800 flex items-center gap-2 w-full text-left"
                    >
                      <Briefcase className="h-4 w-4" />
                      Clubs étudiants
                    </button>
                  </li>

                  <li>
                    <button
                      onClick={() => setInput("Tous les départements")}
                      className="text-sm text-violet-600 hover:text-violet-800 flex items-center gap-2 w-full text-left"
                    >
                      <Code className="h-4 w-4" />
                      Départements
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setInput("Quelles sont les compétences nécessaires en Machine Learning ?")}
                      className="text-sm text-violet-600 hover:text-violet-800 flex items-center gap-2 w-full text-left"
                    >
                      <Cpu className="h-4 w-4" />
                      Compétences en Machine Learning
                    </button>
                  </li>

                </ul>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col overflow-hidden">
              <CardContent className="flex flex-col flex-1 p-0 min-h-0">
                {/* Zone des messages avec scroll */}
                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${message.role === "user" ? "bg-violet-600 text-white" : "bg-white border border-slate-200"
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === "assistant" && <Bot className="h-5 w-5 text-violet-500 mt-1" />}
                          <div className="flex-1">
                            <div
                              className="whitespace-pre-line prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: message.content
                                  .replace(
                                    /### (.*?)(\n|$)/g,
                                    '<h3 class="text-lg font-semibold text-slate-800 mt-4 mb-2">$1</h3>',
                                  )
                                  .replace(
                                    /## (.*?)(\n|$)/g,
                                    '<h2 class="text-xl font-bold text-slate-800 mt-6 mb-3">$1</h2>',
                                  )
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
                                  .replace(/\* (.*?)(\n|$)/g, '<li class="ml-4 list-disc mb-1">$1</li>')
                                  .replace(/- (.*?)(\n|$)/g, '<li class="ml-4 list-disc mb-1">$1</li>')
                                  .replace(/(\n\n)/g, "<br><br>")
                                  .replace(/(\n)/g, "<br>"),
                              }}
                            />
                          </div>
                          {message.role === "user" && <User className="h-5 w-5 text-white mt-1" />}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Animation de chargement */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-4 bg-white border border-slate-200">
                        <div className="flex items-center gap-2">
                          <Bot className="h-5 w-5 text-violet-500" />
                          <div className="flex space-x-2">
                            <div
                              className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                              style={{ animationDelay: "600ms" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Barre d'entrée */}
                <div className="p-4 border-t border-slate-200">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSendMessage()
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Posez votre question sur l'ENSAKH..."
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || input.trim() === ""}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Code className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold">Départements</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    Découvrez les différents départements de l'ENSAKH, leurs filières et leurs enseignants.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setInput("Quels sont tous les départements ?")}
                  >
                    Explorer
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-100 p-2 rounded-lg">
                      <Database className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold">Événements</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    Explorez tous les événements organisés par l'ENSAKH et participez à la vie étudiante.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setInput("Montre-moi tous les événements")}
                  >
                    Explorer
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-amber-100 p-2 rounded-lg">
                      <Server className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="font-semibold">Clubs</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    Découvrez tous les clubs étudiants de l'ENSAKH et trouvez celui qui vous correspond.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setInput("Liste de tous les clubs")}
                  >
                    Explorer
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
