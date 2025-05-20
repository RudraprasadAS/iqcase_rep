
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useReports } from '@/hooks/useReports';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FilePlus, Search, Eye, Pencil, Trash2, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Report } from '@/types/reports';

const Reports = () => {
  const navigate = useNavigate();
  const { 
    reports, 
    isLoadingReports, 
    tables, 
    createReport,
    deleteReport,
    runReport
  } = useReports();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [newReportName, setNewReportName] = useState('');
  const [newReportDescription, setNewReportDescription] = useState('');
  const [selectedBaseTable, setSelectedBaseTable] = useState('');

  const filteredReports = reports?.filter(report => 
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (report.description && report.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateReport = async () => {
    if (!newReportName || !selectedBaseTable) return;
    
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    
    if (!userId) return;
    
    createReport.mutate({
      name: newReportName,
      description: newReportDescription,
      created_by: userId,
      base_table: selectedBaseTable,
      fields: [],
      is_public: false
    }, {
      onSuccess: (data) => {
        setCreateDialogOpen(false);
        setNewReportName('');
        setNewReportDescription('');
        setSelectedBaseTable('');
        navigate(`/reports/${data.id}`);
      }
    });
  };

  const confirmDeleteReport = (report: Report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const handleDeleteReport = () => {
    if (reportToDelete) {
      deleteReport.mutate(reportToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setReportToDelete(null);
        }
      });
    }
  };

  const handleRunReport = (reportId: string) => {
    runReport.mutate(reportId, {
      onSuccess: (data) => {
        console.log('Report data:', data);
        // Would typically show results in a modal or navigate to a results page
      }
    });
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
            <p className="text-muted-foreground">
              Create, run, and manage custom reports
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <FilePlus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Reports</CardTitle>
            <CardDescription>
              View your saved reports or create new ones
            </CardDescription>
            
            <div className="flex items-center relative mt-4">
              <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoadingReports ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Base Table</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {filteredReports?.length ? (
                    filteredReports.map(report => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>{report.base_table}</TableCell>
                        <TableCell>You</TableCell>
                        <TableCell>
                          {report.created_at && format(new Date(report.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={report.is_public ? "outline" : "secondary"}>
                            {report.is_public ? 'Public' : 'Private'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRunReport(report.id)}
                              title="Run Report"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/reports/${report.id}`)}
                              title="Edit Report"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              title="Schedule Report"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              title="Export Report"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => confirmDeleteReport(report)}
                              title="Delete Report"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No reports found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Create Report Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                value={newReportName}
                onChange={(e) => setNewReportName(e.target.value)}
                placeholder="My Report"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="report-description">Description (Optional)</Label>
              <Input
                id="report-description"
                value={newReportDescription}
                onChange={(e) => setNewReportDescription(e.target.value)}
                placeholder="Report description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="base-table">Base Table</Label>
              <Select value={selectedBaseTable} onValueChange={setSelectedBaseTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {tables?.map((table) => (
                    <SelectItem key={table.name} value={table.name}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReport} disabled={!newReportName || !selectedBaseTable || createReport.isPending}>
              Create Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete the report "{reportToDelete?.name}"? 
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteReport}
              disabled={deleteReport.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Reports;
