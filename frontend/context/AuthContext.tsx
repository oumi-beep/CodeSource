"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

// Define the shape of your context data
interface AuthContextType {
  authenticated: boolean
  setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
  user: any | null
  setUser: React.Dispatch<React.SetStateAction<any | null>>
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

// Default values for the context to avoid null errors
const defaultAuthContext: AuthContextType = {
  authenticated: false,
  setAuthenticated: () => {}, // empty function, will be overridden by provider
  user: null,
  setUser: () => {},
  login: async () => false,
  logout: () => {},
  isLoading: true,
}

// Create context with default values
const AuthContext = createContext<AuthContextType>(defaultAuthContext)

// Provider component to wrap your app
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken")
      const savedUser = localStorage.getItem("userProfile") || localStorage.getItem("user")

      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser)

          // Optional: Verify token is still valid by calling /users/me
          try {
            const response = await fetch("http://127.0.0.1:8000/users/me", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (response.ok) {
              const currentUser = await response.json()
              setUser(currentUser)
              setAuthenticated(true)

              // Update stored user data
              localStorage.setItem("userProfile", JSON.stringify(currentUser))
              localStorage.setItem("user", JSON.stringify(currentUser))
              localStorage.setItem("userEmail", currentUser.email || currentUser.username)
            } else {
              // Token is invalid, clear storage
              localStorage.removeItem("authToken")
              localStorage.removeItem("userProfile")
              localStorage.removeItem("user")
              localStorage.removeItem("userEmail")
            }
          } catch (error) {
            // If API call fails, still use stored data
            setUser(userData)
            setAuthenticated(true)
          }
        } catch (error) {
          console.error("Error parsing saved user:", error)
          // Clear invalid data
          localStorage.removeItem("authToken")
          localStorage.removeItem("userProfile")
          localStorage.removeItem("user")
          localStorage.removeItem("userEmail")
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Request token (FastAPI /token)
      const params = new URLSearchParams()
      params.append("username", username.trim())
      params.append("password", password)

      const tokenRes = await fetch("http://127.0.0.1:8000/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      })

      if (!tokenRes.ok) {
        setIsLoading(false)
        return false
      }

      const { access_token } = await tokenRes.json()
      if (!access_token) {
        setIsLoading(false)
        return false
      }

      // Persist the token for later API calls
      localStorage.setItem("authToken", access_token)

      // Fetch current user profile using the token
      const userRes = await fetch("http://127.0.0.1:8000/users/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })

      if (!userRes.ok) {
        setIsLoading(false)
        return false
      }

      const userData = await userRes.json()

      // Persist and propagate user
      localStorage.setItem("userProfile", JSON.stringify(userData))
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("userEmail", userData.email || userData.username)

      setUser(userData)
      setAuthenticated(true)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error("Login error:", error)
      setIsLoading(false)
      return false
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    setAuthenticated(false)
    localStorage.removeItem("authToken")
    localStorage.removeItem("userProfile")
    localStorage.removeItem("user")
    localStorage.removeItem("userEmail")
    router.push("/")
  }

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        setAuthenticated,
        user,
        setUser,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context easily
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
