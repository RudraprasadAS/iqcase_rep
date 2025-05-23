
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { TableInfo } from '@/types/reports';
import { Switch } from '@/components/ui/switch';

interface ReportSettingsProps {
  form: UseFormReturn<{
    name: string;
    description: string;
    base_table: string;
    is_public: boolean;
  }>;
  tables?: TableInfo[];
  isLoadingTables: boolean;
  isEditMode?: boolean;
}

export const ReportSettings = ({ 
  form, 
  tables, 
  isLoadingTables, 
  isEditMode = false
}: ReportSettingsProps) => {
  const handleBaseTableChange = (value: string) => {
    form.setValue('base_table', value);
  };

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="base_table"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Table</FormLabel>
              <Select
                disabled={isEditMode}
                value={field.value}
                onValueChange={handleBaseTableChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingTables ? (
                    <div className="flex justify-center p-2">
                      <svg 
                        className="h-4 w-4 animate-spin" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                        ></circle>
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                  ) : (
                    tables?.map((table) => (
                      <SelectItem key={table.name} value={table.name}>
                        {table.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Public Report</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Make this report accessible to all users
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
};
