
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Case {
  id: string;
  title: string;
  status: string;
  priority: string;
  category_id?: string;
  submitted_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  description?: string;
}

interface CaseEditDialogProps {
  case: Case | null;
  isOpen: boolean;
  onClose: () => void;
  onCaseUpdate: (updatedCase: Case) => void;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Category {
  id: string;
  name: string;
}

const CaseEditDialog = ({ case: caseData, isOpen, onClose, onCaseUpdate }: CaseEditDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    category_id: '',
    assigned_to: ''
  });
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (caseData && isOpen) {
      setFormData({
        title: caseData.title || '',
        description: caseData.description || '',
        status: caseData.status || '',
        priority: caseData.priority || '',
        category_id: caseData.category_id || 'none',
        assigned_to: caseData.assigned_to || 'unassigned'
      });
      fetchUsers();
      fetchCategories();
    }
  }, [caseData, isOpen]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('is_active', true);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('case_categories')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;

    setLoading(true);
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        category_id: formData.category_id === 'none' ? null : formData.category_id,
        assigned_to: formData.assigned_to === 'unassigned' ? null : formData.assigned_to,
        updated_at: new Date().toISOString()
      };

      console.log('Updating case with data:', updateData);

      const { data, error } = await supabase
        .from('cases')
        .update(updateData)
        .eq('id', caseData.id)
        .select()
        .single();

      if (error) throw error;

      onCaseUpdate(data);
      onClose();
      toast({
        title: "Success",
        description: "Case updated successfully"
      });
    } catch (error) {
      console.error('Error updating case:', error);
      toast({
        title: "Error",
        description: "Failed to update case",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!caseData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Case</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Case ID</Label>
              <div className="text-sm">{caseData?.id}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Submitted By</Label>
              <div className="text-sm">{caseData?.submitted_by}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
              <div className="text-sm">{caseData ? formatDate(caseData.created_at) : ''}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
              <div className="text-sm">{caseData ? formatDate(caseData.updated_at) : ''}</div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Select value={formData.assigned_to} onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CaseEditDialog;
