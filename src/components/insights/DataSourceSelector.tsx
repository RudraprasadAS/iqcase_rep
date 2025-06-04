
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DataSource } from '@/types/insights';
import { Database, Table, Link } from 'lucide-react';

interface DataSourceSelectorProps {
  dataSources: DataSource[];
  selectedDataSource: DataSource | null;
  onDataSourceChange: (dataSource: DataSource | null) => void;
}

export const DataSourceSelector = ({
  dataSources,
  selectedDataSource,
  onDataSourceChange
}: DataSourceSelectorProps) => {
  const handleDataSourceChange = (value: string) => {
    const dataSource = dataSources.find(ds => ds.id === value) || null;
    onDataSourceChange(dataSource);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Source
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select 
          value={selectedDataSource?.id || ''} 
          onValueChange={handleDataSourceChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a data source" />
          </SelectTrigger>
          <SelectContent>
            {dataSources.map((dataSource) => (
              <SelectItem key={dataSource.id} value={dataSource.id}>
                <div className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  <span>{dataSource.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedDataSource && (
          <div className="space-y-3">
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">
                {selectedDataSource.description}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Available Fields</h4>
              <div className="flex flex-wrap gap-1">
                {selectedDataSource.fields.map((field) => (
                  <Badge key={field.name} variant="secondary" className="text-xs">
                    {field.label} ({field.type})
                  </Badge>
                ))}
              </div>
            </div>

            {selectedDataSource.relationships.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Link className="h-4 w-4" />
                  Relationships
                </h4>
                <div className="space-y-1">
                  {selectedDataSource.relationships.map((rel, index) => (
                    <div key={index} className="text-xs text-muted-foreground">
                      {rel.label} → {rel.table}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
