
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
import { ArrowLeft, Upload, MapPin, X, Map } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationData, setLocationData] = useState<LocationData>({
    latitude: null,
    longitude: null,
    formatted_address: ''
  });
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchFormData();
    requestGeolocation();
  }, []);

  const fetchFormData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('case_categories')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, address, city, state')
        .eq('is_active', true)
        .order('name');

      if (locationsError) throw locationsError;
      setLocations(locationsData || []);

    } catch (error) {
      console.error('Error fetching form data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form data',
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
        
        // Reverse geocode using Nominatim API
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
    if (files.length === 0) return;

    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${caseId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('case-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('case-attachments')
        .getPublicUrl(fileName);

      // Save to attachments table
      const { error: attachmentError } = await supabase
        .from('case_attachments')
        .insert({
          case_id: caseId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          uploaded_by: user?.id,
          is_private: false
        });

      if (attachmentError) throw attachmentError;
    });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
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
      // Calculate SLA due date (default 72 hours for citizen cases)
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
        submitted_by: user.id,
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
        await uploadFiles(newCase.id);
      }

      // Create initial activity log
      await supabase
        .from('case_activities')
        .insert({
          case_id: newCase.id,
          activity_type: 'case_created',
          description: 'Case submitted by citizen',
          performed_by: user.id
        });

      toast({
        title: 'Success',
        description: 'Your case has been submitted successfully',
      });

      navigate(`/citizen/cases/${newCase.id}`);

    } catch (error) {
      console.error('Error submitting case:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit case. Please try again.',
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

            {/* Location Section */}
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
                    disabled={loading}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Pick on Map
                  </Button>
                </div>
              </div>
            </div>

            {/* Tags Section */}
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

            {/* File Upload Section */}
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

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/citizen/dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Submitting...' : 'Submit Case'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewCase;
