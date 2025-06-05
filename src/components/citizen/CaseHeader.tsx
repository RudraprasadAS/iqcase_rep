
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileDown } from 'lucide-react';
import StatusBadge from '@/components/cases/StatusBadge';
import PriorityBadge from '@/components/cases/PriorityBadge';

interface CaseHeaderProps {
  caseData: {
    id: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
  };
  onBack: () => void;
  onExportPDF: () => void;
  isExporting: boolean;
}

const CaseHeader = ({ caseData, onBack, onExportPDF, isExporting }: CaseHeaderProps) => {
  const generateCaseNumber = (id: string, createdAt: string) => {
    const year = new Date(createdAt).getFullYear();
    const shortId = id.slice(-6).toUpperCase();
    return `#${year}-${shortId}`;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{caseData.title}</h1>
          <p className="text-sm text-muted-foreground">
            Case {generateCaseNumber(caseData.id, caseData.created_at)}
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <StatusBadge status={caseData.status} />
            <PriorityBadge priority={caseData.priority} />
          </div>
        </div>
      </div>
      <Button 
        variant="outline" 
        onClick={onExportPDF}
        disabled={isExporting}
        className="flex items-center gap-2"
      >
        <FileDown className="h-4 w-4" />
        {isExporting ? 'Generating PDF...' : 'Download Case Report (PDF)'}
      </Button>
    </div>
  );
};

export default CaseHeader;
