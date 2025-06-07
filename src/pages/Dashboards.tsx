
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { DashboardBuilder } from '@/components/dashboards/DashboardBuilder';

interface SavedDashboard {
  id: string;
  name: string;
  items: any[];
  createdAt: string;
}

const Dashboards = () => {
  const navigate = useNavigate();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<SavedDashboard | null>(null);
  const [savedDashboards, setSavedDashboards] = useState<SavedDashboard[]>([]);

  const handleSaveDashboard = (dashboardName: string, items: any[]) => {
    if (editingDashboard) {
      // Update existing dashboard
      setSavedDashboards(dashboards => 
        dashboards.map(d => 
          d.id === editingDashboard.id 
            ? { ...d, name: dashboardName, items }
            : d
        )
      );
      setEditingDashboard(null);
    } else {
      // Create new dashboard
      const newDashboard: SavedDashboard = {
        id: Date.now().toString(),
        name: dashboardName,
        items: items,
        createdAt: new Date().toISOString()
      };
      setSavedDashboards([...savedDashboards, newDashboard]);
    }
    
    setShowBuilder(false);
  };

  const handleViewDashboard = (dashboard: SavedDashboard) => {
    // For now, show the dashboard in builder mode (read-only could be implemented later)
    setEditingDashboard(dashboard);
    setShowBuilder(true);
  };

  const handleEditDashboard = (dashboard: SavedDashboard) => {
    setEditingDashboard(dashboard);
    setShowBuilder(true);
  };

  const handleDeleteDashboard = (dashboardId: string) => {
    setSavedDashboards(dashboards => dashboards.filter(d => d.id !== dashboardId));
  };

  const handleCreateNew = () => {
    setEditingDashboard(null);
    setShowBuilder(true);
  };

  const handleBackToDashboards = () => {
    setShowBuilder(false);
    setEditingDashboard(null);
  };

  if (showBuilder) {
    return (
      <>
        <Helmet>
          <title>{editingDashboard ? 'Edit Dashboard' : 'Dashboard Builder'} | Case Management</title>
        </Helmet>
        
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">
                {editingDashboard ? 'Edit Dashboard' : 'Dashboard Builder'}
              </h1>
              <p className="text-muted-foreground">
                {editingDashboard ? `Editing: ${editingDashboard.name}` : 'Create custom dashboards with reports and metrics'}
              </p>
            </div>
            <Button variant="outline" onClick={handleBackToDashboards}>
              Back to Dashboards
            </Button>
          </div>

          <DashboardBuilder 
            onSave={handleSaveDashboard}
            initialDashboard={editingDashboard}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboards | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboards</h1>
            <p className="text-muted-foreground">
              Create and manage custom dashboards with your reports
            </p>
          </div>
          <Button onClick={handleCreateNew}>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewDashboard(dashboard)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditDashboard(dashboard)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteDashboard(dashboard.id)}
                    >
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
                <Button variant="outline" size="sm" onClick={handleCreateNew}>
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
