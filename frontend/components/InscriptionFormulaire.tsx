"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Footer from "@/components/footer";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
/**
 * InscriptionForm
 * ---------------
 * Front‑end registration form aligned with FastAPI endpoint `/users`.
 * Matches the database schema:
 *   CREATE TABLE users (
 *     id SERIAL PRIMARY KEY,
 *     username VARCHAR(100) UNIQUE NOT NULL,
 *     email    VARCHAR(255) UNIQUE NOT NULL,
 *     password_hash VARCHAR(255) NOT NULL,
 *     ...
 *   );
 */
export function InscriptionForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Create a new user account on FastAPI backend.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Impossible de créer le compte");
      }

      toast.success("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

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
                    <h1 className="text-2xl font-bold">Create your account</h1>
                    <p className="text-balance text-muted-foreground">
                      Sign up to join our platform
                    </p>
                  </div>

                  {/* Username */}
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="oumaima123"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="oumaima.elalami@usms.ac.ma"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {/* Error */}
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                  {/* Submit */}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating…" : "Sign up"}
                  </Button>

                  {/* Alternative login (placeholder) */}
                  <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                    <span className="relative z-10 bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>

                  {/* Social button placeholder */}
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
                      <span className="sr-only">Sign up with Google</span>
                    </Button>
                  </div>

                  {/* Login redirect */}
                  <div className="text-center text-sm">
                    Already have an account? {" "}
                    <a href="/login" className="underline underline-offset-4">
                      Login
                    </a>
                  </div>
                </div>
              </form>

              {/* ---------- IMAGE COLUMN ---------- */}
              <div className="relative hidden bg-muted md:flex justify-center items-center">
                <img
                  src="/loginimage.png"
                  alt="Signup illustration"
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
