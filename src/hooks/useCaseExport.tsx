
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateCasePDF } from '@/utils/pdfGenerator';

export const useCaseExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportCaseToPDF = async (caseId: string) => {
    setIsExporting(true);
    try {
      // Fetch complete case data including case notes
      const [caseResult, messagesResult, attachmentsResult, activitiesResult, tasksResult, feedbackResult, caseNotesResult] = await Promise.all([
        supabase
          .from('cases')
          .select(`
            *,
            submitted_by_user:users!cases_submitted_by_fkey(name, email),
            assigned_to_user:users!cases_assigned_to_fkey(name, email),
            category:case_categories!cases_category_id_fkey(name)
          `)
          .eq('id', caseId)
          .single(),
        
        supabase
          .from('case_messages')
          .select(`
            *,
            users!case_messages_sender_id_fkey(name, email)
          `)
          .eq('case_id', caseId)
          .order('created_at', { ascending: true }),
        
        supabase
          .from('case_attachments')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('case_activities')
          .select(`
            *,
            users!case_activities_performed_by_fkey(name, email)
          `)
          .eq('case_id', caseId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('case_tasks')
          .select(`
            *,
            assigned_to_user:users!case_tasks_assigned_to_fkey(name)
          `)
          .eq('case_id', caseId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('case_feedback')
          .select(`
            *,
            users:submitted_by(name, email)
          `)
          .eq('case_id', caseId)
          .order('submitted_at', { ascending: false }),

        // Fetch case notes (both internal and external)
        supabase
          .from('case_notes')
          .select(`
            *,
            users!case_notes_author_id_fkey(name, email)
          `)
          .eq('case_id', caseId)
          .order('created_at', { ascending: false })
      ]);

      if (caseResult.error) throw caseResult.error;
      if (messagesResult.error) throw messagesResult.error;
      if (attachmentsResult.error) throw attachmentsResult.error;
      if (activitiesResult.error) throw activitiesResult.error;

      const pdfData = {
        caseData: caseResult.data,
        messages: messagesResult.data || [],
        attachments: attachmentsResult.data || [],
        activities: activitiesResult.data || [],
        tasks: tasksResult.data || [],
        feedback: feedbackResult.data || [],
        caseNotes: caseNotesResult.data || []
      };

      generateCasePDF(pdfData);

      toast({
        title: "PDF Generated",
        description: "Case report has been downloaded successfully"
      });

    } catch (error) {
      console.error('Error exporting case to PDF:', error);
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
    exportCaseToPDF,
    isExporting
  };
};
