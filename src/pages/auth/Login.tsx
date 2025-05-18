
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      toast({
        title: "Login successful",
        description: "You have been logged in successfully.",
      });
      
      navigate("/dashboard");
    } catch (err) {
      setError("An error occurred during login");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError("An error occurred during Google sign-in");
      console.error("Google sign-in error:", err);
    }
  };

  return (
    <CardContent className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl font-semibold text-center">Login</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/auth/forgot-password"
              className="text-sm text-caseMgmt-secondary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        
        <Button
          type="submit"
          className="w-full bg-caseMgmt-primary hover:bg-caseMgmt-primary/90"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>
      
      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>
      
      <Button
        type="button"
        variant="outline"
        className="w-full mt-4 flex items-center justify-center gap-2"
        onClick={handleGoogleSignIn}
      >
        <FcGoogle className="h-5 w-5" />
        Sign in with Google
      </Button>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Don't have an account?{" "}
          <Link
            to="/auth/register"
            className="text-caseMgmt-secondary font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </CardContent>
  );
};

export default Login;
