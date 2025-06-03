
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, User, Loader2, Search, Settings } from "lucide-react";
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
      navigate("/auth/login");
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
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-blue-600">Case Management</h1>
      </div>

      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>
        
        <NotificationBell />
        
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="flex items-center space-x-2"
            onClick={handleLogout}
            disabled={isLoading}
          >
            <User className="h-5 w-5" />
            <span className="hidden md:inline-block">
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
