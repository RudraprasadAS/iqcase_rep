import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'sla_due' | 'task_due' | 'case_created';
  priority: 'high' | 'medium' | 'low';
  status: string;
  caseId?: string;
  taskId?: string;
}

const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'sla_due' | 'task_due'>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCalendarEvents();
  }, [currentMonth, viewMode]);

  useEffect(() => {
    if (selectedDate) {
      const dayEvents = events.filter(event => isSameDay(event.date, selectedDate));
      setSelectedEvents(dayEvents);
    }
  }, [selectedDate, events]);

  const normalizePriority = (priority: string | null): 'high' | 'medium' | 'low' => {
    if (!priority) return 'medium';
    const normalizedPriority = priority.toLowerCase();
    if (normalizedPriority === 'high' || normalizedPriority === 'medium' || normalizedPriority === 'low') {
      return normalizedPriority as 'high' | 'medium' | 'low';
    }
    return 'medium';
  };

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const calendarEvents: CalendarEvent[] = [];

      // Fetch cases with SLA due dates
      if (viewMode === 'all' || viewMode === 'sla_due') {
        const { data: casesWithSLA, error: casesError } = await supabase
          .from('cases')
          .select('id, title, sla_due_at, priority, status')
          .not('sla_due_at', 'is', null)
          .gte('sla_due_at', monthStart.toISOString())
          .lte('sla_due_at', monthEnd.toISOString())
          .neq('status', 'closed');

        if (casesError) throw casesError;

        casesWithSLA?.forEach(case_ => {
          calendarEvents.push({
            id: `case-sla-${case_.id}`,
            title: `SLA Due: ${case_.title}`,
            date: new Date(case_.sla_due_at),
            type: 'sla_due',
            priority: normalizePriority(case_.priority),
            status: case_.status,
            caseId: case_.id
          });
        });
      }

      // Fetch tasks with due dates
      if (viewMode === 'all' || viewMode === 'task_due') {
        const { data: tasksWithDue, error: tasksError } = await supabase
          .from('case_tasks')
          .select(`
            id, 
            task_name, 
            due_date, 
            status,
            case_id,
            cases!inner(title, priority)
          `)
          .not('due_date', 'is', null)
          .gte('due_date', monthStart.toISOString())
          .lte('due_date', monthEnd.toISOString())
          .neq('status', 'completed');

        if (tasksError) throw tasksError;

        tasksWithDue?.forEach(task => {
          calendarEvents.push({
            id: `task-${task.id}`,
            title: `Task: ${task.task_name}`,
            date: new Date(task.due_date),
            type: 'task_due',
            priority: normalizePriority(task.cases?.priority),
            status: task.status,
            caseId: task.case_id,
            taskId: task.id
          });
        });
      }

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar events',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sla_due':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'task_due':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'sla_due':
        return 'border-l-red-500';
      case 'task_due':
        return 'border-l-yellow-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const hasEventsOnDate = (date: Date) => {
    return events.some(event => isSameDay(event.date, date));
  };

  const isOverdue = (date: Date) => {
    return date < new Date() && events.some(event => 
      isSameDay(event.date, date) && event.type === 'sla_due'
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'prev' 
      ? subMonths(currentMonth, 1) 
      : addMonths(currentMonth, 1)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="sla_due">SLA Due</SelectItem>
                  <SelectItem value="task_due">Task Due</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="w-full"
              modifiers={{
                hasEvents: (date) => hasEventsOnDate(date),
                overdue: (date) => isOverdue(date)
              }}
              modifiersStyles={{
                hasEvents: { 
                  backgroundColor: '#dbeafe', 
                  fontWeight: 'bold' 
                },
                overdue: { 
                  backgroundColor: '#fee2e2', 
                  color: '#dc2626' 
                }
              }}
            />
            <div className="flex items-center justify-center space-x-4 mt-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-100 border rounded mr-2"></div>
                <span>Has Events</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-100 border rounded mr-2"></div>
                <span>Overdue</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEvents.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No events on this date
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className={`p-3 border-l-4 border border-gray-200 rounded-r ${getEventTypeColor(event.type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        {getEventIcon(event.type)}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(event.date, 'h:mm a')}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(event.priority)}`}
                      >
                        {event.priority}
                      </Badge>
                    </div>
                    {event.caseId && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto text-blue-600 text-xs mt-2"
                        onClick={() => window.open(`/cases/${event.caseId}`, '_blank')}
                      >
                        View Case →
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm">SLA Due</span>
              </div>
              <Badge variant="destructive">
                {events.filter(e => e.type === 'sla_due').length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Tasks Due</span>
              </div>
              <Badge variant="secondary">
                {events.filter(e => e.type === 'task_due').length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Total Events</span>
              </div>
              <Badge>
                {events.length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarView;
