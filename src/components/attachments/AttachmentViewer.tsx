
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';

interface AttachmentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
  fileType?: string;
}

const AttachmentViewer = ({ isOpen, onClose, fileName, fileUrl, fileType }: AttachmentViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);

  const downloadAttachment = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const resetZoom = () => {
    setZoom(100);
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
        <div className="flex justify-center overflow-auto">
          <img 
            src={fileUrl} 
            alt={fileName}
            className="object-contain transition-transform duration-200"
            style={{ 
              maxWidth: isFullscreen ? 'none' : '100%', 
              maxHeight: isFullscreen ? 'none' : '70vh',
              transform: `scale(${zoom / 100})`
            }}
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
          className="w-full border"
          style={{ height: isFullscreen ? '90vh' : '70vh' }}
          title={fileName}
          onLoad={() => setLoading(false)}
        />
      );
    }

    if (fileType.startsWith('text/')) {
      return (
        <iframe
          src={fileUrl}
          className="w-full border"
          style={{ height: isFullscreen ? '90vh' : '70vh' }}
          title={fileName}
          onLoad={() => setLoading(false)}
        />
      );
    }

    // Handle DOCX and other Office documents
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        fileType === 'application/msword' ||
        fileType === 'application/vnd.ms-excel' ||
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileType === 'application/vnd.ms-powerpoint' ||
        fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      
      // Use Google Docs Viewer for Office documents
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      
      return (
        <iframe
          src={googleViewerUrl}
          className="w-full border"
          style={{ height: isFullscreen ? '90vh' : '70vh' }}
          title={fileName}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
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
      <DialogContent className={`overflow-hidden ${isFullscreen ? 'max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh]' : 'max-w-4xl max-h-[90vh]'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate mr-4">{fileName}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {fileType?.startsWith('image/') && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomOut}
                    title="Zoom out"
                    disabled={zoom <= 50}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetZoom}
                    title="Reset zoom"
                    className="text-xs px-2"
                  >
                    {zoom}%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomIn}
                    title="Zoom in"
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
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
        
        <div className={`${loading ? 'hidden' : ''} ${isFullscreen ? 'overflow-auto' : ''}`}>
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentViewer;
