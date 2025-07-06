
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface CaseClosedAlertProps {
  status: string;
}

const CaseClosedAlert = ({ status }: CaseClosedAlertProps) => {
  const isCaseClosed = status === 'closed' || status === 'resolved';

  if (!isCaseClosed) {
    return null;
  }

  return (
    <Card className="border-2 bg-green-50 border-green-200">
      <CardContent className="py-4">
        <div className="flex items-center text-green-800">
          <CheckCircle className="h-5 w-5 mr-2" />
          <div>
            <span className="font-medium">Your case has been {status}!</span>
            <p className="text-sm text-green-700 mt-1">
              We'd love to hear about your experience. Please scroll down to provide feedback.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseClosedAlert;
