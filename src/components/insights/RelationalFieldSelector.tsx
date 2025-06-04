
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { DataSource, DataField } from '@/types/insights';
import { Database, ChevronDown, ChevronRight, Search, Link, Folder, FolderOpen } from 'lucide-react';

interface RelationalFieldSelectorProps {
  dataSources: DataSource[];
  selectedDataSource: DataSource | null;
  selectedFields: string[];
  onDataSourceChange: (dataSource: DataSource | null) => void;
  onFieldsChange: (fields: string[]) => void;
}

interface RelatedTable {
  name: string;
  alias: string;
  fields: DataField[];
  relationshipPath: string;
}

export const RelationalFieldSelector = ({
  dataSources,
  selectedDataSource,
  selectedFields,
  onDataSourceChange,
  onFieldsChange
}: RelationalFieldSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['base']);
  const [relatedTables, setRelatedTables] = useState<RelatedTable[]>([]);

  // Auto-discover relationships when data source changes
  useEffect(() => {
    if (selectedDataSource) {
      discoverRelatedTables(selectedDataSource);
    } else {
      setRelatedTables([]);
    }
  }, [selectedDataSource]);

  const discoverRelatedTables = (dataSource: DataSource) => {
    const discovered: RelatedTable[] = [];
    
    // Process relationships from the data source configuration
    dataSource.relationships.forEach(rel => {
      // Find the target data source
      const targetDataSource = dataSources.find(ds => ds.table_name === rel.table);
      if (targetDataSource) {
        discovered.push({
          name: rel.table,
          alias: rel.label || rel.table,
          fields: targetDataSource.fields.map(field => ({
            ...field,
            name: `${rel.label || rel.table}.${field.name}` // Prefix with table alias
          })),
          relationshipPath: `${dataSource.table_name}.${rel.field} → ${rel.table}.${rel.target_field}`
        });
      }
    });

    // Add some common relationships based on naming conventions
    if (dataSource.table_name === 'cases') {
      // Look for user relationships
      const userDataSource = dataSources.find(ds => ds.table_name === 'users');
      if (userDataSource && !discovered.some(r => r.name === 'users')) {
        discovered.push({
          name: 'users',
          alias: 'submitted_user',
          fields: userDataSource.fields.map(field => ({
            ...field,
            name: `submitted_user.${field.name}`
          })),
          relationshipPath: 'cases.submitted_by → users.id'
        });

        discovered.push({
          name: 'users',
          alias: 'assigned_user',
          fields: userDataSource.fields.map(field => ({
            ...field,
            name: `assigned_user.${field.name}`
          })),
          relationshipPath: 'cases.assigned_to → users.id'
        });
      }

      // Look for category relationships
      const categoryDataSource = dataSources.find(ds => ds.table_name === 'case_categories');
      if (categoryDataSource) {
        discovered.push({
          name: 'case_categories',
          alias: 'category',
          fields: categoryDataSource.fields.map(field => ({
            ...field,
            name: `category.${field.name}`
          })),
          relationshipPath: 'cases.category_id → case_categories.id'
        });
      }
    }

    setRelatedTables(discovered);
  };

  const handleDataSourceChange = (value: string) => {
    const dataSource = dataSources.find(ds => ds.id === value) || null;
    onDataSourceChange(dataSource);
    // Clear selected fields when changing data source
    onFieldsChange([]);
  };

  const handleFieldToggle = (fieldName: string) => {
    const newFields = selectedFields.includes(fieldName)
      ? selectedFields.filter(f => f !== fieldName)
      : [...selectedFields, fieldName];
    onFieldsChange(newFields);
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName)
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    );
  };

  const getFieldTypeColor = (type: DataField['type']) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'number':
      case 'integer': return 'bg-green-100 text-green-800';
      case 'boolean': return 'bg-purple-100 text-purple-800';
      case 'timestamp': return 'bg-orange-100 text-orange-800';
      case 'uuid': return 'bg-gray-100 text-gray-800';
      case 'array': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterFields = (fields: DataField[]) => {
    if (!searchTerm) return fields;
    return fields.filter(field =>
      field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderFieldSection = (title: string, fields: DataField[], sectionKey: string, icon: React.ReactNode, relationshipPath?: string) => {
    const isExpanded = expandedSections.includes(sectionKey);
    const filteredFields = filterFields(fields);
    const selectedCount = filteredFields.filter(f => selectedFields.includes(f.name)).length;

    return (
      <Collapsible 
        open={isExpanded} 
        onOpenChange={() => toggleSection(sectionKey)}
      >
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-2 h-auto"
          >
            <div className="flex items-center gap-2">
              {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
              <span className="font-medium">{title}</span>
              {selectedCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedCount} selected
                </Badge>
              )}
            </div>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {relationshipPath && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded">
              <Link className="h-3 w-3" />
              <span>{relationshipPath}</span>
            </div>
          )}
          {filteredFields.map((field) => (
            <div key={field.name} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
              <Checkbox
                id={field.name}
                checked={selectedFields.includes(field.name)}
                onCheckedChange={() => handleFieldToggle(field.name)}
              />
              <label
                htmlFor={field.name}
                className="flex-1 cursor-pointer flex items-center justify-between text-sm"
              >
                <span>{field.label}</span>
                <Badge className={getFieldTypeColor(field.type)}>
                  {field.type}
                </Badge>
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Source & Fields
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Data Source Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Select Data Source</label>
          <Select 
            value={selectedDataSource?.id || ''} 
            onValueChange={handleDataSourceChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a table to start with" />
            </SelectTrigger>
            <SelectContent>
              {dataSources.map((dataSource) => (
                <SelectItem key={dataSource.id} value={dataSource.id}>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span>{dataSource.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDataSource && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Fields */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {/* Base Table Fields */}
                {renderFieldSection(
                  selectedDataSource.name,
                  selectedDataSource.fields,
                  'base',
                  <Database className="h-4 w-4" />
                )}

                {/* Related Tables */}
                {relatedTables.map((relatedTable, index) => 
                  renderFieldSection(
                    relatedTable.alias,
                    relatedTable.fields,
                    `related-${index}`,
                    <Link className="h-4 w-4" />,
                    relatedTable.relationshipPath
                  )
                )}
              </div>
            </ScrollArea>

            {/* Summary */}
            {selectedFields.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">
                  Selected Fields ({selectedFields.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedFields.map((fieldName) => {
                    // Find the field to get its label
                    const baseField = selectedDataSource.fields.find(f => f.name === fieldName);
                    const relatedField = relatedTables
                      .flatMap(t => t.fields)
                      .find(f => f.name === fieldName);
                    
                    const field = baseField || relatedField;
                    const displayName = field?.label || fieldName;
                    
                    return (
                      <Badge key={fieldName} variant="secondary" className="text-xs">
                        {displayName}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
