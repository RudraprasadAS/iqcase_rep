
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Dashboards = () => {
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Executive Overview</CardTitle>
              <p className="text-sm text-muted-foreground">
                High-level metrics and KPIs
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coming soon - dashboard functionality will be implemented here
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dashboards;
