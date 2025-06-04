
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

interface CaseNote {
  id: string;
  note: string;
  created_at: string;
  updated_at: string;
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

  // Color scheme
  const colors = {
    primary: '#1f2937',      // Dark gray
    secondary: '#6b7280',    // Medium gray
    accent: '#3b82f6',       // Blue
    light: '#f3f4f6',        // Light gray
    success: '#10b981',      // Green
    warning: '#f59e0b',      // Orange
    danger: '#ef4444'        // Red
  };

  // Helper functions
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: string = colors.primary) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color);
    
    if (yPosition > pageHeight - 40) {
      addPageFooter();
      doc.addPage();
      yPosition = 20;
    }
    
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * (fontSize * 0.5) + 3;
  };

  const addSection = (title: string, addSpacing: boolean = true) => {
    if (addSpacing) yPosition += 8;
    
    // Add background rectangle for section title
    doc.setFillColor(colors.light);
    doc.rect(margin - 5, yPosition - 8, contentWidth + 10, 16, 'F');
    
    addText(title, 12, true, colors.primary);
    
    // Add bottom border
    doc.setDrawColor(colors.accent);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
    yPosition += 8;
  };

  const addKeyValue = (key: string, value: string, keyColor: string = colors.secondary) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(keyColor);
    
    const keyWidth = doc.getTextWidth(key + ': ');
    doc.text(key + ':', margin, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.primary);
    
    const valueLines = doc.splitTextToSize(value, contentWidth - keyWidth - 5);
    doc.text(valueLines, margin + keyWidth + 5, yPosition);
    
    yPosition += Math.max(1, valueLines.length) * 5 + 2;
  };

  const addBadge = (text: string, bgColor: string, textColor: string = '#ffffff') => {
    const badgeWidth = doc.getTextWidth(text) + 8;
    const badgeHeight = 8;
    
    doc.setFillColor(bgColor);
    doc.roundedRect(margin, yPosition - 6, badgeWidth, badgeHeight, 2, 2, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text(text, margin + 4, yPosition - 1);
    
    return badgeWidth + 10;
  };

  const addPageFooter = () => {
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(colors.secondary);
    doc.text(`Generated on ${formatDateTime(new Date().toISOString())} from IQCase Management System`, margin, footerY);
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin - 20, footerY);
  };

  const generateCaseNumber = (id: string, createdAt: string) => {
    const year = new Date(createdAt).getFullYear();
    const shortId = id.slice(-6).toUpperCase();
    return `#${year}-${shortId}`;
  };

  const getSLAStatus = (sla_due_at?: string, status?: string) => {
    if (!sla_due_at || status === 'closed' || status === 'resolved') {
      return { text: 'N/A', color: colors.secondary };
    }

    const dueDate = new Date(sla_due_at);
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const hoursRemaining = timeDiff / (1000 * 60 * 60);

    if (hoursRemaining < 0) {
      const hoursOverdue = Math.abs(hoursRemaining);
      return { 
        text: `BREACHED (${Math.round(hoursOverdue)} hours overdue)`, 
        color: colors.danger 
      };
    } else if (hoursRemaining < 2) {
      return { 
        text: `CRITICAL (Due in ${Math.round(hoursRemaining)} hours)`, 
        color: colors.warning 
      };
    } else if (hoursRemaining < 24) {
      return { 
        text: `Due in ${Math.round(hoursRemaining)} hours`, 
        color: colors.warning 
      };
    }
    return { 
      text: `Due in ${Math.round(hoursRemaining / 24)} days`, 
      color: colors.success 
    };
  };

  // Header with logo placeholder and title
  doc.setFillColor(colors.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Logo placeholder (you can replace this with actual logo)
  doc.setFillColor('#ffffff');
  doc.circle(30, 17.5, 8, 'F');
  doc.setFontSize(8);
  doc.setTextColor(colors.primary);
  doc.text('LOGO', 25, 20);

  // Main title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#ffffff');
  doc.text('CASE MANAGEMENT REPORT', 50, 22);

  yPosition = 50;

  // Case number and basic info
  addText(`Case ${generateCaseNumber(data.caseData.id, data.caseData.created_at)}`, 16, true, colors.accent);
  addText(`${data.caseData.title}`, 14, true);
  
  // Status and Priority badges
  yPosition += 5;
  let badgeX = margin;
  
  // Status badge with proper mapping
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return colors.accent;
      case 'in_progress': return colors.warning;
      case 'closed': return colors.success;
      case 'resolved': return colors.success;
      case 'pending': return colors.warning;
      default: return colors.secondary;
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_progress': return 'IN PROGRESS';
      case 'open': return 'OPEN';
      case 'closed': return 'CLOSED';
      case 'resolved': return 'RESOLVED';
      case 'pending': return 'PENDING';
      default: return status.toUpperCase();
    }
  };
  
  const statusWidth = addBadge(getStatusLabel(data.caseData.status), getStatusColor(data.caseData.status));
  
  // Priority badge with proper mapping
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low': return colors.success;
      case 'medium': return colors.warning;
      case 'high': return colors.danger;
      case 'critical': return colors.danger;
      default: return colors.secondary;
    }
  };
  
  doc.text('', badgeX + statusWidth, yPosition);
  addBadge(data.caseData.priority.toUpperCase(), getPriorityColor(data.caseData.priority));

  yPosition += 15;

  // Overview section
  addSection('CASE OVERVIEW');
  addKeyValue('Created', formatDateTime(data.caseData.created_at));
  addKeyValue('Last Updated', formatDateTime(data.caseData.updated_at));
  addKeyValue('Status', getStatusLabel(data.caseData.status));
  addKeyValue('Priority', data.caseData.priority.toUpperCase());
  
  if (data.caseData.sla_due_at) {
    addKeyValue('SLA Due Date', formatDateTime(data.caseData.sla_due_at));
    const slaStatus = getSLAStatus(data.caseData.sla_due_at, data.caseData.status);
    addKeyValue('SLA Status', slaStatus.text, slaStatus.color);
  }

  // Participants section
  addSection('PARTICIPANTS');
  addKeyValue('Submitted By', data.caseData.submitted_by_user?.name || data.caseData.submitted_by_user?.email || 'Unknown');
  addKeyValue('Assigned To', data.caseData.assigned_to_user?.name || 'Unassigned');
  
  if (data.caseData.category) {
    addKeyValue('Category', data.caseData.category.name);
  }
  
  if (data.caseData.location) {
    addKeyValue('Location', data.caseData.location);
  }

  // Description section
  addSection('DESCRIPTION');
  addText(data.caseData.description || 'No description provided', 10, false, colors.primary);

  if (data.caseData.tags && data.caseData.tags.length > 0) {
    yPosition += 5;
    addKeyValue('Tags', data.caseData.tags.join(', '));
  }

  // Case Notes section (only show if notes exist)
  if (data.caseNotes && data.caseNotes.length > 0) {
    addSection('CASE NOTES');
    data.caseNotes.forEach(note => {
      const authorName = note.users?.name || note.users?.email || 'Unknown';
      const noteType = note.is_internal ? '[INTERNAL] ' : '[CASE NOTE] ';
      
      addText(`${noteType}${authorName}`, 9, true, note.is_internal ? colors.warning : colors.accent);
      addText(`${formatDateTime(note.created_at)}`, 8, false, colors.secondary);
      addText(note.note, 9, false, colors.primary);
      yPosition += 5;
    });
  }

  // Attachments section (only show if attachments exist)
  if (data.attachments && data.attachments.length > 0) {
    addSection('ATTACHMENTS');
    data.attachments.forEach(attachment => {
      addText(`📎 ${attachment.file_name}`, 9, false, colors.primary);
      addText(`   ${attachment.file_type || 'Unknown type'} • ${formatDateTime(attachment.created_at)}`, 8, false, colors.secondary);
      yPosition += 2;
    });
  }

  // Communication section (only show if external messages exist)
  const externalMessages = data.messages.filter(message => !message.is_internal);
  if (externalMessages && externalMessages.length > 0) {
    addSection('MESSAGES & COMMUNICATION');
    externalMessages.forEach(message => {
      const senderName = message.users?.name || message.users?.email || 'Unknown';
      
      addText(`${senderName}`, 9, true, colors.accent);
      addText(`${formatDateTime(message.created_at)}`, 8, false, colors.secondary);
      addText(message.message, 9, false, colors.primary);
      yPosition += 5;
    });
  }

  // Tasks section (only show if tasks exist)
  if (data.tasks && data.tasks.length > 0) {
    addSection('TASKS');
    data.tasks.forEach(task => {
      addText(`✓ ${task.task_name}`, 9, true, colors.primary);
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

  // Activities section (only show if activities exist)
  if (data.activities && data.activities.length > 0) {
    addSection('RECENT ACTIVITIES');
    data.activities.slice(0, 15).forEach(activity => {
      const actorName = activity.users?.name || activity.users?.email || 'System';
      addText(`• ${activity.activity_type.replace(/_/g, ' ').toUpperCase()}`, 8, true, colors.primary);
      addText(`  ${actorName} • ${formatDateTime(activity.created_at)}`, 7, false, colors.secondary);
      if (activity.description) {
        addText(`  ${activity.description}`, 8, false, colors.primary);
      }
      yPosition += 2;
    });
  }

  // Feedback section (only show if feedback exists)
  if (data.feedback && data.feedback.length > 0) {
    addSection('CUSTOMER FEEDBACK');
    data.feedback.forEach(fb => {
      const stars = '★'.repeat(fb.rating) + '☆'.repeat(5 - fb.rating);
      addText(`${stars} ${fb.rating}/5`, 10, true, colors.warning);
      addText(`${formatDateTime(fb.submitted_at)}`, 8, false, colors.secondary);
      if (fb.comment) {
        addText(fb.comment, 9, false, colors.primary);
      }
      yPosition += 5;
    });
  }

  // Add final footer
  addPageFooter();

  // Save the PDF
  const caseNumber = generateCaseNumber(data.caseData.id, data.caseData.created_at);
  doc.save(`Case_Report_${caseNumber}.pdf`);
};
