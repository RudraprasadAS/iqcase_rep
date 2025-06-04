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

  // Enhanced color scheme
  const colors = {
    primary: '#1E293B',      // Slate-800
    secondary: '#64748B',    // Slate-500
    accent: '#3B82F6',       // Blue-500
    light: '#F8FAFC',        // Slate-50
    success: '#22C55E',      // Green-500
    warning: '#EAB308',      // Yellow-500
    danger: '#EF4444',       // Red-500
    info: '#06B6D4',         // Cyan-500
    purple: '#8B5CF6',       // Violet-500
    gray: '#9CA3AF'          // Gray-400
  };

  // Helper functions
  const addIcon = (iconType: string, x: number, y: number, size: number = 4) => {
    doc.setDrawColor(colors.secondary);
    doc.setLineWidth(0.5);
    
    switch (iconType) {
      case 'user':
        // Simple user icon
        doc.circle(x + size/2, y - size/2, size/3);
        doc.setFillColor(colors.secondary);
        doc.rect(x, y, size, size/2, 'F');
        break;
      case 'calendar':
        // Calendar icon
        doc.rect(x, y - size, size, size);
        doc.line(x, y - size + size/4, x + size, y - size + size/4);
        break;
      case 'flag':
        // Flag icon for priority
        doc.line(x, y, x, y - size);
        doc.triangle(x, y - size, x + size/2, y - size/2, x, y - size/2, 'S');
        break;
      case 'circle':
        // Circle for status
        doc.circle(x + size/2, y - size/2, size/3);
        break;
      case 'attachment':
        // Paperclip icon
        doc.setLineWidth(1);
        doc.line(x, y, x + size/2, y - size/2);
        doc.line(x + size/2, y - size/2, x + size, y);
        break;
      case 'message':
        // Message bubble
        doc.roundedRect(x, y - size, size, size * 0.7, 1, 1);
        break;
      case 'task':
        // Checkbox
        doc.rect(x, y - size, size * 0.8, size * 0.8);
        doc.line(x + size * 0.2, y - size * 0.4, x + size * 0.4, y - size * 0.2);
        doc.line(x + size * 0.4, y - size * 0.2, x + size * 0.7, y - size * 0.7);
        break;
      case 'star':
        // Star for feedback
        const cx = x + size/2;
        const cy = y - size/2;
        for (let i = 0; i < 5; i++) {
          const angle = (i * 72 - 90) * Math.PI / 180;
          const px = cx + Math.cos(angle) * size/3;
          const py = cy + Math.sin(angle) * size/3;
          if (i === 0) doc.moveTo(px, py);
          else doc.lineTo(px, py);
        }
        doc.closePath();
        break;
    }
  };

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

  const addSection = (title: string, iconType?: string, addSpacing: boolean = true) => {
    if (addSpacing) yPosition += 8;
    
    // Add background rectangle for section title
    doc.setFillColor(colors.light);
    doc.rect(margin - 5, yPosition - 10, contentWidth + 10, 18, 'F');
    
    // Add icon if provided
    if (iconType) {
      addIcon(iconType, margin, yPosition - 2, 6);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.primary);
      doc.text(title, margin + 12, yPosition);
    } else {
      addText(title, 12, true, colors.primary);
    }
    
    // Add bottom border
    doc.setDrawColor(colors.accent);
    doc.setLineWidth(0.8);
    doc.line(margin, yPosition + 4, pageWidth - margin, yPosition + 4);
    yPosition += 10;
  };

  const addKeyValue = (key: string, value: string, keyColor: string = colors.secondary, iconType?: string) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(keyColor);
    
    let startX = margin;
    
    // Add icon if provided
    if (iconType) {
      addIcon(iconType, margin, yPosition + 2, 4);
      startX = margin + 8;
    }
    
    const keyWidth = doc.getTextWidth(key + ': ');
    doc.text(key + ':', startX, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.primary);
    
    const valueLines = doc.splitTextToSize(value, contentWidth - keyWidth - (startX - margin) - 5);
    doc.text(valueLines, startX + keyWidth + 5, yPosition);
    
    yPosition += Math.max(1, valueLines.length) * 5 + 2;
  };

  const addStatusBadge = (status: string) => {
    const statusConfig = getStatusConfig(status);
    const badgeWidth = doc.getTextWidth(statusConfig.label) + 16;
    const badgeHeight = 10;
    
    // Badge background
    doc.setFillColor(statusConfig.bgColor);
    doc.roundedRect(margin, yPosition - 7, badgeWidth, badgeHeight, 2, 2, 'F');
    
    // Status icon
    doc.setDrawColor(statusConfig.textColor);
    doc.setFillColor(statusConfig.textColor);
    addIcon('circle', margin + 4, yPosition - 2, 3);
    
    // Status text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(statusConfig.textColor);
    doc.text(statusConfig.label, margin + 12, yPosition - 2);
    
    return badgeWidth + 10;
  };

  const addPriorityBadge = (priority: string, xOffset: number = 0) => {
    const priorityConfig = getPriorityConfig(priority);
    const badgeWidth = doc.getTextWidth(priorityConfig.label) + 16;
    const badgeHeight = 10;
    
    // Badge background
    doc.setFillColor(priorityConfig.bgColor);
    doc.roundedRect(margin + xOffset, yPosition - 7, badgeWidth, badgeHeight, 2, 2, 'F');
    
    // Priority icon
    doc.setDrawColor(priorityConfig.textColor);
    doc.setFillColor(priorityConfig.textColor);
    addIcon('flag', margin + xOffset + 4, yPosition - 2, 3);
    
    // Priority text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(priorityConfig.textColor);
    doc.text(priorityConfig.label, margin + xOffset + 12, yPosition - 2);
    
    return badgeWidth;
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return {
          label: 'OPEN',
          bgColor: '#DBEAFE',
          textColor: '#1E40AF'
        };
      case 'in_progress':
        return {
          label: 'IN PROGRESS',
          bgColor: '#F3E8FF',
          textColor: '#7C3AED'
        };
      case 'resolved':
        return {
          label: 'RESOLVED',
          bgColor: '#DCFCE7',
          textColor: '#15803D'
        };
      case 'closed':
        return {
          label: 'CLOSED',
          bgColor: '#F3F4F6',
          textColor: '#374151'
        };
      case 'pending':
        return {
          label: 'PENDING',
          bgColor: '#FEF3C7',
          textColor: '#D97706'
        };
      default:
        return {
          label: status.toUpperCase(),
          bgColor: '#F3F4F6',
          textColor: '#6B7280'
        };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return {
          label: 'LOW',
          bgColor: '#DCFCE7',
          textColor: '#15803D'
        };
      case 'medium':
        return {
          label: 'MEDIUM',
          bgColor: '#FEF3C7',
          textColor: '#D97706'
        };
      case 'high':
        return {
          label: 'HIGH',
          bgColor: '#FEE2E2',
          textColor: '#DC2626'
        };
      case 'critical':
        return {
          label: 'CRITICAL',
          bgColor: '#FEE2E2',
          textColor: '#991B1B'
        };
      default:
        return {
          label: priority.toUpperCase(),
          bgColor: '#F3F4F6',
          textColor: '#6B7280'
        };
    }
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
      return { text: 'N/A', color: colors.gray };
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

  // Header with enhanced design
  doc.setFillColor(colors.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Logo placeholder with better design
  doc.setFillColor('#ffffff');
  doc.circle(25, 20, 10, 'F');
  doc.setFontSize(6);
  doc.setTextColor(colors.primary);
  doc.text('LOGO', 20, 22);

  // Main title with icon
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#ffffff');
  doc.text('📋 CASE MANAGEMENT REPORT', 45, 22);

  yPosition = 55;

  // Case number and basic info with enhanced styling
  addText(`Case ${generateCaseNumber(data.caseData.id, data.caseData.created_at)}`, 16, true, colors.accent);
  addText(`${data.caseData.title}`, 14, true);
  
  // Status and Priority badges with proper text labels
  yPosition += 8;
  const statusWidth = addStatusBadge(data.caseData.status);
  addPriorityBadge(data.caseData.priority, statusWidth);
  yPosition += 15;

  // Overview section with icons
  addSection('CASE OVERVIEW', 'circle');
  addKeyValue('Created', formatDateTime(data.caseData.created_at), colors.secondary, 'calendar');
  addKeyValue('Last Updated', formatDateTime(data.caseData.updated_at), colors.secondary, 'calendar');
  addKeyValue('Status', getStatusConfig(data.caseData.status).label, colors.secondary);
  addKeyValue('Priority', getPriorityConfig(data.caseData.priority).label, colors.secondary, 'flag');
  
  if (data.caseData.sla_due_at) {
    addKeyValue('SLA Due Date', formatDateTime(data.caseData.sla_due_at), colors.secondary, 'calendar');
    const slaStatus = getSLAStatus(data.caseData.sla_due_at, data.caseData.status);
    addKeyValue('SLA Status', slaStatus.text, slaStatus.color);
  }

  // Participants section with icons
  addSection('PARTICIPANTS', 'user');
  addKeyValue('Submitted By', data.caseData.submitted_by_user?.name || data.caseData.submitted_by_user?.email || 'Unknown', colors.secondary, 'user');
  addKeyValue('Assigned To', data.caseData.assigned_to_user?.name || 'Unassigned', colors.secondary, 'user');
  
  if (data.caseData.category) {
    addKeyValue('Category', data.caseData.category.name, colors.secondary);
  }
  
  if (data.caseData.location) {
    addKeyValue('Location', data.caseData.location, colors.secondary);
  }

  // Description section
  addSection('DESCRIPTION');
  addText(data.caseData.description || 'No description provided', 10, false, colors.primary);

  if (data.caseData.tags && data.caseData.tags.length > 0) {
    yPosition += 5;
    addKeyValue('Tags', data.caseData.tags.join(', '), colors.secondary);
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
