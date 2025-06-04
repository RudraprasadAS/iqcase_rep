
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import html2pdf from 'html2pdf.js';

export const useHtmlToPdf = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportElementToPDF = async (elementId: string, filename: string) => {
    setIsExporting(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      const options = {
        margin: 0.5,
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };

      await html2pdf().set(options).from(element).save();

      toast({
        title: "PDF Generated",
        description: "Case report has been downloaded successfully"
      });

    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportElementToPDF,
    isExporting
  };
};
