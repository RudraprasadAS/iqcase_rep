import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, MapPin, User, Tag, Clock, Paperclip, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import StatusBadge from '@/components/cases/StatusBadge';
import PriorityBadge from '@/components/cases/PriorityBadge';
import SLABadge from '@/components/cases/SLABadge';
import MessageCenter from '@/components/messaging/MessageCenter';

interface CaseData {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  location?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  sla_due_at?: string;
  category: { name: string } | null;
  submitted_by_user: { name: string } | null;
  assigned_to_user: { name: string } | null;
}

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  users: { name: string } | null;
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
  uploaded_by: string;
}

const CitizenCaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchCaseData();
    }
  }, [id, user]);

  const fetchCaseData = async () => {
    if (!id || !user) return;

    try {
      console.log('Fetching case details for case:', id, 'user:', user.id);

      // Get internal user ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('User lookup error:', userError);
        throw userError;
      }

      if (!userData) {
        console.log('No internal user found');
        throw new Error('User not found');
      }

      console.log('Internal user ID:', userData.id);

      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select(`
          *,
          case_categories!category_id(name),
          users!submitted_by(name),
          assigned_users:users!assigned_to(name)
        `)
        .eq('id', id)
        .eq('submitted_by', userData.id)
        .maybeSingle();

      if (caseError) {
        console.error('Case fetch error:', caseError);
        throw caseError;
      }

      if (!caseData) {
        console.log('Case not found or access denied');
        throw new Error('Case not found');
      }

      console.log('Case data loaded:', caseData);

      setCaseData({
        ...caseData,
        category: caseData.case_categories,
        submitted_by_user: caseData.users,
        assigned_to_user: caseData.assigned_users
      });

      // Fetch case activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('case_activities')
        .select(`
          *,
          users!case_activities_performed_by_fkey(name)
        `)
        .eq('case_id', id)
        .order('created_at', { ascending: false });

      if (activitiesError) {
        console.error('Activities fetch error:', activitiesError);
      } else {
        console.log('Activities loaded:', activitiesData?.length || 0);
        setActivities(activitiesData || []);
      }

      // Fetch case attachments - only non-private ones for citizens
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('case_attachments')
        .select('*')
        .eq('case_id', id)
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (attachmentsError) {
        console.error('Attachments fetch error:', attachmentsError);
      } else {
        console.log('Attachments loaded:', attachmentsData?.length || 0);
        setAttachments(attachmentsData || []);
      }

    } catch (error) {
      console.error('Error fetching case data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load case details',
        variant: 'destructive'
      });
      navigate('/citizen/cases');
    } finally {
      setLoading(false);
    }
  };

  const downloadAttachment = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading case details...</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Case not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/citizen/cases')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{caseData.title}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Case #{caseData.id.slice(0, 8)}</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={caseData.status} />
                  <PriorityBadge priority={caseData.priority} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{caseData.description}</p>
              </div>

              {caseData.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {caseData.location}
                </div>
              )}

              {caseData.tags && caseData.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <div className="flex flex-wrap gap-1">
                    {caseData.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {attachments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments ({attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{attachment.file_name}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded {formatDistanceToNow(new Date(attachment.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadAttachment(attachment.file_url, attachment.file_name)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <MessageCenter caseId={caseData.id} isInternal={false} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Case Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {caseData.category && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="text-sm">{caseData.category.name}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-500">Submitted By</p>
                <p className="text-sm">{caseData.submitted_by_user?.name || 'Unknown'}</p>
              </div>

              {caseData.assigned_to_user && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Assigned To</p>
                  <p className="text-sm">{caseData.assigned_to_user.name}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-sm">{formatDistanceToNow(new Date(caseData.created_at), { addSuffix: true })}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-sm">{formatDistanceToNow(new Date(caseData.updated_at), { addSuffix: true })}</p>
              </div>

              {caseData.sla_due_at && (
                <div>
                  <p className="text-sm font-medium text-gray-500">SLA Due</p>
                  <SLABadge sla_due_at={caseData.sla_due_at} status={caseData.status} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CitizenCaseDetail;
