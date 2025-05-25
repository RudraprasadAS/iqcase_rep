
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';

interface SLABadgeProps {
  sla_due_at?: string;
  status: string;
}

const SLABadge = ({ sla_due_at, status }: SLABadgeProps) => {
  if (!sla_due_at || status === 'closed' || status === 'resolved') {
    return null;
  }

  const dueDate = new Date(sla_due_at);
  const now = new Date();
  const timeDiff = dueDate.getTime() - now.getTime();
  const hoursRemaining = timeDiff / (1000 * 60 * 60);

  if (hoursRemaining < 0) {
    // SLA breached
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        SLA Breached
      </Badge>
    );
  } else if (hoursRemaining < 2) {
    // SLA warning (less than 2 hours)
    return (
      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
        <Clock className="h-3 w-3 mr-1" />
        {Math.round(hoursRemaining)}h left
      </Badge>
    );
  } else if (hoursRemaining < 24) {
    // SLA approaching (less than 24 hours)
    return (
      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800 border-yellow-300">
        <Clock className="h-3 w-3 mr-1" />
        {Math.round(hoursRemaining)}h left
      </Badge>
    );
  }

  // SLA on track
  return (
    <Badge variant="outline" className="text-xs bg-green-50 text-green-800 border-green-300">
      <Clock className="h-3 w-3 mr-1" />
      {Math.round(hoursRemaining / 24)}d left
    </Badge>
  );
};

export default SLABadge;
