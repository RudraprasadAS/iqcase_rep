
export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: string;
  caseId?: string;
  sourceId?: string;
  sourceType?: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  data?: any;
  error?: any;
  message?: string;
}
