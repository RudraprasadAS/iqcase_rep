
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface CaseDescriptionProps {
  description?: string;
  location?: string;
}

const CaseDescription = ({ description, location }: CaseDescriptionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Description</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{description || 'No description provided'}</p>
        {location && (
          <div className="mt-4 flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm">{location}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CaseDescription;
