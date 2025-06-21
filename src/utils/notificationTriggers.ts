
import { notifyExternalUserOfCaseUpdate, notifyInternalUsersOfCaseUpdate } from './externalNotificationUtils';

export const triggerCaseMessageNotification = async (
  caseId: string,
  caseTitle: string,
  message: string,
  senderId: string
) => {
  console.log('🔔 Triggering case message notifications');
  
  // Notify external users
  await notifyExternalUserOfCaseUpdate(
    caseId,
    caseTitle,
    'message_added',
    undefined,
    message,
    senderId
  );

  // Notify internal users
  await notifyInternalUsersOfCaseUpdate(
    caseId,
    caseTitle,
    'message_added',
    senderId,
    message
  );
};

export const triggerTaskAssignmentNotification = async (
  caseId: string,
  caseTitle: string,
  taskName: string,
  assignedUserId: string,
  assignedByUserId: string
) => {
  console.log('🔔 Triggering task assignment notifications');
  
  // Notify external users
  await notifyExternalUserOfCaseUpdate(
    caseId,
    caseTitle,
    'task_assigned',
    undefined,
    undefined,
    assignedByUserId,
    taskName
  );

  // Notify internal users
  await notifyInternalUsersOfCaseUpdate(
    caseId,
    caseTitle,
    'task_assigned',
    assignedByUserId,
    undefined,
    taskName,
    assignedUserId
  );
};

export const triggerCaseAssignmentNotification = async (
  caseId: string,
  caseTitle: string,
  assignedUserId: string,
  assignedByUserId: string
) => {
  console.log('🔔 Triggering case assignment notifications');
  
  // Notify external users
  await notifyExternalUserOfCaseUpdate(
    caseId,
    caseTitle,
    'case_assigned',
    undefined,
    undefined,
    assignedByUserId
  );

  // Notify internal users - specifically notify the assigned user
  await notifyInternalUsersOfCaseUpdate(
    caseId,
    caseTitle,
    'case_assigned',
    assignedByUserId,
    undefined,
    undefined,
    assignedUserId
  );
};

export const triggerCaseStatusChangeNotification = async (
  caseId: string,
  caseTitle: string,
  newStatus: string,
  updatedByUserId: string
) => {
  console.log('🔔 Triggering case status change notifications');
  
  // Notify external users
  await notifyExternalUserOfCaseUpdate(
    caseId,
    caseTitle,
    'status_change',
    newStatus,
    undefined,
    updatedByUserId
  );

  // Notify internal users
  await notifyInternalUsersOfCaseUpdate(
    caseId,
    caseTitle,
    'status_change',
    updatedByUserId,
    undefined,
    undefined,
    undefined,
    newStatus
  );
};

export const triggerRelatedCaseNotification = async (
  caseId: string,
  caseTitle: string,
  relatedCaseId: string,
  addedByUserId: string
) => {
  console.log('🔔 Triggering related case notifications');
  
  // Notify external users
  await notifyExternalUserOfCaseUpdate(
    caseId,
    caseTitle,
    'case_related',
    undefined,
    undefined,
    addedByUserId,
    undefined,
    relatedCaseId
  );

  // Notify internal users
  await notifyInternalUsersOfCaseUpdate(
    caseId,
    caseTitle,
    'case_related',
    addedByUserId
  );
};

export const triggerCaseClosedNotification = async (
  caseId: string,
  caseTitle: string,
  closedByUserId: string
) => {
  console.log('🔔 Triggering case closed notifications');
  
  // Notify external users
  await notifyExternalUserOfCaseUpdate(
    caseId,
    caseTitle,
    'case_closed',
    undefined,
    undefined,
    closedByUserId
  );
};
