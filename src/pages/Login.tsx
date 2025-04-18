
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { Lock, UserCheck, User, Mail, Key, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup, isAuthenticated } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get the redirect location from state, or default to /tasks
  const from = location.state?.from?.pathname || "/tasks";
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        navigate(from, { replace: true });
      } else {
        await signup(email, password);
        toast({
          title: "Account created",
          description: "Please check your email to verify your account",
        });
      }
    } catch (error: any) {
      toast({
        title: isLogin ? "Login Failed" : "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If already authenticated, redirect to tasks
  if (isAuthenticated) {
    navigate("/tasks", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-background">
      <div className="w-full max-w-md mx-auto">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-6 rounded-full">
              {isLogin ? 
                <UserCheck size={40} className="text-primary" /> : 
                <User size={40} className="text-primary" />
              }
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin 
              ? "Sign in to access your tasks" 
              : "Sign up to start managing your tasks"}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-card border border-border/40 rounded-xl shadow-card p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 h-11 font-medium shadow-lg hover:shadow-primary/25 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
              >
                {isLogin 
                  ? "Need an account? Sign up" 
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
