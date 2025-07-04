import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Notifications API
  async getNotifications() {
    return this.request('/notifications');
  }

  async getUnreadCount() {
    return this.request('/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'PATCH',
    });
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async createTaskAssignmentNotification(data: {
    assignedUserId: string;
    taskName: string;
    caseId: string;
    createdByUserId: string;
  }) {
    return this.request('/notifications/task-assignment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createCaseAssignmentNotification(data: {
    assignedUserId: string;
    caseTitle: string;
    caseId: string;
    createdByUserId: string;
  }) {
    return this.request('/notifications/case-assignment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async notifyRelevantUsers(data: {
    caseId: string;
    activityType: string;
    message: string;
    performedBy: string;
    excludeUserId?: string;
  }) {
    return this.request('/notifications/activity-notification', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Permissions API
  async checkPermission(elementKey: string, permissionType: 'view' | 'edit' = 'view') {
    return this.request(`/permissions/check?elementKey=${elementKey}&permissionType=${permissionType}`);
  }

  async bulkCheckPermissions(permissions: Array<{ elementKey: string; permissionType: 'view' | 'edit' }>) {
    return this.request('/permissions/bulk-check', {
      method: 'POST',
      body: JSON.stringify(permissions),
    });
  }

  // Users API
  async getCurrentUser() {
    return this.request('/users/me');
  }

  async getAllUsers() {
    return this.request('/users');
  }

  async getUserById(userId: string) {
    return this.request(`/users/${userId}`);
  }

  // Audit API
  async logCaseActivity(data: {
    caseId: string;
    activityType: string;
    description: string;
    performedBy: string;
    actorId?: string;
    metadata?: any;
  }) {
    return this.request('/audit/case-activity', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logMessageAdded(data: {
    caseId: string;
    message: string;
    isInternal: boolean;
    performedBy: string;
  }) {
    return this.request('/audit/message-added', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logTaskCreated(data: {
    caseId: string;
    taskName: string;
    assignedTo: string | null;
    performedBy: string;
  }) {
    return this.request('/audit/task-created', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();