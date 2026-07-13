import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, LogIn, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/admin", { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:block relative">
        <img
          src="https://images.unsplash.com/photo-1768775517205-7f4bc1b3f771?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwyfHxhZnJpY2FuJTIwYWdyaWN1bHR1cmUlMjBmaWVsZCUyMHN1bnNldHxlbnwwfHx8fDE3ODM5NTU4ODN8MA&ixlib=rb-4.1.0&q=85"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#08160c]/80" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <Logo inverted size={48} />
          <p className="mt-6 font-heading text-2xl font-semibold max-w-sm leading-snug">
            Back-office STMP Agri
          </p>
          <p className="mt-2 text-white/70 max-w-sm">
            Gérez vos produits, actualités, réalisations et demandes clients en toute simplicité.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size={44} />
          </div>
          <Card className="p-8 border-border rounded-2xl">
            <h1 className="font-heading text-2xl font-bold">Connexion administrateur</h1>
            <p className="text-sm text-muted-foreground mt-1">Accédez à votre espace de gestion.</p>

            <form onSubmit={submit} className="mt-8 space-y-5" data-testid="admin-login-form">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email" className="mt-1.5" placeholder="admin@stmpagri.ci" />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" className="mt-1.5" placeholder="••••••••" />
              </div>
              {error && (
                <p className="text-sm text-destructive" data-testid="login-error">{error}</p>
              )}
              <Button type="submit" disabled={loading} data-testid="login-submit" className="w-full bg-[#0E7A3A] hover:bg-[#0b632f] text-white">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />}
                Se connecter
              </Button>
            </form>

            <Link to="/" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#0E7A3A]">
              <ArrowLeft className="h-4 w-4" /> Retour au site
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
