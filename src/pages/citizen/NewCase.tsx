import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, X, Map, Paperclip, Upload, AlertCircle } from 'lucide-react';
import MapPickerModal from '@/components/citizen/MapPickerModal';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  formatted_address: string;
}

const NewCase = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locationData, setLocationData] = useState<LocationData>({
    latitude: null,
    longitude: null,
    formatted_address: ''
  });
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium'
  });

  useEffect(() => {
    console.log('[NewCase] Component mounted, user:', user?.id);
    if (user) {
      fetchInternalUserId();
    }
    fetchCategories();
    requestGeolocation();
  }, [user]);

  const fetchInternalUserId = async () => {
    if (!user) {
      console.log('[NewCase] No user available for internal ID lookup');
      return;
    }

    try {
      console.log('[NewCase] Fetching internal user ID for auth user:', user.id);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      console.log('[NewCase] User lookup response:', { userData, userError });

      if (userError) {
        console.error('[NewCase] User lookup error:', userError);
        toast({
          title: 'Authentication Error',
          description: 'Failed to verify user identity',
          variant: 'destructive'
        });
        return;
      }

      if (userData) {
        console.log('[NewCase] Internal user ID found:', userData.id);
        setInternalUserId(userData.id);
      } else {
        console.error('[NewCase] No internal user found for auth user:', user.id);
        toast({
          title: 'User Not Found',
          description: 'Your user profile was not found. Please contact support.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('[NewCase] Error fetching internal user ID:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user information',
        variant: 'destructive'
      });
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('[NewCase] Fetching categories...');
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('case_categories')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      console.log('[NewCase] Categories response:', { categoriesData, categoriesError });

      if (categoriesError) {
        console.error('[NewCase] Categories fetch error:', categoriesError);
        throw categoriesError;
      }

      console.log('[NewCase] Categories fetched:', categoriesData?.length || 0);
      setCategories(categoriesData || []);

    } catch (error) {
      console.error('[NewCase] Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      });
    }
  };

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      console.log('[NewCase] Geolocation is not supported by this browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('[NewCase] Got location:', latitude, longitude);
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          
          setLocationData({
            latitude,
            longitude,
            formatted_address: data.display_name || `${latitude}, ${longitude}`
          });
        } catch (error) {
          console.error('[NewCase] Reverse geocoding failed:', error);
          setLocationData({
            latitude,
            longitude,
            formatted_address: `${latitude}, ${longitude}`
          });
        }
        setGettingLocation(false);
      },
      (error) => {
        console.error('[NewCase] Geolocation error:', error);
        setGettingLocation(false);
        toast({
          title: 'Location Access',
          description: 'Unable to get your location. You can manually enter or pick on map.',
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      console.log('[NewCase] Files selected:', selectedFiles.length);
      
      // Validate files
      const validFiles = selectedFiles.filter(file => {
        console.log('[NewCase] Validating file:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: 'File Too Large',
            description: `${file.name} exceeds 10MB limit`,
            variant: 'destructive'
          });
          return false;
        }
        
        // Check file type
        const allowedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 
          'application/pdf', 
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: 'Invalid File Type',
            description: `${file.name} is not a supported file type`,
            variant: 'destructive'
          });
          return false;
        }
        
        return true;
      });
      
      console.log('[NewCase] Valid files:', validFiles.length, 'out of', selectedFiles.length);
      setFiles(prev => [...prev, ...validFiles]);
      
      // Clear the input
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (caseId: string): Promise<boolean> => {
    if (files.length === 0) {
      console.log('[NewCase] No files to upload');
      return true;
    }

    console.log('[NewCase] ==================== STARTING FILE UPLOAD ====================');
    console.log('[NewCase] Case ID:', caseId);
    console.log('[NewCase] Files to upload:', files.length);
    console.log('[NewCase] Internal User ID:', internalUserId);
    
    setUploadingFiles(true);
    
    let successCount = 0;
    let errorCount = 0;

    try {
      // Test storage connection and bucket existence first
      console.log('[NewCase] Testing storage connection...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('[NewCase] Storage connection error:', bucketsError);
        throw new Error(`Storage connection failed: ${bucketsError.message}`);
      }
      
      console.log('[NewCase] Available buckets:', buckets?.map(b => b.name));
      
      const targetBucket = buckets?.find(b => b.name === 'case-attachments');
      if (!targetBucket) {
        console.error('[NewCase] case-attachments bucket not found');
        throw new Error('Storage bucket "case-attachments" not found');
      }
      
      console.log('[NewCase] Storage bucket confirmed:', targetBucket);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          console.log(`[NewCase] ========== Processing file ${i + 1}/${files.length} ==========`);
          console.log('[NewCase] File details:', {
            name: file.name,
            size: file.size,
            type: file.type
          });
          
          // Generate unique filename
          const fileExt = file.name.split('.').pop();
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(2, 8);
          const fileName = `cases/${caseId}/${timestamp}-${randomId}.${fileExt}`;
          
          console.log('[NewCase] Storage path:', fileName);
          
          // Upload to Supabase Storage
          console.log('[NewCase] Uploading to storage...');
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('case-attachments')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('[NewCase] Storage upload error:', uploadError);
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          console.log('[NewCase] File uploaded to storage successfully:', uploadData);

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('case-attachments')
            .getPublicUrl(fileName);

          console.log('[NewCase] Public URL generated:', publicUrl);

          // Verify internal user ID before database insert
          if (!internalUserId) {
            console.error('[NewCase] No internal user ID available for attachment record');
            throw new Error('User ID not available');
          }

          // Create database record
          console.log('[NewCase] Creating attachment record in database...');
          const attachmentRecord = {
            case_id: caseId,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            uploaded_by: internalUserId,
            is_private: false
          };
          
          console.log('[NewCase] Attachment record data:', attachmentRecord);
          
          const { data: attachmentData, error: attachmentError } = await supabase
            .from('case_attachments')
            .insert(attachmentRecord)
            .select()
            .single();

          if (attachmentError) {
            console.error('[NewCase] Database record error:', attachmentError);
            throw new Error(`Database error: ${attachmentError.message}`);
          }

          console.log('[NewCase] Attachment record created successfully:', attachmentData);
          successCount++;
          
        } catch (error: any) {
          console.error(`[NewCase] Error uploading file ${file.name}:`, error);
          errorCount++;
          toast({
            title: 'Upload Error',
            description: `Failed to upload ${file.name}: ${error.message}`,
            variant: 'destructive'
          });
        }
      }

      console.log(`[NewCase] ==================== UPLOAD SUMMARY ====================`);
      console.log(`[NewCase] Successful uploads: ${successCount}`);
      console.log(`[NewCase] Failed uploads: ${errorCount}`);
      console.log(`[NewCase] Total files processed: ${files.length}`);

      if (successCount > 0) {
        toast({
          title: 'Files Uploaded',
          description: `Successfully uploaded ${successCount} out of ${files.length} files`,
        });
      }

      return successCount > 0;
      
    } catch (error: any) {
      console.error('[NewCase] Unexpected upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Unexpected error during file upload',
        variant: 'destructive'
      });
      return false;
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitAttempted(true);
    
    console.log('[NewCase] ==================== STARTING CASE SUBMISSION ====================');
    console.log('[NewCase] User:', user?.id);
    console.log('[NewCase] Internal User ID:', internalUserId);
    console.log('[NewCase] Form data:', formData);
    console.log('[NewCase] Files to upload:', files.length);
    console.log('[NewCase] Location data:', locationData);
    console.log('[NewCase] Tags:', tags);
    
    if (!user || !internalUserId) {
      console.error('[NewCase] Missing authentication data:', { user: !!user, internalUserId: !!internalUserId });
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to submit a case',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      console.error('[NewCase] Missing required form data:', {
        title: formData.title.trim(),
        description: formData.description.trim()
      });
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Calculate SLA due date
      const slaHours = 72;
      const slaDueAt = new Date();
      slaDueAt.setHours(slaDueAt.getHours() + slaHours);

      const caseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id || null,
        location: locationData.formatted_address || null,
        priority: formData.priority,
        status: 'open',
        submitted_by: internalUserId,
        sla_due_at: slaDueAt.toISOString(),
        visibility: 'public',
        tags: tags.length > 0 ? tags : null
      };

      console.log('[NewCase] ========== CREATING CASE ==========');
      console.log('[NewCase] Case data:', caseData);

      const { data: newCase, error: caseError } = await supabase
        .from('cases')
        .insert(caseData)
        .select()
        .single();

      if (caseError) {
        console.error('[NewCase] Case creation error:', caseError);
        throw new Error(`Failed to create case: ${caseError.message}`);
      }

      console.log('[NewCase] Case created successfully:', newCase);

      // Upload files if any
      if (files.length > 0) {
        console.log('[NewCase] Starting file uploads...');
        const uploadSuccess = await uploadFiles(newCase.id);
        console.log('[NewCase] File uploads completed, success:', uploadSuccess);
      } else {
        console.log('[NewCase] No files to upload, skipping file upload step');
      }

      // Log activity
      try {
        console.log('[NewCase] ========== LOGGING ACTIVITY ==========');
        const activityData = {
          case_id: newCase.id,
          activity_type: 'case_created',
          description: 'Case submitted by citizen',
          performed_by: internalUserId
        };
        
        console.log('[NewCase] Activity data:', activityData);
        
        const { data: activityResult, error: activityError } = await supabase
          .from('case_activities')
          .insert(activityData);
          
        if (activityError) {
          console.error('[NewCase] Activity logging error:', activityError);
        } else {
          console.log('[NewCase] Activity logged successfully:', activityResult);
        }
      } catch (activityError) {
        console.error('[NewCase] Activity logging failed:', activityError);
        // Continue even if activity logging fails
      }

      console.log('[NewCase] ========== SUBMISSION COMPLETE ==========');
      console.log('[NewCase] Case ID:', newCase.id);
      console.log('[NewCase] Navigating to case detail page...');

      toast({
        title: 'Success',
        description: 'Your case has been submitted successfully',
      });

      // Navigate to the case detail page
      navigate(`/citizen/cases/${newCase.id}`);

    } catch (error: any) {
      console.error('[NewCase] ========== SUBMISSION FAILED ==========');
      console.error('[NewCase] Error submitting case:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit case. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/citizen/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit New Case</CardTitle>
          <CardDescription>
            Describe your issue or request. Our team will review and respond within 72 hours.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Subject *</Label>
              <Input
                id="title"
                placeholder="Brief description of your issue"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                disabled={loading || uploadingFiles}
                className={submitAttempted && !formData.title.trim() ? 'border-red-500' : ''}
              />
              {submitAttempted && !formData.title.trim() && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Subject is required
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about your issue or request..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                required
                disabled={loading || uploadingFiles}
                className={submitAttempted && !formData.description.trim() ? 'border-red-500' : ''}
              />
              {submitAttempted && !formData.description.trim() && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Description is required
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleInputChange('category_id', value)}
                  disabled={loading || uploadingFiles}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                  disabled={loading || uploadingFiles}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - General inquiry</SelectItem>
                    <SelectItem value="medium">Medium - Standard request</SelectItem>
                    <SelectItem value="high">High - Urgent issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <div className="space-y-2">
                <Input
                  value={locationData.formatted_address}
                  onChange={(e) => setLocationData(prev => ({ ...prev, formatted_address: e.target.value }))}
                  placeholder="Enter address manually or use location services"
                  disabled={loading || uploadingFiles}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={requestGeolocation}
                    disabled={gettingLocation || loading || uploadingFiles}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {gettingLocation ? 'Getting Location...' : 'Use My Location'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMapPicker(true)}
                    disabled={loading || uploadingFiles}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Pick on Map
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (Optional)</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    disabled={loading || uploadingFiles}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    disabled={!newTag.trim() || loading || uploadingFiles}
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attachments (Optional)</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild disabled={uploadingFiles || loading}>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingFiles ? 'Processing...' : 'Choose Files'}
                      </span>
                    </Button>
                  </label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading || uploadingFiles}
                  />
                  <span className="text-sm text-gray-500">
                    Max 10MB per file. Supported: JPG, PNG, PDF, DOC, TXT
                  </span>
                </div>
                {files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected files ({files.length}):</p>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={uploadingFiles || loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/citizen/dashboard')}
                disabled={loading || uploadingFiles}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || uploadingFiles}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Submitting...' : uploadingFiles ? 'Processing files...' : 'Submit Case'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <MapPickerModal
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={(location) => setLocationData(location)}
        currentLocation={locationData}
      />
    </div>
  );
};

export default NewCase;
