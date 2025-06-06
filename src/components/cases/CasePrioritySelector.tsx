
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface CasePrioritySelectorProps {
  caseId: string;
  currentPriority: string;
  currentCategoryId?: string;
  onUpdate: () => void;
}

const CasePrioritySelector = ({ caseId, currentPriority, currentCategoryId, onUpdate }: CasePrioritySelectorProps) => {
  const [selectedPriority, setSelectedPriority] = useState(currentPriority);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const priorityOptions = [
    { value: 'urgent', label: 'Urgent', icon: AlertTriangle, color: 'text-red-600' },
    { value: 'high', label: 'High', icon: AlertTriangle, color: 'text-orange-600' },
    { value: 'medium', label: 'Medium', icon: Clock, color: 'text-yellow-600' },
    { value: 'low', label: 'Low', icon: CheckCircle, color: 'text-green-600' }
  ];

  const handlePriorityUpdate = async () => {
    if (selectedPriority === currentPriority) return;
    
    setLoading(true);
    try {
      // Calculate new SLA due date if category is available
      let slaDueAt = null;
      if (currentCategoryId) {
        const { data: slaData } = await supabase
          .from('category_sla_matrix')
          .select(`sla_${selectedPriority}`)
          .eq('category_id', currentCategoryId)
          .eq('is_active', true)
          .single();
        
        if (slaData) {
          const slaHours = slaData[`sla_${selectedPriority}`];
          if (slaHours) {
            const dueDate = new Date();
            dueDate.setHours(dueDate.getHours() + slaHours);
            slaDueAt = dueDate.toISOString();
          }
        }
      }

      // Update case priority and SLA
      const updateData: any = { priority: selectedPriority };
      if (slaDueAt) {
        updateData.sla_due_at = slaDueAt;
      }

      const { error } = await supabase
        .from('cases')
        .update(updateData)
        .eq('id', caseId);

      if (error) throw error;

      // Log activity
      await supabase
        .from('case_activities')
        .insert({
          case_id: caseId,
          activity_type: 'priority_changed',
          description: `Priority changed from ${currentPriority} to ${selectedPriority}${slaDueAt ? ' with updated SLA due date' : ''}`,
          performed_by: null // Will be set by auth context
        });

      toast({
        title: 'Priority Updated',
        description: `Case priority changed to ${selectedPriority}${slaDueAt ? ' and SLA due date recalculated' : ''}`,
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: 'Error',
        description: 'Failed to update priority',
        variant: 'destructive'
      });
      setSelectedPriority(currentPriority); // Reset on error
    } finally {
      setLoading(false);
    }
  };

  const selectedOption = priorityOptions.find(opt => opt.value === selectedPriority);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Priority Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Priority</label>
          <div className="flex items-center gap-2">
            {selectedOption && (
              <selectedOption.icon className={`h-4 w-4 ${selectedOption.color}`} />
            )}
            <span className="capitalize font-medium">{currentPriority}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Update Priority</label>
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className={`h-4 w-4 ${option.color}`} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPriority !== currentPriority && (
          <Button 
            onClick={handlePriorityUpdate}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Updating...' : 'Update Priority'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CasePrioritySelector;
