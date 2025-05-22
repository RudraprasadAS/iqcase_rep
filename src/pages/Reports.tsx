
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useReports } from '@/hooks/useReports';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MoreHorizontal, Plus } from 'lucide-react';
import { format } from 'date-fns';

const Reports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { reports, tables, createReport, deleteReport, isLoadingReports, isLoadingTables } = useReports();
  
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleCreateReport = async () => {
    if (!reportName || !selectedTable) return;
    
    setIsSubmitting(true);
    try {
      const newReport = await createReport.mutateAsync({
        name: reportName,
        description: reportDescription,
        created_by: user?.id || '', // Use user ID from useAuth, but provide fallback 
        module: selectedTable,
        base_table: selectedTable,
        selected_fields: [],
        fields: [],
        filters: [],
        is_public: false
      });
      
      setShowNewDialog(false);
      navigate(`/reports/${newReport.id}`);
    } catch (error) {
      console.error("Error creating report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteReport = (id: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      deleteReport.mutate(id);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Reports | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Create, view, and manage your reports</p>
          </div>
          
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Reports</CardTitle>
            <CardDescription>List of all available reports for your organization</CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoadingReports ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : reports && reports.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Base Table</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="cursor-pointer" onClick={() => navigate(`/reports/${report.id}`)}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>{report.base_table || report.module}</TableCell>
                      <TableCell>
                        {report.created_at && format(new Date(report.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{report.fields?.length || 0} fields</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/reports/${report.id}`);
                            }}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              deleteReport.mutate(report.id);
                            }}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <p className="mb-4">No reports found</p>
                <p className="mb-6">Create a new report to get started.</p>
                <Button variant="outline" onClick={() => setShowNewDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first report
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
            <DialogDescription>
              Start by choosing a name and base table for your report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="table" className="text-right">
                Base Table
              </Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger id="table" className="col-span-3">
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTables ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateReport} 
              disabled={!reportName || !selectedTable || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Reports;
