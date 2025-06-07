
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { DashboardBuilder } from '@/components/dashboards/DashboardBuilder';

const Dashboards = () => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [savedDashboards, setSavedDashboards] = useState<any[]>([]);

  const handleSaveDashboard = (items: any[]) => {
    // In a real app, this would save to the database
    const newDashboard = {
      id: Date.now().toString(),
      name: `Dashboard ${savedDashboards.length + 1}`,
      items: items,
      createdAt: new Date().toISOString()
    };
    
    setSavedDashboards([...savedDashboards, newDashboard]);
    setShowBuilder(false);
  };

  if (showBuilder) {
    return (
      <>
        <Helmet>
          <title>Dashboard Builder | Case Management</title>
        </Helmet>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Builder</h1>
              <p className="text-muted-foreground">
                Create custom dashboards with reports and metrics
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowBuilder(false)}>
              Back to Dashboards
            </Button>
          </div>

          <DashboardBuilder onSave={handleSaveDashboard} />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboards | Case Management</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboards</h1>
            <p className="text-muted-foreground">
              Create and manage custom dashboards with your reports
            </p>
          </div>
          <Button onClick={() => setShowBuilder(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedDashboards.length > 0 ? (
            savedDashboards.map((dashboard) => (
              <Card key={dashboard.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {dashboard.items.length} items • Created {new Date(dashboard.createdAt).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Executive Overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  High-level metrics and KPIs
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Sample dashboard - use the builder to create your own!
                </p>
                <Button variant="outline" size="sm" onClick={() => setShowBuilder(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboards;
