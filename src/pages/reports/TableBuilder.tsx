
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, BarChart3, PieChart, LineChart } from 'lucide-react';

const TableBuilder = () => {
  return (
    <>
      <Helmet>
        <title>Table Builder | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Table Builder</h1>
          <p className="text-muted-foreground">Create custom data tables and visualizations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Table className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Data Table</h3>
              <p className="text-sm text-muted-foreground text-center">
                Create interactive data tables with sorting and filtering
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <BarChart3 className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Bar Chart</h3>
              <p className="text-sm text-muted-foreground text-center">
                Visualize data with customizable bar charts
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <PieChart className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Pie Chart</h3>
              <p className="text-sm text-muted-foreground text-center">
                Display proportional data with pie charts
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <LineChart className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Line Chart</h3>
              <p className="text-sm text-muted-foreground text-center">
                Track trends over time with line charts
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Select a visualization type above to start building your custom table or chart. 
              You can connect to any data source and apply filters, grouping, and aggregations.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default TableBuilder;
