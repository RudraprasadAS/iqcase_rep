
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Bell, Search, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
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
    }
  };

  const handleLoginClick = () => {
    navigate("/auth/login");
  };

  return (
    <header className="bg-white border-b border-caseMgmt-border h-16 flex items-center px-4">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={toggleSidebar}
        className="mr-4"
      >
        <Menu className="w-5 h-5" />
      </Button>

      <div className="mr-4 flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search cases, users, or documents..."
            className="pl-8 py-2 pr-4 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-caseMgmt-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2">
          {user ? (
            <Button
              variant="ghost"
              className="flex items-center space-x-2"
              onClick={handleLogout}
            >
              <User className="h-5 w-5" />
              <span className="hidden md:inline-block">
                {user.email === 'superadmin@example.com' 
                  ? 'Logout (Super Admin)' 
                  : `Logout (${user.email})`}
              </span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="flex items-center space-x-2"
              onClick={handleLoginClick}
            >
              <User className="h-5 w-5" />
              <span className="hidden md:inline-block">Login</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
