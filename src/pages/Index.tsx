
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FileText, Users, BarChart, Shield, UserCheck, Plus } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Case Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Streamline your case management process with our comprehensive platform
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/citizen/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <UserCheck className="mr-2 h-5 w-5" />
                Citizen Portal
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button size="lg" variant="outline">
                <Shield className="mr-2 h-5 w-5" />
                Staff Login
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Citizen Portal */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <UserCheck className="mr-2 h-6 w-6" />
                Citizen Portal
              </CardTitle>
              <CardDescription className="text-blue-600">
                Submit and track your cases easily
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit new cases
                </div>
                <div className="flex items-center text-sm text-blue-700">
                  <FileText className="mr-2 h-4 w-4" />
                  Track case progress
                </div>
                <div className="flex items-center text-sm text-blue-700">
                  <Users className="mr-2 h-4 w-4" />
                  Communicate with staff
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <Link to="/citizen/dashboard" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Access Citizen Portal
                  </Button>
                </Link>
                <Link to="/auth/register" className="block">
                  <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                    Create Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Staff Portal */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-6 w-6" />
                Staff Portal
              </CardTitle>
              <CardDescription>
                Manage cases and system administration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="mr-2 h-4 w-4" />
                  Case management
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <BarChart className="mr-2 h-4 w-4" />
                  Analytics & reporting
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="mr-2 h-4 w-4" />
                  User administration
                </div>
              </div>
              <div className="mt-6">
                <Link to="/auth/login" className="block">
                  <Button variant="outline" className="w-full">
                    Staff Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Easy Case Submission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Citizens can easily submit cases with detailed information, attachments, and location data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Real-time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track case progress in real-time with status updates and SLA monitoring.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Secure Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Secure messaging between citizens and staff with full audit trails.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
