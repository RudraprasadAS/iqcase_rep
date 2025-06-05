
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

interface CaseNote {
  id: string;
  note: string;
  created_at: string;
  is_internal: boolean;
  users?: { name: string; email: string };
}

interface Activity {
  id: string;
  activity_type: string;
  description?: string;
  created_at: string;
  users?: { name: string; email: string };
}

interface PDFData {
  caseData: CaseData;
  caseNotes?: CaseNote[];
  activities?: Activity[];
  isInternal?: boolean;
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
    primary: '#1a1a1a',
    secondary: '#666666',
    accent: '#2563eb',
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
    
    // Add underline
    doc.setDrawColor('#e5e7eb');
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
  };

  const addKeyValuePair = (key: string, value: string) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.secondary);
    
    const keyWidth = 60;
    doc.text(key, margin, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.primary);
    
    const valueLines = doc.splitTextToSize(value, contentWidth - keyWidth - 10);
    doc.text(valueLines, margin + keyWidth, yPosition);
    
    yPosition += Math.max(1, valueLines.length) * 6 + 2;
  };

  const addPageFooter = () => {
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(colors.secondary);
    doc.text(`Generated on ${formatDateTime(new Date().toISOString())}`, margin, footerY);
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin - 20, footerY);
  };

  const generateCaseNumber = (id: string, createdAt: string) => {
    const year = new Date(createdAt).getFullYear();
    const shortId = id.slice(-6).toUpperCase();
    return `${year}-${shortId}`;
  };

  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'OPEN';
      case 'in_progress': return 'IN PROGRESS';
      case 'resolved': return 'RESOLVED';
      case 'closed': return 'CLOSED';
      case 'pending': return 'PENDING';
      default: return status.toUpperCase();
    }
  };

  const getPriorityDisplay = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low': return 'LOW';
      case 'medium': return 'MEDIUM';
      case 'high': return 'HIGH';
      case 'critical': return 'CRITICAL';
      default: return priority.toUpperCase();
    }
  };

  // Header with branding
  doc.setFillColor(colors.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#ffffff');
  doc.text('Case Report', margin, 22);

  yPosition = 50;

  // Case number and title
  const caseNumber = generateCaseNumber(data.caseData.id, data.caseData.created_at);
  addText(`Case #${caseNumber}`, 16, true, colors.primary);
  addText(data.caseData.title, 14, true, colors.primary);
  yPosition += 10;

  // Core Case Details
  addSectionTitle('Case Information');
  addKeyValuePair('Case Number:', `#${caseNumber}`);
  addKeyValuePair('Status:', getStatusDisplay(data.caseData.status));
  addKeyValuePair('Priority:', getPriorityDisplay(data.caseData.priority));
  addKeyValuePair('Created:', formatDateTime(data.caseData.created_at));
  addKeyValuePair('Last Updated:', formatDateTime(data.caseData.updated_at));
  
  if (data.caseData.category) {
    addKeyValuePair('Category:', data.caseData.category.name);
  }

  if (data.caseData.location) {
    addKeyValuePair('Location:', data.caseData.location);
  }

  if (data.caseData.submitted_by_user) {
    addKeyValuePair('Submitted by:', data.caseData.submitted_by_user.name || data.caseData.submitted_by_user.email);
  }
  
  if (data.caseData.assigned_to_user && data.isInternal) {
    addKeyValuePair('Assigned to:', data.caseData.assigned_to_user.name);
  }

  if (data.caseData.sla_due_at) {
    addKeyValuePair('SLA Due:', formatDateTime(data.caseData.sla_due_at));
  }

  // Description
  addSectionTitle('Description');
  addText(data.caseData.description || 'No description provided', 10, false, colors.primary);

  // Case Notes (only non-internal for external users)
  if (data.caseNotes && data.caseNotes.length > 0) {
    const relevantNotes = data.isInternal 
      ? data.caseNotes 
      : data.caseNotes.filter(note => !note.is_internal);

    if (relevantNotes.length > 0) {
      addSectionTitle('Case Notes');
      relevantNotes.forEach(note => {
        const authorName = note.users?.name || note.users?.email || 'Unknown';
        const noteType = note.is_internal ? '[INTERNAL]' : '[NOTE]';
        
        if (data.isInternal || !note.is_internal) {
          addText(`${noteType} ${formatDateTime(note.created_at)} by ${authorName}`, 9, true, colors.accent);
          addText(note.note, 9, false, colors.primary);
          yPosition += 5;
        }
      });
    }
  }

  // Case Updates (filtered for relevance)
  if (data.activities && data.activities.length > 0) {
    // Filter activities to show only relevant ones
    const allowedActivityTypes = [
      'case_created',
      'case_assigned', 
      'status_changed',
      'priority_changed'
    ];
    
    // For internal users, show more activity types
    if (data.isInternal) {
      allowedActivityTypes.push('case_unassigned', 'attachment_added');
    }
    
    const relevantActivities = data.activities.filter(activity => 
      allowedActivityTypes.includes(activity.activity_type)
    );

    if (relevantActivities.length > 0) {
      addSectionTitle('Case Updates');
      relevantActivities.slice(0, 10).forEach(activity => {
        const actorName = activity.users?.name || activity.users?.email || 'System';
        const activityDate = formatDateTime(activity.created_at);
        
        const activityTypeFormatted = activity.activity_type.replace(/_/g, ' ').toUpperCase();
        addText(`• ${activityTypeFormatted}`, 9, true, colors.accent);
        addText(`   ${activityDate} by ${actorName}`, 8, false, colors.secondary);
        if (activity.description) {
          addText(`   ${activity.description}`, 8, false, colors.primary);
        }
        yPosition += 3;
      });
    }
  }

  // Footer
  yPosition = pageHeight - 30;
  doc.setDrawColor('#e5e7eb');
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(8);
  doc.setTextColor(colors.secondary);
  doc.text(`© ${new Date().getFullYear()} Case Management System. All rights reserved.`, margin, yPosition);

  addPageFooter();

  // Save the PDF
  const fileName = data.isInternal 
    ? `Internal_Case_Report_${caseNumber}.pdf`
    : `Case_Report_${caseNumber}.pdf`;
  
  doc.save(fileName);
};
