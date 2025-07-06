
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CaseInfoProps {
  caseData: {
    category?: { name: string };
    submitted_by_user?: { name: string; email: string };
    assigned_to_user?: { name: string };
    created_at: string;
    updated_at: string;
    sla_due_at?: string;
  };
}

const CaseInfo = ({ caseData }: CaseInfoProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {caseData.category && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <div className="mt-1">{caseData.category.name}</div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Submitted By</label>
            <div className="mt-1">{caseData.submitted_by_user?.name || caseData.submitted_by_user?.email || 'You'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
            <div className="mt-1">{caseData.assigned_to_user?.name || 'Unassigned'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Created</label>
            <div className="mt-1">{formatDate(caseData.created_at)}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
            <div className="mt-1">{formatDate(caseData.updated_at)}</div>
          </div>
          {caseData.sla_due_at && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">SLA Due</label>
              <div className="mt-1">{formatDateTime(caseData.sla_due_at)}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseInfo;
