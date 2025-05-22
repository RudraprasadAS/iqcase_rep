
import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardFooter, CardHeader, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setLoginError("");
    
    try {
      const { error } = await login(data.email, data.password);
      
      if (error) {
        setLoginError(error.message);
        toast({
          title: "Login failed",
          description: error.message || "Please check your credentials and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login successful",
          description: "Welcome to Case Management System.",
        });
        
        // Redirect to the protected route the user was trying to access, or dashboard as default
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuperAdminLogin = async () => {
    setIsLoading(true);
    setLoginError("");
    
    try {
      const { error } = await login("admin@system.com", "Admin123!");
      
      if (error) {
        setLoginError("Super admin login failed: " + error.message);
        toast({
          title: "Super admin login failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Super admin login successful",
          description: "Welcome, System Administrator.",
        });
        
        // Always redirect super admin to dashboard
        navigate("/dashboard", { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Super admin login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
        <h2 className="text-2xl font-bold text-center">Log in</h2>
        <p className="text-center text-gray-500 mt-2">
          Welcome back! Please enter your details.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                {loginError}
              </div>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Link
                to="/auth/forgot-password"
                className="text-sm text-caseMgmt-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-caseMgmt-primary hover:bg-caseMgmt-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : "Login"}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">System Access</span>
            </div>
          </div>
          
          <Button 
            onClick={handleSuperAdminLogin} 
            className="mt-4 w-full bg-gray-800 hover:bg-gray-900 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accessing system...
              </>
            ) : "Login as System Administrator"}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center">
        <p className="text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link to="/auth/register" className="text-caseMgmt-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </>
  );
};

export default Login;
