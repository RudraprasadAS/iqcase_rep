
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/notifications/NotificationBell";

const Navbar = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the system.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 justify-between font-inter">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/ee388e32-d054-4367-b2ac-0dd3512cb8fd.png" 
          alt="CivIQ Logo" 
          className="w-8 h-8 mr-2"
        />
        <h1 className="text-xl font-semibold text-gray-900 font-inter">CivIQ</h1>
      </div>

      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>
        
        <NotificationBell />
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="flex items-center space-x-2 font-inter"
            onClick={handleLogout}
            disabled={isLoading}
          >
            <User className="h-5 w-5" />
            <span className="hidden md:inline-block font-inter">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `Logout (${user?.email})`
              )}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
