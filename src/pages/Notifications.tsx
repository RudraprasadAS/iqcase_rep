
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Bell, Check, CheckCheck, Trash2, Search, Filter } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow, format, isToday, isYesterday, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    loading 
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status
    if (filter === 'unread' && notification.is_read) return false;
    if (filter === 'read' && !notification.is_read) return false;

    // Filter by type
    if (typeFilter !== 'all' && notification.notification_type !== typeFilter) return false;

    // Filter by search query
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  const groupedNotifications = filteredNotifications.reduce((groups: Record<string, any[]>, notification) => {
    const date = new Date(notification.created_at);
    let key: string;

    if (isToday(date)) {
      key = 'Today';
    } else if (isYesterday(date)) {
      key = 'Yesterday';
    } else {
      key = format(date, 'MMMM d, yyyy');
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notification);
    return groups;
  }, {});

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.case_id) {
      navigate(`/cases/${notification.case_id}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'case_assignment':
        return '👤';
      case 'new_message':
        return '💬';
      case 'case_status_change':
        return '📋';
      case 'task_assignment':
        return '✅';
      default:
        return '🔔';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'case_assignment':
        return 'Case Assignment';
      case 'new_message':
        return 'New Message';
      case 'case_status_change':
        return 'Status Change';
      case 'task_assignment':
        return 'Task Assignment';
      default:
        return 'Notification';
    }
  };

  const uniqueTypes = [...new Set(notifications.map(n => n.notification_type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Bell className="h-8 w-8 mr-3" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated with your case activities and assignments
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} className="bg-blue-600 hover:bg-blue-700">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {getTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Tabs */}
      <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({notifications.length - unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {Object.keys(groupedNotifications).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-500">
                  {filter === 'unread' ? "You're all caught up!" : "No notifications match your filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
              <Card key={date}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{date}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dateNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-4 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-gray-200'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="text-2xl">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(notification.notification_type)}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {format(new Date(notification.created_at), 'h:mm a')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notifications;
