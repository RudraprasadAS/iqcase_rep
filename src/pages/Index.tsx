
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-caseMgmt-background">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-caseMgmt-primary">Case Management System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/auth/login")}
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate("/auth/register")}
                className="bg-caseMgmt-primary hover:bg-caseMgmt-primary/90"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="md:flex md:items-center md:justify-between">
          <div className="md:w-1/2 md:pr-12">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Modern Case Management System
            </h1>
            <p className="mt-6 max-w-3xl text-xl text-gray-500">
              A versatile platform designed for government agencies and organizations to efficiently track,
              manage, and resolve service requests, complaints, applications, and more.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Button 
                onClick={() => navigate("/auth/register")}
                size="lg" 
                className="bg-caseMgmt-primary hover:bg-caseMgmt-primary/90"
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate("/auth/login")}
              >
                Log in to dashboard
              </Button>
            </div>
          </div>
          <div className="mt-12 md:mt-0 md:w-1/2">
            <div className="rounded-lg bg-white p-6 shadow-xl border border-gray-200">
              <div className="space-y-4">
                <div className="h-2 w-20 bg-caseMgmt-primary rounded"></div>
                <h2 className="text-2xl font-bold">Flexible and Adaptable</h2>
                <p className="text-gray-600">
                  Designed to serve multiple use cases from 311 service requests 
                  to permit applications, grant management, and ombudsman workflows.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <FeatureItem title="Case Tracking" description="Track case progress, statuses and history" />
                  <FeatureItem title="Secure Access" description="Role-based access control for users" />
                  <FeatureItem title="Notification System" description="Automated alerts for updates and deadlines" />
                  <FeatureItem title="Advanced Reports" description="Analytics and insights on case data" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ title, description }: { title: string; description: string }) => (
  <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
    <h3 className="font-medium">{title}</h3>
    <p className="text-sm text-gray-600 mt-1">{description}</p>
  </div>
);

export default Index;
