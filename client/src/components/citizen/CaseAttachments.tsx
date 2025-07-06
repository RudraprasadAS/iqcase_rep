import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileImage, Download, Paperclip, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AttachmentViewer from '@/components/attachments/AttachmentViewer';

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  created_at: string;
  uploaded_by?: string;
}

interface CaseAttachmentsProps {
  attachments: Attachment[];
  caseId: string;
  onAttachmentsUpdated: () => void;
}

const CaseAttachments = ({ attachments, caseId, onAttachmentsUpdated }: CaseAttachmentsProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    fileName: string;
    fileUrl: string;
    fileType?: string;
  }>({
    isOpen: false,
    fileName: '',
    fileUrl: '',
    fileType: undefined
  });

  const viewAttachment = (attachment: Attachment) => {
    setViewerState({
      isOpen: true,
      fileName: attachment.file_name,
      fileUrl: attachment.file_url,
      fileType: attachment.file_type
    });
  };

  const closeViewer = () => {
    setViewerState({
      isOpen: false,
      fileName: '',
      fileUrl: '',
      fileType: undefined
    });
  };

  const downloadAttachment = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    if (!caseId) {
      toast({
        title: "Error",
        description: "Case ID is missing",
        variant: "destructive"
      });
      return;
    }

    for (const file of files) {
      const filePath = `case-attachments/${caseId}/${file.name}`;
      try {
        const { data, error } = await supabase.storage
          .from('case-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('File upload error:', error);
          toast({
            title: "Error",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          });
        } else {
          const { data: urlData } = supabase.storage
            .from('case-attachments')
            .getPublicUrl(filePath);
          
          await saveAttachmentToDatabase(file.name, urlData.publicUrl, file.type);
          toast({
            title: "File uploaded",
            description: `${file.name} uploaded successfully`
          });
        }
      } catch (error) {
        console.error('File upload error:', error);
        toast({
          title: "Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
      }
    }
  };

  const saveAttachmentToDatabase = async (fileName: string, fileUrl: string, fileType?: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        console.error('Auth error:', authError);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authData.user.id)
        .single();

      if (userError) {
        console.error('User lookup error:', userError);
        return;
      }

      const { error } = await supabase
        .from('case_attachments')
        .insert({
          case_id: caseId,
          file_name: fileName,
          file_url: fileUrl,
          file_type: fileType,
          uploaded_by: userData?.id
        });

      if (error) {
        console.error('Attachment save error:', error);
        throw error;
      }

      onAttachmentsUpdated();
    } catch (error) {
      console.error('Error saving attachment to database:', error);
      toast({
        title: "Error",
        description: "Failed to save attachment details",
        variant: "destructive"
      });
    }
  };

  if (attachments.length === 0) {
    return (
      <div className="flex gap-2 mb-2">
        <Button
          onClick={handleFileUpload}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Paperclip className="h-4 w-4" />
          Attach Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Paperclip className="h-5 w-5 mr-2" />
            Attachments ({attachments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {attachment.file_type?.startsWith('image/') ? (
                  <FileImage className="h-5 w-5 text-blue-500 flex-shrink-0" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {attachment.file_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {formatDistanceToNow(new Date(attachment.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewAttachment(attachment)}
                  title="View file"
                  className="h-8 px-2"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadAttachment(attachment.file_url, attachment.file_name)}
                  title="Download file"
                  className="h-8 px-2"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      <div className="flex gap-2 mb-2">
        <Button
          onClick={handleFileUpload}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Paperclip className="h-4 w-4" />
          Attach Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <AttachmentViewer
        isOpen={viewerState.isOpen}
        onClose={closeViewer}
        fileName={viewerState.fileName}
        fileUrl={viewerState.fileUrl}
        fileType={viewerState.fileType}
      />
    </>
  );
};

export default CaseAttachments;
