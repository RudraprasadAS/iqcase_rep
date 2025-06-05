
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface AttachmentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
  fileType?: string;
}

const AttachmentViewer = ({ isOpen, onClose, fileName, fileUrl, fileType }: AttachmentViewerProps) => {
  const [loading, setLoading] = useState(true);

  const downloadAttachment = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    if (!fileType) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Cannot preview this file type</p>
        </div>
      );
    }

    if (fileType.startsWith('image/')) {
      return (
        <div className="flex justify-center">
          <img 
            src={fileUrl} 
            alt={fileName}
            className="max-w-full max-h-[70vh] object-contain"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        </div>
      );
    }

    if (fileType === 'application/pdf') {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-[70vh]"
          title={fileName}
          onLoad={() => setLoading(false)}
        />
      );
    }

    if (fileType.startsWith('text/')) {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-[70vh] border"
          title={fileName}
          onLoad={() => setLoading(false)}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-gray-500">Preview not available for this file type</p>
        <Button onClick={downloadAttachment} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download to view
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate mr-4">{fileName}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAttachment}
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        <div className={loading ? 'hidden' : ''}>
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentViewer;
