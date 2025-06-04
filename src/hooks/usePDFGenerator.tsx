
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PDFService } from '@/services/pdfService';

export const usePDFGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const pdfRef = useRef<HTMLDivElement>(null);

  const generatePDF = async (filename: string) => {
    if (!pdfRef.current) {
      toast({
        title: "Error",
        description: "PDF template not found",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      await PDFService.generateFromElement(pdfRef.current, {
        filename: `${filename}.pdf`,
        format: 'a4',
        orientation: 'portrait',
        quality: 2
      });

      toast({
        title: "PDF Generated",
        description: "Your report has been downloaded successfully"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate PDF report",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePDF,
    isGenerating,
    pdfRef
  };
};
