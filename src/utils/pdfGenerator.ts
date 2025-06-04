
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
  tags?: string[];
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

interface CaseNote {
  id: string;
  note: string;
  created_at: string;
  is_internal: boolean;
  users?: { name: string; email: string };
}

interface PDFData {
  caseData: CaseData;
  activities: Activity[];
  tasks?: Task[];
  feedback?: Feedback[];
  caseNotes?: CaseNote[];
  relatedCases?: any[];
  watchers?: any[];
}

export const generateCasePDF = (data: PDFData): void => {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Professional color scheme
  const colors = {
    primary: '#1a1a1a',
    secondary: '#666666',
    accent: '#2563eb',
    lightGray: '#f8f9fa',
    border: '#e5e7eb',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
  };

  // Helper functions
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: string = colors.primary) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color);
    
    if (yPosition > pageHeight - 40) {
      addPageFooter();
      doc.addPage();
      yPosition = 30;
    }
    
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * (fontSize * 0.4) + 4;
  };

  const addSectionTitle = (title: string, addSpacing: boolean = true) => {
    if (addSpacing) yPosition += 10;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary);
    doc.text(title, margin, yPosition);
    yPosition += 8;
    
    // Add subtle underline
    doc.setDrawColor(colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
  };

  const addKeyValuePair = (key: string, value: string, keyColor: string = colors.secondary) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(keyColor);
    
    const keyWidth = 60;
    doc.text(key, margin, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.primary);
    
    const valueLines = doc.splitTextToSize(value, contentWidth - keyWidth - 10);
    doc.text(valueLines, margin + keyWidth, yPosition);
    
    yPosition += Math.max(1, valueLines.length) * 6 + 2;
  };

  const addStatusBadge = (status: string) => {
    const statusConfig = getStatusConfig(status);
    const statusText = statusConfig.label;
    const textWidth = doc.getTextWidth(statusText);
    const badgeWidth = textWidth + 12;
    const badgeHeight = 8;
    
    // Badge background
    doc.setFillColor(statusConfig.bgColor);
    doc.roundedRect(margin, yPosition - 6, badgeWidth, badgeHeight, 2, 2, 'F');
    
    // Status text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(statusConfig.textColor);
    doc.text(statusText, margin + 6, yPosition - 1);
    
    return badgeWidth + 15;
  };

  const addPriorityBadge = (priority: string, xOffset: number = 0) => {
    const priorityConfig = getPriorityConfig(priority);
    const priorityText = priorityConfig.label;
    const textWidth = doc.getTextWidth(priorityText);
    const badgeWidth = textWidth + 12;
    const badgeHeight = 8;
    
    // Badge background
    doc.setFillColor(priorityConfig.bgColor);
    doc.roundedRect(margin + xOffset, yPosition - 6, badgeWidth, badgeHeight, 2, 2, 'F');
    
    // Priority text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(priorityConfig.textColor);
    doc.text(priorityText, margin + xOffset + 6, yPosition - 1);
    
    return badgeWidth;
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return { label: 'OPEN', bgColor: '#dbeafe', textColor: '#1e40af' };
      case 'in_progress':
        return { label: 'IN PROGRESS', bgColor: '#f3e8ff', textColor: '#7c3aed' };
      case 'resolved':
        return { label: 'RESOLVED', bgColor: '#dcfce7', textColor: '#15803d' };
      case 'closed':
        return { label: 'CLOSED', bgColor: '#f3f4f6', textColor: '#374151' };
      case 'pending':
        return { label: 'PENDING', bgColor: '#fef3c7', textColor: '#d97706' };
      default:
        return { label: status.toUpperCase(), bgColor: '#f3f4f6', textColor: '#6b7280' };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return { label: 'LOW', bgColor: '#dcfce7', textColor: '#15803d' };
      case 'medium':
        return { label: 'MEDIUM', bgColor: '#fef3c7', textColor: '#d97706' };
      case 'high':
        return { label: 'HIGH', bgColor: '#fee2e2', textColor: '#dc2626' };
      case 'critical':
        return { label: 'CRITICAL', bgColor: '#fee2e2', textColor: '#991b1b' };
      default:
        return { label: priority.toUpperCase(), bgColor: '#f3f4f6', textColor: '#6b7280' };
    }
  };

  const addPageFooter = () => {
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(colors.secondary);
    doc.text(`Generated on ${formatDateTime(new Date().toISOString())} from Case Management System`, margin, footerY);
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin - 20, footerY);
  };

  const generateCaseNumber = (id: string, createdAt: string) => {
    const year = new Date(createdAt).getFullYear();
    const shortId = id.slice(-6).toUpperCase();
    return `${year}-${shortId}`;
  };

  // Header
  doc.setFillColor(colors.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#ffffff');
  doc.text('Case Management Report', margin, 22);

  yPosition = 50;

  // Case title and number
  const caseNumber = generateCaseNumber(data.caseData.id, data.caseData.created_at);
  addText(`Case #${caseNumber}`, 16, true, colors.primary);
  addText(data.caseData.title, 14, true, colors.primary);
  
  // Status and Priority badges
  yPosition += 8;
  const statusWidth = addStatusBadge(data.caseData.status);
  addPriorityBadge(data.caseData.priority, statusWidth);
  yPosition += 15;

  // Case Details section
  addSectionTitle('Case Details');
  addKeyValuePair('Case Number:', `#${caseNumber}`);
  addKeyValuePair('Status:', getStatusConfig(data.caseData.status).label);
  addKeyValuePair('Priority:', getPriorityConfig(data.caseData.priority).label);
  addKeyValuePair('Created:', formatDateTime(data.caseData.created_at));
  addKeyValuePair('Updated:', formatDateTime(data.caseData.updated_at));
  
  if (data.caseData.category) {
    addKeyValuePair('Category:', data.caseData.category.name);
  }

  // Participants section
  addSectionTitle('Participants');
  if (data.caseData.submitted_by_user) {
    addKeyValuePair('Submitted by:', `${data.caseData.submitted_by_user.name || data.caseData.submitted_by_user.email || 'Unknown'} (External)`);
    
    if (data.caseData.assigned_to_user) {
      addKeyValuePair('Assigned to:', `${data.caseData.assigned_to_user.name || 'Unassigned'} (Internal)`);
    }
  }

  // Description section
  addSectionTitle('Description');
  addText(data.caseData.description || 'No description provided', 10, false, colors.primary);

  if (data.caseData.tags && data.caseData.tags.length > 0) {
    yPosition += 5;
    addKeyValuePair('Tags:', data.caseData.tags.join(', '));
  }

  // Case Notes section (only show if notes exist)
  if (data.caseNotes && data.caseNotes.length > 0) {
    addSectionTitle('Case Notes');
    data.caseNotes.forEach(note => {
      const authorName = note.users?.name || note.users?.email || 'Unknown';
      const noteType = note.is_internal ? '[INTERNAL]' : '[CASE NOTE]';
      
      addText(`${noteType} ${authorName}`, 9, true, note.is_internal ? colors.warning : colors.accent);
      addText(formatDateTime(note.created_at), 8, false, colors.secondary);
      addText(note.note, 9, false, colors.primary);
      yPosition += 5;
    });
  }

  // Tasks section (only show if tasks exist)
  if (data.tasks && data.tasks.length > 0) {
    addSectionTitle('Tasks');
    data.tasks.forEach(task => {
      addText(`• ${task.task_name}`, 9, true, colors.primary);
      addText(`   Status: ${task.status.toUpperCase()}`, 8, false, colors.secondary);
      if (task.assigned_to_user) {
        addText(`   Assigned to: ${task.assigned_to_user.name}`, 8, false, colors.secondary);
      }
      if (task.due_date) {
        addText(`   Due: ${formatDateTime(task.due_date)}`, 8, false, colors.secondary);
      }
      yPosition += 3;
    });
  }

  // Case Updates section (activities)
  if (data.activities && data.activities.length > 0) {
    addSectionTitle('Case Updates');
    data.activities.slice(0, 15).forEach(activity => {
      const actorName = activity.users?.name || activity.users?.email || 'System';
      const activityDate = formatDate(activity.created_at);
      
      addText(`• ${activity.activity_type.replace(/_/g, ' ').toUpperCase()}`, 9, true, colors.primary);
      addText(`   ${activityDate} by ${actorName}`, 8, false, colors.secondary);
      if (activity.description) {
        addText(`   ${activity.description}`, 8, false, colors.primary);
      }
      yPosition += 3;
    });
  }

  // Feedback section (only show if feedback exists)
  if (data.feedback && data.feedback.length > 0) {
    addSectionTitle('Customer Feedback');
    data.feedback.forEach(fb => {
      const stars = '★'.repeat(fb.rating) + '☆'.repeat(5 - fb.rating);
      addText(`${stars} ${fb.rating}/5`, 10, true, colors.warning);
      addText(formatDateTime(fb.submitted_at), 8, false, colors.secondary);
      if (fb.comment) {
        addText(fb.comment, 9, false, colors.primary);
      }
      yPosition += 5;
    });
  }

  // Footer
  yPosition = pageHeight - 30;
  doc.setDrawColor(colors.border);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(8);
  doc.setTextColor(colors.secondary);
  doc.text('Privacy Policy', margin, yPosition);
  doc.text('Terms of Service', margin + 80, yPosition);
  doc.text(`© ${new Date().getFullYear()} Case Management System. All rights reserved.`, pageWidth - margin - 120, yPosition);

  // Add final footer
  addPageFooter();

  // Save the PDF
  doc.save(`Case_Report_${caseNumber}.pdf`);
};
