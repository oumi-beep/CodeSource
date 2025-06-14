"use client";
import type React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * LoginForm
 * ----------
 * Updated to work with authentication middleware by setting HttpOnly cookies.
 *
 * Changes:
 * 1. After successful login, sends token to /api/auth to set HttpOnly cookie
 * 2. Redirects to the original page user was trying to access (if any)
 * 3. Maintains existing localStorage functionality for client-side state
 */
export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { setAuthenticated, setUser: setUserCtx } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  // Local component state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Handle form submission: obtain JWT token, set cookie, then fetch user profile.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Request token (FastAPI /token)
      const params = new URLSearchParams();
      params.append("username", username.trim());
      params.append("password", password);

      const tokenRes = await fetch("http://127.0.0.1:8000/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({}));
        throw new Error(errData.detail || "Échec de la connexion");
      }

      const { access_token, token_type } = await tokenRes.json();
      if (!access_token) throw new Error("Jeton manquant dans la réponse du serveur");

      // 2. Set HttpOnly cookie via our API route
      const cookieRes = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: access_token }),
      });

      if (!cookieRes.ok) {
        throw new Error("Erreur lors de la configuration de l'authentification");
      }

      // 3. Persist the token for client-side API calls (optional, for backward compatibility)
      localStorage.setItem("authToken", access_token);

      // 4. Fetch current user profile using the token
      const userRes = await fetch("http://127.0.0.1:8000/users/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!userRes.ok) {
        throw new Error("Impossible de récupérer le profil utilisateur");
      }

      const userData = await userRes.json();
      // Persist and propagate user
      localStorage.setItem("userProfile", JSON.stringify(userData));
      setUserCtx?.(userData); // depends on AuthContext implementation

      setAuthenticated?.(true);

      // Redirect to the original page or home
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className={cn("w-full max-w-2xl p-4", className)} {...props}>
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="grid p-0 md:grid-cols-2">
              {/* ---------- FORM COLUMN ---------- */}
              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">Welcome back</h1>
                    <p className="text-balance text-muted-foreground">
                      Login to your Internship Finder account
                    </p>
                  </div>

                  {/* Username / email */}
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username or Email</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="your.id@usms.ac.ma"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="#"
                        className="ml-auto text-sm underline-offset-2 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {/* Error message */}
                  {error && <p className="text-red-600 text-sm">{error}</p>}

                  {/* Submit */}
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Connexion…" : "Se connecter"}
                  </Button>

                  {/* Alternative login (optional) */}
                  <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                    <span className="relative z-10 bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>

                  {/* Social login placeholder */}
                  <div className="flex justify-center">
                    <Button variant="outline">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                      >
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="sr-only">Login with Google</span>
                    </Button>
                  </div>

                  {/* Sign‑up link */}
                  <div className="text-center text-sm">
                    Don't have an account? {" "}
                    <a href="/inscription" className="underline underline-offset-4">
                      Sign up
                    </a>
                  </div>
                </div>
              </form>

              {/* ---------- IMAGE COLUMN ---------- */}
              <div className="relative hidden bg-muted md:flex justify-center items-center">
                <img
                  src="/loginimage.png"
                  alt="Login illustration"
                  className="max-w-full max-h-full dark:brightness-[0.9] dark:grayscale"
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
            By clicking continue, you agree to our <a href="#">Terms of Service</a> and {" "}
            <a href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

