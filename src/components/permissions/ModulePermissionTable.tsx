
import React, { useState } from "react";
import { 
  Table, 
  TableHeader, 
  TableHead, 
  TableBody, 
  TableRow,
  TableCell 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moduleRegistry } from "@/config/moduleRegistry";
import { FrontendModule, ModuleScreen, ModuleField } from "@/types/moduleRegistry";

interface Permission {
  id: string;
  role_id: string;
  module_name: string;
  field_name: string | null;
  can_view: boolean;
  can_edit: boolean;
}

interface ModulePermissionTableProps {
  selectedRoleId: string;
  permissions?: Permission[];
  getEffectivePermission: (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit'
  ) => boolean;
  handlePermissionChange: (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit',
    checked: boolean
  ) => void;
  showSelectAll: boolean;
}

export const ModulePermissionTable: React.FC<ModulePermissionTableProps> = ({
  selectedRoleId,
  permissions,
  getEffectivePermission,
  handlePermissionChange,
  showSelectAll
}) => {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedScreens, setExpandedScreens] = useState<Record<string, boolean>>({});

  const toggleModule = (moduleName: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  const toggleScreen = (moduleScreen: string) => {
    setExpandedScreens(prev => ({
      ...prev,
      [moduleScreen]: !prev[moduleScreen]
    }));
  };

  const handleModuleSelectAll = (moduleName: string, type: 'view' | 'edit', checked: boolean) => {
    // Apply to module level
    handlePermissionChange(selectedRoleId, moduleName, null, type, checked);
    
    // Apply to all screens and fields in this module
    const module = moduleRegistry.modules.find(m => m.name === moduleName);
    if (module) {
      module.screens.forEach(screen => {
        handlePermissionChange(selectedRoleId, moduleName, screen.name, type, checked);
        
        screen.fields.forEach(field => {
          handlePermissionChange(selectedRoleId, moduleName, `${screen.name}.${field.name}`, type, checked);
        });
      });
    }
  };

  const handleScreenSelectAll = (moduleName: string, screenName: string, type: 'view' | 'edit', checked: boolean) => {
    // Apply to screen level
    handlePermissionChange(selectedRoleId, moduleName, screenName, type, checked);
    
    // Apply to all fields in this screen
    const module = moduleRegistry.modules.find(m => m.name === moduleName);
    const screen = module?.screens.find(s => s.name === screenName);
    
    if (screen) {
      screen.fields.forEach(field => {
        handlePermissionChange(selectedRoleId, moduleName, `${screenName}.${field.name}`, type, checked);
      });
    }
  };

  const renderModuleRow = (module: FrontendModule) => {
    const isExpanded = expandedModules[module.name];
    const viewChecked = getEffectivePermission(selectedRoleId, module.name, null, 'view');
    const editChecked = getEffectivePermission(selectedRoleId, module.name, null, 'edit');

    return (
      <React.Fragment key={module.name}>
        <TableRow className="bg-blue-50 border-b-2">
          <TableCell className="font-semibold">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleModule(module.name)}
                className="p-1 h-6 w-6"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <span className="text-blue-900">📁 {module.label}</span>
            </div>
          </TableCell>
          <TableCell className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Checkbox
                checked={viewChecked}
                onCheckedChange={(checked) => 
                  handlePermissionChange(selectedRoleId, module.name, null, 'view', checked as boolean)
                }
              />
              {showSelectAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleModuleSelectAll(module.name, 'view', !viewChecked)}
                  className="text-xs"
                >
                  All
                </Button>
              )}
            </div>
          </TableCell>
          <TableCell className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Checkbox
                checked={editChecked}
                onCheckedChange={(checked) => 
                  handlePermissionChange(selectedRoleId, module.name, null, 'edit', checked as boolean)
                }
              />
              {showSelectAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleModuleSelectAll(module.name, 'edit', !editChecked)}
                  className="text-xs"
                >
                  All
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>

        {isExpanded && module.screens.map(screen => renderScreenRow(module, screen))}
      </React.Fragment>
    );
  };

  const renderScreenRow = (module: FrontendModule, screen: ModuleScreen) => {
    const screenKey = `${module.name}.${screen.name}`;
    const isExpanded = expandedScreens[screenKey];
    const viewChecked = getEffectivePermission(selectedRoleId, module.name, screen.name, 'view');
    const editChecked = getEffectivePermission(selectedRoleId, module.name, screen.name, 'edit');

    return (
      <React.Fragment key={screenKey}>
        <TableRow className="bg-green-50">
          <TableCell className="pl-12">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleScreen(screenKey)}
                className="p-1 h-6 w-6"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <span className="text-green-900">📄 {screen.label}</span>
              <span className="text-xs text-muted-foreground">({screen.path})</span>
            </div>
          </TableCell>
          <TableCell className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Checkbox
                checked={viewChecked}
                onCheckedChange={(checked) => 
                  handlePermissionChange(selectedRoleId, module.name, screen.name, 'view', checked as boolean)
                }
              />
              {showSelectAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleScreenSelectAll(module.name, screen.name, 'view', !viewChecked)}
                  className="text-xs"
                >
                  All
                </Button>
              )}
            </div>
          </TableCell>
          <TableCell className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Checkbox
                checked={editChecked}
                onCheckedChange={(checked) => 
                  handlePermissionChange(selectedRoleId, module.name, screen.name, 'edit', checked as boolean)
                }
              />
              {showSelectAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleScreenSelectAll(module.name, screen.name, 'edit', !editChecked)}
                  className="text-xs"
                >
                  All
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>

        {isExpanded && screen.fields.map(field => renderFieldRow(module, screen, field))}
      </React.Fragment>
    );
  };

  const renderFieldRow = (module: FrontendModule, screen: ModuleScreen, field: ModuleField) => {
    const fieldKey = `${screen.name}.${field.name}`;
    const viewChecked = getEffectivePermission(selectedRoleId, module.name, fieldKey, 'view');
    const editChecked = getEffectivePermission(selectedRoleId, module.name, fieldKey, 'edit');

    return (
      <TableRow key={fieldKey} className="bg-gray-50">
        <TableCell className="pl-20">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">🔸 {field.label}</span>
            <span className="text-xs text-muted-foreground">({field.type})</span>
            {field.required && <span className="text-xs text-red-500">*</span>}
          </div>
        </TableCell>
        <TableCell className="text-center">
          <Checkbox
            checked={viewChecked}
            onCheckedChange={(checked) => 
              handlePermissionChange(selectedRoleId, module.name, fieldKey, 'view', checked as boolean)
            }
          />
        </TableCell>
        <TableCell className="text-center">
          <Checkbox
            checked={editChecked}
            onCheckedChange={(checked) => 
              handlePermissionChange(selectedRoleId, module.name, fieldKey, 'edit', checked as boolean)
            }
          />
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="min-w-[300px]">Module / Screen / Field</TableHead>
            <TableHead className="text-center w-[120px]">View</TableHead>
            <TableHead className="text-center w-[120px]">Edit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {moduleRegistry.modules.map(module => renderModuleRow(module))}
        </TableBody>
      </Table>
    </div>
  );
};
