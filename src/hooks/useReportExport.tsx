
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

export const useReportExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToCSV = (data: any[], filename: string, title?: string) => {
    if (!data || data.length === 0) {
      toast({
        title: "No data to export",
        description: "There is no data available to export",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get headers from first object
      const headers = Object.keys(data[0]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle values that might contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "CSV exported successfully",
        description: `${filename} has been downloaded`
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Export failed",
        description: "Failed to export CSV file",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = async (data: any[], filename: string, title: string, filters?: any) => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 20;

      // Colors
      const colors = {
        primary: '#1f2937',
        secondary: '#6b7280',
        accent: '#3b82f6',
        light: '#f3f4f6'
      };

      // Header
      doc.setFillColor(colors.primary);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Logo placeholder
      doc.setFillColor('#ffffff');
      doc.circle(30, 17.5, 8, 'F');
      doc.setFontSize(8);
      doc.setTextColor(colors.primary);
      doc.text('LOGO', 25, 20);

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#ffffff');
      doc.text(title.toUpperCase(), 50, 22);

      yPosition = 50;

      // Report info
      doc.setFontSize(12);
      doc.setTextColor(colors.primary);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 10;

      if (filters) {
        doc.setFontSize(10);
        doc.setTextColor(colors.secondary);
        doc.text('Filters Applied:', margin, yPosition);
        yPosition += 8;
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            doc.text(`• ${key}: ${value}`, margin + 10, yPosition);
            yPosition += 6;
          }
        });
        yPosition += 5;
      }

      // Data summary
      doc.setFontSize(10);
      doc.setTextColor(colors.primary);
      doc.text(`Total Records: ${data.length}`, margin, yPosition);
      yPosition += 15;

      // Table headers
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const colWidth = (pageWidth - 2 * margin) / headers.length;
        
        doc.setFillColor(colors.light);
        doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 12, 'F');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.primary);
        
        headers.forEach((header, index) => {
          doc.text(header.replace(/_/g, ' ').toUpperCase(), margin + (index * colWidth) + 2, yPosition + 2);
        });
        
        yPosition += 15;

        // Table rows (first 20 rows to fit in PDF)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        const maxRows = Math.min(data.length, 20);
        for (let i = 0; i < maxRows; i++) {
          const row = data[i];
          headers.forEach((header, index) => {
            const value = String(row[header] || '').substring(0, 15); // Truncate long values
            doc.text(value, margin + (index * colWidth) + 2, yPosition);
          });
          yPosition += 8;
          
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
        }

        if (data.length > 20) {
          yPosition += 10;
          doc.setFontSize(10);
          doc.setTextColor(colors.secondary);
          doc.text(`... and ${data.length - 20} more records. Download CSV for complete data.`, margin, yPosition);
        }
      }

      // Footer
      const footerY = doc.internal.pageSize.height - 15;
      doc.setFontSize(8);
      doc.setTextColor(colors.secondary);
      doc.text('Generated from IQCase Management System', margin, footerY);

      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "PDF exported successfully",
        description: `${filename} has been downloaded`
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export failed",
        description: "Failed to export PDF file",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToCSV,
    exportToPDF,
    isExporting
  };
};
