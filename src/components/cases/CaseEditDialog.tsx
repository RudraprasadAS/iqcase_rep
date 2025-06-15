
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  triggerCaseAssignmentNotification, 
  triggerCaseStatusChangeNotification, 
  triggerCaseClosedNotification 
} from '@/utils/notificationTriggers';

interface Case {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  category_id: string;
  tags: string[];
  location?: string;
}

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface CaseEditDialogProps {
  case: Case;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCaseUpdated: () => void;
}

const CaseEditDialog = ({ case: caseData, isOpen, onOpenChange, onCaseUpdated }: CaseEditDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: caseData.title,
    description: caseData.description || '',
    status: caseData.status,
    priority: caseData.priority,
    assigned_to: caseData.assigned_to || '',
    category_id: caseData.category_id,
    tags: caseData.tags,
    location: caseData.location || '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      title: caseData.title,
      description: caseData.description || '',
      status: caseData.status,
      priority: caseData.priority,
      assigned_to: caseData.assigned_to || '',
      category_id: caseData.category_id,
      tags: caseData.tags,
      location: caseData.location || '',
    });
  }, [caseData]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('case_categories')
          .select('*')
          .order('name');

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('is_active', true)
          .eq('user_type', 'internal')
          .order('name');

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchCategories();
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const updates: any = {};
      const originalCase = caseData;
      
      // Track what changed for notifications
      if (originalCase.title !== formData.title) updates.title = formData.title;
      if (originalCase.description !== formData.description) updates.description = formData.description;
      if (originalCase.status !== formData.status) updates.status = formData.status;
      if (originalCase.priority !== formData.priority) updates.priority = formData.priority;
      if (originalCase.assigned_to !== formData.assigned_to) updates.assigned_to = formData.assigned_to;
      if (originalCase.category_id !== formData.category_id) updates.category_id = formData.category_id;

      const { error } = await supabase
        .from('cases')
        .update({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          assigned_to: formData.assigned_to || null,
          category_id: formData.category_id,
          tags: formData.tags,
          location: formData.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseData.id);

      if (error) throw error;

      // Get current user ID for notifications
      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (currentUser) {
        // Trigger case assignment notification if assigned user changed
        if (updates.assigned_to && updates.assigned_to !== originalCase.assigned_to) {
          console.log('🔔 Triggering case assignment notification');
          await triggerCaseAssignmentNotification(
            caseData.id,
            formData.title,
            updates.assigned_to,
            currentUser.id
          );
        }

        // Trigger status change notification if status changed
        if (updates.status && updates.status !== originalCase.status) {
          console.log('🔔 Triggering case status change notification');
          await triggerCaseStatusChangeNotification(
            caseData.id,
            formData.title,
            updates.status,
            currentUser.id
          );
        }

        // Trigger case closed notification if status changed to closed
        if (updates.status === 'closed' && originalCase.status !== 'closed') {
          console.log('🔔 Triggering case closed notification');
          await triggerCaseClosedNotification(
            caseData.id,
            formData.title,
            currentUser.id
          );
        }
      }

      toast({
        title: "Success",
        description: "Case updated successfully"
      });

      onCaseUpdated();
      onOpenChange(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Case</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))} >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">
              Priority
            </Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="assigned_to" className="text-right">
              Assign To
            </Label>
            <Select value={formData.assigned_to} onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category_id" className="text-right">
              Category
            </Label>
            <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select category" />
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Location
            </Label>
            <Input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaseEditDialog;
