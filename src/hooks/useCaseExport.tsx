
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateCasePDF } from '@/utils/pdfGenerator';

export const useCaseExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportCaseToPDF = async (caseId: string, isInternal: boolean = false) => {
    setIsExporting(true);
    
    try {
      console.log('🔄 Starting PDF export for case:', caseId);

      // Fetch case data
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select(`
          *,
          submitted_by_user:users!cases_submitted_by_fkey(name, email),
          assigned_to_user:users!cases_assigned_to_fkey(name, email),
          category:case_categories!cases_category_id_fkey(name)
        `)
        .eq('id', caseId)
        .single();

      if (caseError) {
        console.error('Error fetching case data:', caseError);
        throw caseError;
      }

      // Fetch case notes
      const { data: caseNotes, error: notesError } = await supabase
        .from('case_notes')
        .select(`
          *,
          users!case_notes_created_by_fkey(name, email)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (notesError) {
        console.error('Error fetching case notes:', notesError);
      }

      // Fetch activities
      const { data: activities, error: activitiesError } = await supabase
        .from('case_activities')
        .select(`
          *,
          users!case_activities_performed_by_fkey(name, email)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
      }

      // Generate PDF with filtered content
      generateCasePDF({
        caseData,
        caseNotes: caseNotes || [],
        activities: activities || [],
        isInternal
      });

      toast({
        title: "PDF Generated Successfully",
        description: "Your case report has been downloaded."
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF report.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportCaseToPDF,
    isExporting
  };
};
