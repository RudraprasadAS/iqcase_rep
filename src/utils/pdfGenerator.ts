
import jsPDF from 'jspdf';
import { formatDate, formatDateTime } from '@/lib/utils';

interface CaseData {
  id: string;
  title: string;
  status: string;
  priority: string;
  category?: { name: string };
  submitted_by_user?: { name: string; email: string };
  assigned_to_user?: { name: string; email: string };
  created_at: string;
  updated_at: string;
  description?: string;
  sla_due_at?: string;
  location?: string;
  tags?: string[];
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  is_internal: boolean;
  users?: { name: string; email: string };
}

interface Attachment {
  id: string;
  file_name: string;
  created_at: string;
  file_type?: string;
}

interface Activity {
  id: string;
  activity_type: string;
  description?: string;
  duration_minutes?: number;
  created_at: string;
  users?: { name: string; email: string };
}

interface Task {
  id: string;
  task_name: string;
  status: string;
  due_date?: string;
  created_at: string;
  assigned_to_user?: { name: string };
}

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  submitted_at: string;
  users?: { name: string; email: string };
}

interface PDFData {
  caseData: CaseData;
  messages: Message[];
  attachments: Attachment[];
  activities: Activity[];
  tasks?: Task[];
  feedback?: Feedback[];
  relatedCases?: any[];
  watchers?: any[];
}

export const generateCasePDF = (data: PDFData): void => {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Helper functions
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: string = '#000000') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color);
    
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * (fontSize * 0.5) + 5;
  };

  const addSection = (title: string) => {
    yPosition += 10;
    addText(title, 14, true, '#1f2937');
    yPosition += 5;
    
    // Add line separator
    doc.setDrawColor('#e5e7eb');
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  };

  const generateCaseNumber = (id: string, createdAt: string) => {
    const year = new Date(createdAt).getFullYear();
    const shortId = id.slice(-6).toUpperCase();
    return `#${year}-${shortId}`;
  };

  const getSLAStatus = (sla_due_at?: string, status?: string) => {
    if (!sla_due_at || status === 'closed' || status === 'resolved') {
      return 'N/A';
    }

    const dueDate = new Date(sla_due_at);
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const hoursRemaining = timeDiff / (1000 * 60 * 60);

    if (hoursRemaining < 0) {
      const hoursOverdue = Math.abs(hoursRemaining);
      return `BREACHED (${Math.round(hoursOverdue)} hours overdue)`;
    } else if (hoursRemaining < 2) {
      return `CRITICAL (Due in ${Math.round(hoursRemaining)} hours)`;
    } else if (hoursRemaining < 24) {
      return `Due in ${Math.round(hoursRemaining)} hours`;
    }
    return `Due in ${Math.round(hoursRemaining / 24)} days`;
  };

  // Header
  addText('CASE REPORT', 20, true, '#1f2937');
  addText(`Case ${generateCaseNumber(data.caseData.id, data.caseData.created_at)}`, 16, true, '#374151');
  yPosition += 10;

  // Case Overview
  addSection('Case Overview');
  addText(`Subject: ${data.caseData.title}`, 12, true);
  addText(`Status: ${data.caseData.status.toUpperCase()}`, 11);
  addText(`Priority: ${data.caseData.priority.toUpperCase()}`, 11);
  addText(`Created: ${formatDateTime(data.caseData.created_at)}`, 11);
  if (data.caseData.sla_due_at) {
    addText(`SLA Due: ${formatDateTime(data.caseData.sla_due_at)}`, 11);
    addText(`SLA Status: ${getSLAStatus(data.caseData.sla_due_at, data.caseData.status)}`, 11);
  }

  // Core Fields
  addSection('Case Details');
  addText(`Submitted By: ${data.caseData.submitted_by_user?.name || data.caseData.submitted_by_user?.email || 'Unknown'}`, 11);
  addText(`Assigned To: ${data.caseData.assigned_to_user?.name || 'Unassigned'}`, 11);
  if (data.caseData.category) {
    addText(`Category: ${data.caseData.category.name}`, 11);
  }
  if (data.caseData.location) {
    addText(`Location: ${data.caseData.location}`, 11);
  }
  
  yPosition += 5;
  addText('Description:', 11, true);
  addText(data.caseData.description || 'No description provided', 10);

  if (data.caseData.tags && data.caseData.tags.length > 0) {
    yPosition += 5;
    addText(`Tags: ${data.caseData.tags.join(', ')}`, 10);
  }

  // Attachments
  if (data.attachments.length > 0) {
    addSection(`Attachments (${data.attachments.length})`);
    data.attachments.forEach(attachment => {
      addText(`• ${attachment.file_name} (${attachment.file_type || 'Unknown type'}) - ${formatDateTime(attachment.created_at)}`, 10);
    });
  }

  // Messages
  if (data.messages.length > 0) {
    addSection(`Messages & Communication (${data.messages.length})`);
    data.messages.forEach(message => {
      const senderName = message.users?.name || message.users?.email || 'Unknown';
      const messageType = message.is_internal ? '[INTERNAL] ' : '[EXTERNAL] ';
      addText(`${messageType}${senderName} - ${formatDateTime(message.created_at)}`, 10, true);
      addText(message.message, 9);
      yPosition += 3;
    });
  }

  // Tasks
  if (data.tasks && data.tasks.length > 0) {
    addSection(`Tasks (${data.tasks.length})`);
    data.tasks.forEach(task => {
      addText(`• ${task.task_name} - Status: ${task.status.toUpperCase()}`, 10, true);
      if (task.assigned_to_user) {
        addText(`  Assigned to: ${task.assigned_to_user.name}`, 9);
      }
      if (task.due_date) {
        addText(`  Due: ${formatDateTime(task.due_date)}`, 9);
      }
      addText(`  Created: ${formatDateTime(task.created_at)}`, 9);
      yPosition += 2;
    });
  }

  // Activities
  if (data.activities.length > 0) {
    addSection(`Recent Activities (${data.activities.length})`);
    data.activities.slice(0, 10).forEach(activity => {
      const actorName = activity.users?.name || activity.users?.email || 'System';
      addText(`• ${activity.activity_type.replace(/_/g, ' ')} - ${actorName} - ${formatDateTime(activity.created_at)}`, 9);
      if (activity.description) {
        addText(`  ${activity.description}`, 8);
      }
    });
  }

  // Feedback
  if (data.feedback && data.feedback.length > 0) {
    addSection(`Customer Feedback (${data.feedback.length})`);
    data.feedback.forEach(fb => {
      addText(`Rating: ${fb.rating}/5 stars - ${formatDateTime(fb.submitted_at)}`, 10, true);
      if (fb.comment) {
        addText(fb.comment, 9);
      }
      yPosition += 3;
    });
  }

  // Footer
  yPosition = 280;
  doc.setFontSize(8);
  doc.setTextColor('#6b7280');
  doc.text(`Generated on ${formatDateTime(new Date().toISOString())} from IQCase Management System`, margin, yPosition);
  doc.text(`Page 1`, pageWidth - margin - 20, yPosition);

  // Save the PDF
  const caseNumber = generateCaseNumber(data.caseData.id, data.caseData.created_at);
  doc.save(`Case_Report_${caseNumber}.pdf`);
};
