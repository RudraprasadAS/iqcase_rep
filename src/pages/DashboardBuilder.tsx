
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

const DashboardBuilder = () => {
  return (
    <>
      <Helmet>
        <title>Dashboard Builder | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Builder</h1>
            <p className="text-muted-foreground">Create interactive dashboards from your reports</p>
          </div>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <Construction className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Dashboard Builder Coming Soon</h3>
            <p className="text-muted-foreground">
              This feature is currently under development. You'll be able to create interactive dashboards here.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DashboardBuilder;
