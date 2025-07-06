
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }
      
      setIsSent(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "An error occurred while sending the reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CardContent className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl font-semibold text-center">Forgot Password</CardTitle>
        <CardDescription className="text-center">
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>
      
      {!isSent ? (
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
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-caseMgmt-primary hover:bg-caseMgmt-primary/90"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      ) : (
        <div className="mt-4 text-center space-y-4">
          <div className="bg-green-50 text-green-700 p-4 rounded-md">
            Password reset link has been sent to your email.
          </div>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => {
              setIsSent(false);
              setEmail("");
              setError("");
            }}
          >
            Send Another Email
          </Button>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Remember your password?{" "}
          <Link
            to="/auth/login"
            className="text-caseMgmt-secondary font-medium hover:underline"
          >
            Back to login
          </Link>
        </p>
      </div>
    </CardContent>
  );
};

export default ForgotPassword;
