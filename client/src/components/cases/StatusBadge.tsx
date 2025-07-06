
import { Badge } from '@/components/ui/badge';
import { Circle, CircleCheck, CircleX, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return {
          variant: 'default' as const,
          icon: Circle,
          className: 'bg-blue-100 text-blue-800 border-blue-300',
          label: 'OPEN'
        };
      case 'in_progress':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-purple-100 text-purple-800 border-purple-300',
          label: 'IN PROGRESS'
        };
      case 'resolved':
        return {
          variant: 'outline' as const,
          icon: CircleCheck,
          className: 'bg-green-100 text-green-800 border-green-300',
          label: 'RESOLVED'
        };
      case 'closed':
        return {
          variant: 'secondary' as const,
          icon: CircleX,
          className: 'bg-gray-100 text-gray-800 border-gray-300',
          label: 'CLOSED'
        };
      default:
        return {
          variant: 'default' as const,
          icon: Circle,
          className: '',
          label: status.toUpperCase()
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
