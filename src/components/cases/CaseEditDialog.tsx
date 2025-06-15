
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationService } from '@/hooks/useNotificationService';

interface CaseData {
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
  sla_due_at?: string;
  location?: string;
  tags?: string[];
}

interface CaseEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CaseData;
  onSave: () => void;
}

const CaseEditDialog = ({ isOpen, onClose, caseData, onSave }: CaseEditDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    assigned_to: '',
  });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { notifyCaseAssignment } = useNotificationService();

  useEffect(() => {
    if (caseData) {
      setFormData({
        title: caseData.title || '',
        description: caseData.description || '',
        status: caseData.status || '',
        priority: caseData.priority || '',
        assigned_to: caseData.assigned_to || '',
      });
    }
  }, [caseData]);

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleSave = async () => {
    setLoading(true);
    try {
      const previousAssignedTo = caseData?.assigned_to;
      
      const { error } = await supabase
        .from('cases')
        .update({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          assigned_to: formData.assigned_to || null,
        })
        .eq('id', caseData.id);

      if (error) throw error;

      // Send notification if case is being assigned to someone new
      if (formData.assigned_to && formData.assigned_to !== previousAssignedTo) {
        console.log('🔔 Triggering case assignment notification:', {
          caseId: caseData.id,
          caseTitle: formData.title,
          assignedUserId: formData.assigned_to,
          previousAssignedTo
        });
        
        await notifyCaseAssignment(
          caseData.id,
          formData.title,
          formData.assigned_to
        );
      }

      toast({
        title: "Success",
        description: "Case updated successfully",
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating case:', error);
      toast({
        title: "Error",
        description: "Failed to update case",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Case</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
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

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
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
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaseEditDialog;
