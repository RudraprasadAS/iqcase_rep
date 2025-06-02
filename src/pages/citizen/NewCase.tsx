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
import { ArrowLeft, MapPin, X, Map, Paperclip, Upload } from 'lucide-react';
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
  const [uploading, setUploading] = useState(false);
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
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (user) {
      fetchInternalUserId();
    }
    fetchCategories();
    requestGeolocation();
  }, [user]);

  const fetchInternalUserId = async () => {
    if (!user) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('User lookup error:', userError);
        return;
      }

      if (userData) {
        setInternalUserId(userData.id);
      }
    } catch (error) {
      console.error('Error fetching internal user ID:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('case_categories')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) {
        console.error('Categories fetch error:', categoriesError);
        throw categoriesError;
      }
      
      console.log('Categories fetched:', categoriesData);
      setCategories(categoriesData || []);

    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      });
    }
  };

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Got location:', latitude, longitude);
        
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
          console.error('Reverse geocoding failed:', error);
          setLocationData({
            latitude,
            longitude,
            formatted_address: `${latitude}, ${longitude}`
          });
        }
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
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
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (caseId: string) => {
    if (files.length === 0) return true;

    console.log('Starting file upload for case:', caseId);
    setUploading(true);
    let uploadCount = 0;

    try {
      for (const file of files) {
        try {
          // Validate file size (10MB limit)
          if (file.size > 10 * 1024 * 1024) {
            toast({
              title: 'File too large',
              description: `${file.name} exceeds 10MB limit`,
              variant: 'destructive'
            });
            continue;
          }

          const fileExt = file.name.split('.').pop();
          const fileName = `${caseId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          console.log('Uploading file:', fileName, 'Size:', file.size);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('case-attachments')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('File upload error:', uploadError);
            toast({
              title: 'Upload failed',
              description: `Failed to upload ${file.name}: ${uploadError.message}`,
              variant: 'destructive'
            });
            continue;
          }

          console.log('Upload successful:', uploadData);

          const { data: { publicUrl } } = supabase.storage
            .from('case-attachments')
            .getPublicUrl(fileName);

          console.log('Public URL generated:', publicUrl);

          const { error: attachmentError } = await supabase
            .from('case_attachments')
            .insert({
              case_id: caseId,
              file_name: file.name,
              file_url: publicUrl,
              file_type: file.type,
              uploaded_by: internalUserId,
              is_private: false
            });

          if (attachmentError) {
            console.error('Attachment record error:', attachmentError);
            toast({
              title: 'Database error',
              description: `Failed to save attachment record for ${file.name}`,
              variant: 'destructive'
            });
            continue;
          }

          uploadCount++;
          console.log('Attachment record created successfully for:', file.name);
        } catch (error) {
          console.error('Error uploading file:', file.name, error);
          toast({
            title: 'Upload error',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive'
          });
        }
      }

      if (uploadCount > 0) {
        toast({
          title: 'Files uploaded',
          description: `Successfully uploaded ${uploadCount} out of ${files.length} files`,
        });
      }

      console.log(`Successfully uploaded ${uploadCount} out of ${files.length} files`);
      return uploadCount > 0;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Starting case submission...');
    console.log('User:', user);
    console.log('Internal User ID:', internalUserId);
    console.log('Form data:', formData);
    console.log('Files to upload:', files.length);
    
    if (!user || !internalUserId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to submit a case',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
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

      console.log('Submitting case data:', caseData);

      const { data: newCase, error } = await supabase
        .from('cases')
        .insert(caseData)
        .select()
        .single();

      if (error) {
        console.error('Case creation error:', error);
        throw error;
      }

      console.log('Case created successfully:', newCase);

      // Upload files if any
      if (files.length > 0) {
        console.log('Starting file uploads...');
        try {
          await uploadFiles(newCase.id);
          console.log('File uploads completed');
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
          // Continue even if file upload fails
        }
      }

      // Log activity
      try {
        await supabase
          .from('case_activities')
          .insert({
            case_id: newCase.id,
            activity_type: 'case_created',
            description: 'Case submitted by citizen',
            performed_by: internalUserId
          });
      } catch (activityError) {
        console.error('Activity logging failed:', activityError);
        // Continue even if activity logging fails
      }

      toast({
        title: 'Success',
        description: 'Your case has been submitted successfully',
      });

      navigate(`/citizen/cases/${newCase.id}`);

    } catch (error: any) {
      console.error('Error submitting case:', error);
      toast({
        title: 'Error',
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
                disabled={loading}
              />
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
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleInputChange('category_id', value)}
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={requestGeolocation}
                    disabled={gettingLocation || loading}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {gettingLocation ? 'Getting Location...' : 'Use My Location'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMapPicker(true)}
                    disabled={loading}
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
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    disabled={!newTag.trim() || loading}
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
                    <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Choose Files'}
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
                    disabled={loading || uploading}
                  />
                  <span className="text-sm text-gray-500">
                    Max 10MB per file. Supported: JPG, PNG, PDF, DOC, TXT
                  </span>
                </div>
                {files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected files ({files.length}):</p>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
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
                          disabled={uploading}
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
                disabled={loading || uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || uploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Submitting...' : uploading ? 'Uploading files...' : 'Submit Case'}
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
