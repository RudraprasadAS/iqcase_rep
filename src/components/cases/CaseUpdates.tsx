
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, CheckCircle, AlertCircle, FileText, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  users: { name: string } | null;
}

interface CaseUpdatesProps {
  caseId: string;
  isInternal?: boolean;
}

const CaseUpdates = ({ caseId, isInternal = true }: CaseUpdatesProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (caseId) {
      fetchActivities();
    }
  }, [caseId]);

  const fetchActivities = async () => {
    try {
      console.log('Fetching activities for case:', caseId);
      
      const { data, error } = await supabase
        .from('case_activities')
        .select(`
          id,
          activity_type,
          description,
          created_at,
          users!case_activities_performed_by_fkey(name)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activities:', error);
        throw error;
      }

      // Filter activities based on whether this is internal or external view
      let filteredActivities = data || [];
      
      if (!isInternal) {
        // For external users, only show relevant activities
        const allowedActivityTypes = [
          'case_created',
          'case_assigned',
          'case_unassigned',
          'status_changed',
          'priority_changed',
          'message_added',
          'attachment_added'
        ];
        
        filteredActivities = (data || []).filter(activity => {
          // Include allowed activity types
          if (allowedActivityTypes.includes(activity.activity_type)) {
            // Exclude internal messages for external users
            if (activity.activity_type === 'message_added' && activity.description.includes('Internal message')) {
              return false;
            }
            return true;
          }
          return false;
        });
      }

      console.log('Activities loaded:', filteredActivities.length);
      setActivities(filteredActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'case_created':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'case_assigned':
      case 'case_unassigned':
        return <User className="h-4 w-4 text-green-500" />;
      case 'status_changed':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'priority_changed':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'message_added':
        return <MessageSquare className="h-4 w-4 text-cyan-500" />;
      case 'attachment_added':
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityTypeLabel = (activityType: string) => {
    switch (activityType) {
      case 'case_created':
        return 'Created';
      case 'case_assigned':
        return 'Assigned';
      case 'case_unassigned':
        return 'Unassigned';
      case 'status_changed':
        return 'Status Update';
      case 'priority_changed':
        return 'Priority Update';
      case 'message_added':
        return 'Message';
      case 'attachment_added':
        return 'Attachment';
      default:
        return 'Update';
    }
  };

  const getActivityTypeColor = (activityType: string) => {
    switch (activityType) {
      case 'case_created':
        return 'bg-blue-100 text-blue-700';
      case 'case_assigned':
        return 'bg-green-100 text-green-700';
      case 'case_unassigned':
        return 'bg-gray-100 text-gray-700';
      case 'status_changed':
        return 'bg-purple-100 text-purple-700';
      case 'priority_changed':
        return 'bg-orange-100 text-orange-700';
      case 'message_added':
        return 'bg-cyan-100 text-cyan-700';
      case 'attachment_added':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Case Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading updates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Case Updates ({activities.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No updates for this case yet
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getActivityTypeColor(activity.activity_type)}`}
                    >
                      {getActivityTypeLabel(activity.activity_type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 break-words">
                    {activity.description}
                  </p>
                  {activity.users && (
                    <p className="text-xs text-muted-foreground mt-1">
                      by {activity.users.name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CaseUpdates;
