
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useReportExport } from '@/hooks/useReportExport';
import { FileDown, Download, Plus, Eye, Edit } from 'lucide-react';

const Reports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { exportToCSV, exportToPDF, isExporting } = useReportExport();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: "Error",
          description: "Failed to fetch reports",
          variant: "destructive"
        });
      } else {
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async (report: any) => {
    setLoading(true);
    try {
      let query;
      
      // Build query based on the report module
      switch (report.module) {
        case 'cases':
          query = supabase
            .from('cases')
            .select(`
              *,
              submitted_by_user:submitted_by(name, email),
              assigned_to_user:assigned_to(name, email),
              category:case_categories(name)
            `);
          break;
        case 'users':
          query = supabase
            .from('users')
            .select(`
              *,
              role:roles(name)
            `);
          break;
        case 'case_activities':
          query = supabase
            .from('case_activities')
            .select(`
              *,
              case:cases(title),
              user:users(name, email)
            `);
          break;
        default:
          // For other modules, query the basic table
          query = supabase.from(report.module).select('*');
      }

      // Apply filters if they exist
      if (report.filters && Array.isArray(report.filters)) {
        report.filters.forEach((filter: any) => {
          if (filter.field && filter.operator && filter.value) {
            switch (filter.operator) {
              case 'equals':
                query = query.eq(filter.field, filter.value);
                break;
              case 'contains':
                query = query.ilike(filter.field, `%${filter.value}%`);
                break;
              case 'greater_than':
                query = query.gt(filter.field, filter.value);
                break;
              case 'less_than':
                query = query.lt(filter.field, filter.value);
                break;
            }
          }
        });
      }

      // Apply ordering
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching report data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch report data",
          variant: "destructive"
        });
        setReportData([]);
      } else {
        setReportData(data || []);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch report data",
        variant: "destructive"
      });
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReportChange = (reportId: string) => {
    const selected = reports.find(report => report.id === reportId);
    setSelectedReport(selected);
    if (selected) {
      fetchReportData(selected);
    } else {
      setReportData([]);
    }
  };

  const handleViewReport = (reportId: string) => {
    navigate(`/reports/builder?id=${reportId}&view=true`);
  };

  const handleEditReport = (reportId: string) => {
    navigate(`/reports/builder?id=${reportId}&edit=true`);
  };

  const handleExportCSV = () => {
    if (reportData.length > 0) {
      exportToCSV(reportData, selectedReport?.name || 'report');
    }
  };

  const handleExportPDF = () => {
    if (reportData.length > 0) {
      exportToPDF(
        reportData, 
        selectedReport?.name || 'report',
        selectedReport?.name || 'Report',
        { module: selectedReport?.module }
      );
    }
  };

  return (
    <>
      <Helmet>
        <title>Reports - IQCase</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Generate and analyze reports</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => navigate('/reports/builder')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Report
            </Button>
            {selectedReport && reportData.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleExportCSV}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  {isExporting ? 'Generating PDF...' : 'Export PDF'}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={handleReportChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a report" />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedReport && (
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewReport(selectedReport.id)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditReport(selectedReport.id)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Data</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center">Loading data...</div>
              ) : selectedReport ? (
                reportData.length > 0 ? (
                  <ScrollArea className="rounded-md border">
                    <div className="relative overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                          <tr>
                            {reportData.length > 0 && Object.keys(reportData[0]).map(key => (
                              <th key={key} scope="col" className="px-6 py-3">
                                {key.replace(/_/g, ' ').toUpperCase()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.slice(0, 10).map((row, index) => (
                            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                              {Object.values(row).map((value, i) => (
                                <td key={i} className="px-6 py-4">
                                  {typeof value === 'object' && value !== null 
                                    ? JSON.stringify(value) 
                                    : String(value || '').substring(0, 50)
                                  }
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportData.length > 10 && (
                        <div className="p-4 text-center text-sm text-gray-500">
                          Showing first 10 rows of {reportData.length} total records. Use export to see all data.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center">No data available for this report.</div>
                )
              ) : (
                <div className="text-center">Select a report to view data.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Reports;
