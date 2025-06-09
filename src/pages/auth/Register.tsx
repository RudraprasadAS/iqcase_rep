
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Eye, EyeOff } from "lucide-react";

const Register = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setIsLoading(true);

    try {
      const { user, error } = await register(formData.email, formData.password);
      
      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Registration successful",
          description: "Your account has been created successfully. You can now sign in.",
        });
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during registration");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      // This will be implemented when Google OAuth is configured
      toast({
        title: "Google Sign-Up",
        description: "Google OAuth needs to be configured in Supabase settings.",
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Google Sign-Up failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex font-inter bg-white">
      {/* Left side - Quote section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-50 relative">
        <div className="flex flex-col justify-center w-full px-16">
          <div className="max-w-lg">
            <div className="text-6xl text-gray-300 mb-4">"</div>
            <blockquote className="text-xl font-light text-gray-900 mb-8 leading-relaxed">
              Join thousands of organizations streamlining their case management with our powerful platform.
            </blockquote>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">CM</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Case Management Team</div>
                <div className="text-gray-500 text-sm">#efficiency #organization</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center mb-12">
            <img 
              src="/lovable-uploads/ee388e32-d054-4367-b2ac-0dd3512cb8fd.png" 
              alt="Case Management Logo" 
              className="w-8 h-8 mr-2"
            />
            <h1 className="text-2xl font-light text-black">Case Management</h1>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold text-black mb-2">
              Create account
            </h2>
            <p className="text-gray-600 font-light text-sm">
              Sign up for your account
            </p>
          </div>

          {/* SSO Login Buttons */}
          <div className="space-y-3 mb-6">
            <Button 
              variant="outline" 
              className="w-full h-10 font-normal text-sm border-gray-300 hover:border-gray-400 hover:bg-gray-50 justify-start px-4"
              onClick={handleGoogleSignUp}
            >
              <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-10 font-normal text-sm border-gray-300 hover:border-gray-400 hover:bg-gray-50 justify-start px-4"
            >
              <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.15 2.587L23.15 21.413L0.85 21.413L0.85 2.587L23.15 2.587ZM21.15 4.587L2.85 4.587L2.85 19.413L21.15 19.413L21.15 4.587ZM11.109 14.558L11.109 9.442L15.858 9.442L15.858 8.092L9.759 8.092L9.759 15.908L15.858 15.908L15.858 14.558L11.109 14.558Z"/>
              </svg>
              Continue with Microsoft
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-10 font-normal text-sm border-gray-300 hover:border-gray-400 hover:bg-gray-50 justify-start px-4"
            >
              <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Continue with SSO
            </Button>
          </div>

          <div className="relative mb-6">
            <Separator className="bg-gray-200" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-2 text-xs text-gray-500">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm font-normal text-gray-700">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="h-10 font-normal border-gray-300 focus:border-black focus:ring-1 focus:ring-black text-sm"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-normal text-gray-700">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="h-10 font-normal border-gray-300 focus:border-black focus:ring-1 focus:ring-black text-sm"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-normal text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-10 pr-10 font-normal border-gray-300 focus:border-black focus:ring-1 focus:ring-black text-sm"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-sm font-normal text-gray-700">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="h-10 pr-10 font-normal border-gray-300 focus:border-black focus:ring-1 focus:ring-black text-sm"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-10 bg-black hover:bg-gray-800 text-white font-normal text-sm mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : "Create Account"}
            </Button>
          </form>
          
          <div className="text-center mt-6">
            <span className="text-sm text-gray-600">
              Already have an account?
            </span>
            <Link
              to="/"
              className="ml-1 text-sm text-black hover:underline font-medium"
            >
              Sign In
            </Link>
          </div>

          <div className="text-center mt-8">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our{' '}
              <a href="#" className="underline hover:text-gray-700">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="underline hover:text-gray-700">Privacy Policy</a>
              , and to receive periodic emails with updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
