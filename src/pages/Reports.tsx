
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, FileText, Plus, Settings } from 'lucide-react';

const Reports = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <Helmet>
        <title>Reports | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Access standard reports or create custom ones</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Standard Reports Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="mr-2 h-5 w-5" />
                Standard Reports
              </CardTitle>
              <CardDescription>
                Access pre-built reports for common use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-muted-foreground">
                View standard reports for cases, users, activities, and more. These reports are pre-configured
                and ready to use.
              </p>
              <Button 
                variant="default" 
                onClick={() => navigate('/reports/standard')}
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                View Standard Reports
              </Button>
            </CardContent>
          </Card>
          
          {/* Custom Reports Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Custom Reports
              </CardTitle>
              <CardDescription>
                Build your own custom reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-muted-foreground">
                Create customized reports with the fields, filters, and visualizations of your choice.
                Save and share your reports with your team.
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/reports/new')}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Custom Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Reports;
