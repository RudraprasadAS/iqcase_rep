import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CaseFeedback from '@/components/cases/CaseFeedback';
import CaseUpdates from '@/components/cases/CaseUpdates';
import { useCaseExport } from '@/hooks/useCaseExport';
import CaseHeader from '@/components/citizen/CaseHeader';
import CaseClosedAlert from '@/components/citizen/CaseClosedAlert';
import CaseDescription from '@/components/citizen/CaseDescription';
import CaseAttachments from '@/components/citizen/CaseAttachments';
import CaseMessages from '@/components/citizen/CaseMessages';
import CaseInfo from '@/components/citizen/CaseInfo';

interface CaseData {
  id: string;
  title: string;
  status: string;
  priority: string;
  category_id?: string;
  submitted_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  description?: string;
  sla_due_at?: string;
  location?: string;
  submitted_by_user?: { name: string; email: string };
  assigned_to_user?: { name: string; email: string };
  category?: { name: string };
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  is_internal: boolean;
  users?: { name: string; email: string };
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  created_at: string;
  uploaded_by?: string;
}

const CitizenCaseDetail = () => {
  const { id: caseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { exportCaseToPDF, isExporting } = useCaseExport();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (caseId) {
      fetchCaseData();
      fetchMessages();
      fetchAttachments();
    }
  }, [caseId]);

  const fetchCaseData = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          submitted_by_user:users!cases_submitted_by_fkey(name, email),
          assigned_to_user:users!cases_assigned_to_fkey(name, email),
          category:case_categories!cases_category_id_fkey(name)
        `)
        .eq('id', caseId)
        .single();

      if (error) {
        console.error('Case fetch error:', error);
        throw error;
      }

      setCaseData(data);
    } catch (error) {
      console.error('Error fetching case:', error);
      toast({
        title: "Error",
        description: "Failed to fetch case details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('case_messages')
        .select(`
          *,
          users!case_messages_sender_id_fkey(name, email)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Messages fetch error:', error);
        throw error;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('case_attachments')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Attachments fetch error:', error);
        throw error;
      }

      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const generateCaseNumber = (id: string, createdAt: string) => {
    const year = new Date(createdAt).getFullYear();
    const shortId = id.slice(-6).toUpperCase();
    return `#${year}-${shortId}`;
  };

  const handleExportPDF = () => {
    if (caseId) {
      // Pass false for isInternal since this is citizen portal
      exportCaseToPDF(caseId, false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading case details...</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Case not found</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Case {generateCaseNumber(caseData.id, caseData.created_at)} - Citizen Portal</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <CaseHeader
          caseData={caseData}
          onBack={() => navigate('/cases')}
          onExportPDF={handleExportPDF}
          isExporting={isExporting}
        />

        <CaseClosedAlert status={caseData.status} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CaseDescription 
              description={caseData.description}
              location={caseData.location}
            />

            <CaseAttachments
              attachments={attachments}
              caseId={caseId!}
              onAttachmentsUpdated={fetchAttachments}
            />

            <CaseMessages
              messages={messages}
              caseId={caseId!}
              onMessagesUpdated={fetchMessages}
            />

            <CaseFeedback 
              caseId={caseData.id} 
              caseTitle={caseData.title}
              caseStatus={caseData.status} 
              isInternal={false}
            />
          </div>

          <div className="space-y-6">
            <CaseUpdates caseId={caseData.id} isInternal={false} />
            <CaseInfo caseData={caseData} />
          </div>
        </div>
      </div>
    </>
  );
};

export default CitizenCaseDetail;
