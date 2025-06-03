
import { Outlet } from "react-router-dom";
import CitizenNavbar from "./CitizenNavbar";
import CitizenSidebar from "./CitizenSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";
import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CitizenLayout = () => {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <CitizenSidebar />
        <SidebarInset>
          <CitizenNavbar />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
          
          {/* Floating Feedback Button */}
          <div className="fixed bottom-6 right-6 z-50">
            {showFeedback ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-300"
                  onClick={() => setShowFeedback(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <FeedbackWidget 
                  context="portal"
                  onSubmit={() => setShowFeedback(false)}
                />
              </div>
            ) : (
              <Button
                onClick={() => setShowFeedback(true)}
                className="rounded-full h-12 w-12 bg-blue-600 hover:bg-blue-700 shadow-lg"
                size="icon"
              >
                <MessageSquare className="h-6 w-6" />
              </Button>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CitizenLayout;
