
// Export all notification utilities from a single entry point
export * from './types';
export * from './helpers';
export * from './taskNotifications';
export * from './caseNotifications';
export * from './mentionNotifications';
export * from './watcherNotifications';
export * from './generalNotifications';

// Legacy exports for backward compatibility
export { createTaskAssignmentNotification } from './taskNotifications';
export { createCaseAssignmentNotification, createCaseStatusChangeNotification, createExternalUserNotification } from './caseNotifications';
export { createMentionNotification } from './mentionNotifications';
export { createNotification } from './generalNotifications';
export { testNotificationCreation, isExternalUser } from './helpers';
