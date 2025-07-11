import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, X, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
      return null;
    }

    try {
      console.log('[NewCase] Fetching internal user ID for auth user:', user.id);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role_id, user_type, is_active')
        .eq('auth_user_id', user.id)
        .single();

      console.log('[NewCase] User lookup response:', { userData, userError });

      if (userError) {
        console.error('[NewCase] User lookup error:', userError);
        toast({
          title: 'Authentication Error',
          description: 'Failed to verify user identity',
          variant: 'destructive'
        });
        return null;
      }

      if (userData) {
        console.log('[NewCase] Internal user found:', userData);
        setInternalUserId(userData.id);
        
        // Also get role information for debugging
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('name, role_type')
          .eq('id', userData.role_id)
          .single();
          
        console.log('[NewCase] User role info:', { roleData, roleError });
        
        return userData.id;
      } else {
        console.error('[NewCase] No internal user found for auth user:', user.id);
        toast({
          title: 'User Not Found',
          description: 'Your user profile was not found. Please contact support.',
          variant: 'destructive'
        });
        return null;
      }
    } catch (error) {
      console.error('[NewCase] Error fetching internal user ID:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user information',
        variant: 'destructive'
      });
      return null;
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('case_categories')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) throw categoriesError;
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
    if (!navigator.geolocation) return;

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
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

  const getSLADueDate = async (categoryId: string, priority: string) => {
    try {
      // Look up SLA hours from category_sla_matrix table
      const { data: slaData, error: slaError } = await supabase
        .from('category_sla_matrix')
        .select('sla_low, sla_medium, sla_high')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .single();

      if (slaError || !slaData) {
        console.log('No SLA configuration found for category, using default 72 hours');
        return new Date(Date.now() + 72 * 60 * 60 * 1000);
      }

      let slaHours = 72; // Default fallback
      
      switch (priority.toLowerCase()) {
        case 'low':
          slaHours = slaData.sla_low || 96;
          break;
        case 'medium':
          slaHours = slaData.sla_medium || 48;
          break;
        case 'high':
          slaHours = slaData.sla_high || 24;
          break;
        default:
          slaHours = slaData.sla_medium || 48;
      }

      return new Date(Date.now() + slaHours * 60 * 60 * 1000);
    } catch (error) {
      console.error('Error fetching SLA configuration:', error);
      return new Date(Date.now() + 72 * 60 * 60 * 1000); // Fallback to 72 hours
    }
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
    if (files.length === 0) return;

    console.log('Uploading files for case:', caseId);

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${caseId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        console.log('Uploading file:', fileName);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('case-attachments')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('File upload error:', uploadError);
          throw uploadError;
        }

        console.log('Upload successful:', uploadData);

        const { data: { publicUrl } } = supabase.storage
          .from('case-attachments')
          .getPublicUrl(fileName);

        console.log('Public URL:', publicUrl);

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
          throw attachmentError;
        }

        console.log('Attachment record created successfully');
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        toast({
          title: 'Warning',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive'
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[NewCase] ==================== STARTING CASE SUBMISSION ====================');
    console.log('[NewCase] User:', user?.id);
    console.log('[NewCase] Internal User ID:', internalUserId);
    console.log('[NewCase] Form data:', formData);
    
    if (!user) {
      console.error('[NewCase] No authenticated user found');
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to submit a case',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      console.error('[NewCase] Missing required form data');
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Ensure we have a valid internal user ID
      let validInternalUserId = internalUserId;
      
      if (!validInternalUserId) {
        console.log('[NewCase] Internal user ID not cached, fetching now...');
        validInternalUserId = await fetchInternalUserId();
        
        if (!validInternalUserId) {
          console.error('[NewCase] Failed to get internal user ID during submission');
          toast({
            title: 'Authentication Error',
            description: 'Unable to verify your user account. Please try refreshing the page or contact support.',
            variant: 'destructive'
          });
          return;
        }
      }

      console.log('[NewCase] Using internal user ID for submission:', validInternalUserId);

      // Get dynamic SLA due date
      const slaDueAt = await getSLADueDate(formData.category_id, formData.priority);

      const caseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id || null,
        location: locationData.formatted_address || null,
        priority: formData.priority,
        status: 'open',
        submitted_by: validInternalUserId, // Caseworker creates case using their own ID
        sla_due_at: slaDueAt.toISOString(),
        visibility: 'internal',
        tags: tags.length > 0 ? tags : null
      };

      console.log('[NewCase] About to submit case with data:', caseData);

      const { data: newCase, error } = await supabase
        .from('cases')
        .insert(caseData)
        .select()
        .single();

      if (error) {
        console.error('[NewCase] Case creation error:', error);
        console.error('[NewCase] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('[NewCase] Case created successfully:', newCase);

      // Upload files after case creation
      if (files.length > 0) {
        try {
          await uploadFiles(newCase.id);
        } catch (uploadError) {
          console.error('[NewCase] File upload failed:', uploadError);
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
            description: 'Case created by staff',
            performed_by: validInternalUserId
          });
      } catch (activityError) {
        console.error('[NewCase] Activity logging failed:', activityError);
        // Continue even if activity logging fails
      }

      toast({
        title: 'Success',
        description: 'Case created successfully'
      });

      navigate(`/cases/${newCase.id}`);

    } catch (error: any) {
      console.error('[NewCase] Submission failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create case. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>New Case - IQCase</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/cases')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
          <h1 className="text-3xl font-bold">Create New Case</h1>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Subject *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Brief description of the issue"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  placeholder="Detailed description of the issue or request"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - General inquiry</SelectItem>
                      <SelectItem value="medium">Medium - Standard request</SelectItem>
                      <SelectItem value="high">High - Urgent issue</SelectItem>
                      <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
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
                  <Input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/cases')} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Case'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <MapPickerModal
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={(location) => setLocationData(location)}
        currentLocation={locationData}
      />
    </>
  );
};

export default NewCase;
