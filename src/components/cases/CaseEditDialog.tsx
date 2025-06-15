
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logCaseUpdated, logCaseAssigned, logCaseUnassigned, logPriorityChanged, logStatusChanged } from '@/utils/activityLogger';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const [internalUserId, setInternalUserId] = useState<string | null>(null);

  // Fetch internal user ID when component loads
  useEffect(() => {
    if (user) {
      fetchInternalUserId();
    }
  }, [user]);

  const fetchInternalUserId = async () => {
    if (!user) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        console.error('User lookup error:', userError);
        return;
      }

      setInternalUserId(userData.id);
    } catch (error) {
      console.error('Error fetching internal user ID:', error);
    }
  };

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
    if (!caseData || !internalUserId) return;

    setLoading(true);
    try {
      // Track changes for activity logging
      const changes: Record<string, { old: any, new: any }> = {};
      
      // Check for assignment changes
      if (
        (caseData.assigned_to === null && formData.assigned_to !== 'unassigned') || 
        (caseData.assigned_to !== null && formData.assigned_to === 'unassigned') || 
        (caseData.assigned_to !== formData.assigned_to && formData.assigned_to !== 'unassigned')
      ) {
        changes.assigned_to = {
          old: caseData.assigned_to || null,
          new: formData.assigned_to === 'unassigned' ? null : formData.assigned_to
        };
      }
      
      // Check for status changes
      if (caseData.status !== formData.status) {
        changes.status = {
          old: caseData.status,
          new: formData.status
        };
      }
      
      // Check for priority changes
      if (caseData.priority !== formData.priority) {
        changes.priority = {
          old: caseData.priority,
          new: formData.priority
        };
      }
      
      // Check for title changes
      if (caseData.title !== formData.title) {
        changes.title = {
          old: caseData.title,
          new: formData.title
        };
      }
      
      // Check for description changes
      if (caseData.description !== formData.description) {
        changes.description = {
          old: caseData.description || '',
          new: formData.description || ''
        };
      }
      
      // Check for category changes
      if ((caseData.category_id || 'none') !== formData.category_id) {
        changes.category_id = {
          old: caseData.category_id || null,
          new: formData.category_id === 'none' ? null : formData.category_id
        };
      }

      // Clean the data before sending
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        updated_at: new Date().toISOString()
      };

      // Handle category_id - only include if it's not 'none'
      if (formData.category_id && formData.category_id !== 'none') {
        updateData.category_id = formData.category_id;
      } else {
        updateData.category_id = null;
      }

      // Handle assigned_to - only include if it's not 'unassigned'
      if (formData.assigned_to && formData.assigned_to !== 'unassigned') {
        updateData.assigned_to = formData.assigned_to;
      } else {
        updateData.assigned_to = null;
      }

      console.log('Updating case with cleaned data:', updateData);

      const { data, error } = await supabase
        .from('cases')
        .update(updateData)
        .eq('id', caseData.id)
        .select(`
          *,
          submitted_by_user:users!cases_submitted_by_fkey(name, email),
          assigned_to_user:users!cases_assigned_to_fkey(name, email),
          category:case_categories!cases_category_id_fkey(name)
        `)
        .single();

      if (error) throw error;

      console.log('Case updated successfully, returned data:', data);

      // Log specific activities based on what changed
      const logPromises = [];
      
      // Handle specific logging for important changes
      if (changes.assigned_to) {
        if (changes.assigned_to.new) {
          // Find the assignee name
          const assigneeUser = users.find(u => u.id === changes.assigned_to.new);
          const assigneeName = assigneeUser ? assigneeUser.name : 'Unknown user';
          logPromises.push(logCaseAssigned(caseData.id, assigneeName, internalUserId));
        } else {
          logPromises.push(logCaseUnassigned(caseData.id, internalUserId));
        }
      }
      
      if (changes.status) {
        logPromises.push(logStatusChanged(caseData.id, changes.status.old, changes.status.new, internalUserId));
      }
      
      if (changes.priority) {
        logPromises.push(logPriorityChanged(caseData.id, changes.priority.old, changes.priority.new, internalUserId));
      }
      
      // Log any other changes
      const otherChanges = { ...changes };
      delete otherChanges.assigned_to;
      delete otherChanges.status;
      delete otherChanges.priority;
      
      if (Object.keys(otherChanges).length > 0) {
        logPromises.push(logCaseUpdated(caseData.id, otherChanges, internalUserId));
      }
      
      // Wait for all log operations to complete
      await Promise.all(logPromises);

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
