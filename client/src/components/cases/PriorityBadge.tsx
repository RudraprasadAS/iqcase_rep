
import { Badge } from '@/components/ui/badge';
import { Flag } from 'lucide-react';

interface PriorityBadgeProps {
  priority: string;
}

const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-300',
          label: 'HIGH'
        };
      case 'medium':
        return {
          variant: 'default' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          label: 'MEDIUM'
        };
      case 'low':
        return {
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-800 border-green-300',
          label: 'LOW'
        };
      default:
        return {
          variant: 'default' as const,
          className: '',
          label: priority.toUpperCase()
        };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <Badge variant={config.variant} className={config.className}>
      <Flag className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};

export default PriorityBadge;
