
import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Save, X, RotateCcw } from 'lucide-react';
import { useDashboardLayout, LayoutItem } from '@/hooks/useDashboardLayout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardItem {
  id: string;
  type: 'report' | 'metric' | 'chart';
  title: string;
  content: React.ReactNode;
}

interface ResizableDashboardProps {
  dashboardId: string;
  items: DashboardItem[];
  onItemsChange?: (items: DashboardItem[]) => void;
}

export const ResizableDashboard: React.FC<ResizableDashboardProps> = ({
  dashboardId,
  items,
  onItemsChange
}) => {
  const {
    savedLayout,
    isLoading,
    isEditMode,
    setIsEditMode,
    saveLayout,
    getDefaultLayout,
    isSaving
  } = useDashboardLayout(dashboardId);

  const [currentLayout, setCurrentLayout] = useState<LayoutItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize layout when saved layout or items change
  useEffect(() => {
    if (items.length === 0) return;
    
    let initialLayout: LayoutItem[];
    
    if (savedLayout && savedLayout.length === items.length) {
      // Use saved layout, but ensure all items have IDs
      initialLayout = savedLayout.map((layoutItem, index) => ({
        ...layoutItem,
        i: items[index]?.id || index.toString()
      }));
    } else {
      // Generate default layout
      initialLayout = items.map((item, index) => {
        const col = index % 4;
        const row = Math.floor(index / 4);
        
        return {
          i: item.id,
          x: col * 3,
          y: row * 4,
          w: item.type === 'metric' ? 2 : 3, // Metrics are smaller by default
          h: item.type === 'metric' ? 2 : 4, // Metrics are shorter by default
          minW: item.type === 'metric' ? 1 : 2,
          minH: item.type === 'metric' ? 1 : 2,
          maxW: 6,
          maxH: 8
        };
      });
    }
    
    setCurrentLayout(initialLayout);
    setHasChanges(false);
  }, [savedLayout, items]);

  const handleLayoutChange = (newLayout: Layout[]) => {
    if (!isEditMode) return;
    
    const updatedLayout: LayoutItem[] = newLayout.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: currentLayout.find(l => l.i === item.i)?.minW,
      minH: currentLayout.find(l => l.i === item.i)?.minH,
      maxW: currentLayout.find(l => l.i === item.i)?.maxW,
      maxH: currentLayout.find(l => l.i === item.i)?.maxH,
    }));
    
    setCurrentLayout(updatedLayout);
    setHasChanges(true);
  };

  const handleSaveLayout = () => {
    saveLayout(currentLayout);
    setHasChanges(false);
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    // Reset to saved layout or default
    if (savedLayout) {
      setCurrentLayout(savedLayout);
    } else {
      setCurrentLayout(getDefaultLayout(items.length));
    }
    setHasChanges(false);
    setIsEditMode(false);
  };

  const handleResetLayout = () => {
    const defaultLayout = getDefaultLayout(items.length);
    setCurrentLayout(defaultLayout);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard layout...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Layout Controls */}
      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
        <div className="flex gap-2">
          {!isEditMode ? (
            <Button
              variant="outline"
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Layout
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSaveLayout}
                disabled={!hasChanges || isSaving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Layout'}
              </Button>
              <Button
                variant="outline"
                onClick={handleResetLayout}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
        
        {isEditMode && (
          <div className="text-sm text-muted-foreground">
            Drag corners to resize • Drag headers to move • Changes will be saved to your profile
          </div>
        )}
      </div>

      {/* Grid Layout */}
      <div className={`relative ${isEditMode ? 'bg-accent/30 p-4 rounded-lg border-2 border-dashed border-primary/30' : ''}`}>
        <ResponsiveGridLayout
          className={`layout ${isEditMode ? 'edit-mode' : ''}`}
          layouts={{ lg: currentLayout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          onLayoutChange={handleLayoutChange}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
          resizeHandles={['se']}
        >
          {items.map((item) => (
            <div key={item.id} className="dashboard-item">
              <Card className={`h-full ${isEditMode ? 'ring-2 ring-primary/20 shadow-lg' : ''}`}>
                <CardHeader className={`pb-2 ${isEditMode ? 'cursor-move bg-primary/5' : ''}`}>
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{item.title}</span>
                    {isEditMode && (
                      <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                        {item.type}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-theme(spacing.16))] overflow-hidden p-4">
                  {item.content}
                </CardContent>
              </Card>
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      <style>{`
        .layout {
          position: relative;
          min-height: 400px;
        }
        
        .edit-mode .dashboard-item {
          transition: all 200ms ease;
        }
        
        .edit-mode .dashboard-item:hover {
          z-index: 10;
        }
        
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }
        
        .react-grid-item.react-grid-placeholder {
          background: hsl(var(--primary)) !important;
          opacity: 0.2;
          border-radius: 8px;
          border: 2px dashed hsl(var(--primary));
        }
        
        .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZG90cyBmaWxsPSIjODg4IiBvcGFjaXR5PSIwLjYiPgo8Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIvPgo8Y2lyY2xlIGN4PSIxIiBjeT0iMyIgcj0iMSIvPgo8Y2lyY2xlIGN4PSIxIiBjeT0iNSIgcj0iMSIvPgo8Y2lyY2xlIGN4PSIzIiBjeT0iMyIgcj0iMSIvPgo8Y2lyY2xlIGN4PSIzIiBjeT0iNSIgcj0iMSIvPgo8Y2lyY2xlIGN4PSI1IiBjeT0iNSIgcj0iMSIvPgo8L2RvdHM+Cjwvc3ZnPgo=');
          background-position: bottom right;
          padding: 0 3px 3px 0;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
          opacity: 0.6;
        }
        
        .edit-mode .react-resizable-handle {
          opacity: 1;
          background-color: hsl(var(--primary));
          border-radius: 0 0 4px 0;
        }
        
        .edit-mode .react-resizable-handle:hover {
          background-color: hsl(var(--primary));
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};
