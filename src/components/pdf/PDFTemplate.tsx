
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/cases/StatusBadge';
import PriorityBadge from '@/components/cases/PriorityBadge';
import { formatDistanceToNow } from 'date-fns';

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
  location?: string;
}

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  users?: { name: string };
}

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  submitted_at: string;
}

interface CaseNote {
  id: string;
  note: string;
  created_at: string;
  is_internal: boolean;
  users?: { name: string };
}

interface PDFTemplateProps {
  caseData: CaseData;
  activities: Activity[];
  feedback: Feedback[];
  caseNotes: CaseNote[];
  isInternal: boolean;
}

const PDFTemplate: React.FC<PDFTemplateProps> = ({
  caseData,
  activities,
  feedback,
  caseNotes,
  isInternal
}) => {
  const generateCaseNumber = (id: string, createdAt: string) => {
    const year = new Date(createdAt).getFullYear();
    const shortId = id.slice(-6).toUpperCase();
    return `${year}-${shortId}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter content based on user type
  const filteredActivities = activities.filter(activity => {
    if (!isInternal) {
      // External users don't see internal activities
      return !activity.activity_type.includes('internal');
    }
    return true;
  });

  const filteredNotes = caseNotes.filter(note => {
    if (!isInternal) {
      // External users only see non-internal notes
      return !note.is_internal;
    }
    return true;
  });

  return (
    <div className="pdf-template bg-white p-8 max-w-4xl mx-auto" style={{ minHeight: '297mm' }}>
      {/* Header with Branding */}
      <div className="mb-8 border-b-4 border-blue-600 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center mb-2">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">CM</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Case Management System</h1>
                <p className="text-gray-600">Official Case Report</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Generated on</p>
            <p className="font-semibold">{formatDate(new Date().toISOString())}</p>
            <p className="text-xs text-gray-500 mt-1">
              {isInternal ? 'Internal Report' : 'External Report'}
            </p>
          </div>
        </div>
      </div>

      {/* Case Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{caseData.title}</h2>
          <p className="text-lg text-gray-700 mb-4">
            Case #{generateCaseNumber(caseData.id, caseData.created_at)}
          </p>
          <div className="flex gap-3">
            <StatusBadge status={caseData.status} />
            <PriorityBadge priority={caseData.priority} />
          </div>
        </div>
      </div>

      {/* Core Case Details */}
      <Card className="mb-6">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-lg text-gray-900">📋 Core Case Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Case Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{caseData.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Priority:</span>
                  <span className="font-medium">{caseData.priority}</span>
                </div>
                {caseData.category && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{caseData.category.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{formatDate(caseData.created_at)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Participants</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted by:</span>
                  <span className="font-medium">
                    {caseData.submitted_by_user?.name || 'Unknown'}
                  </span>
                </div>
                {isInternal && caseData.assigned_to_user && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assigned to:</span>
                    <span className="font-medium">{caseData.assigned_to_user.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {caseData.description && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
              <p className="text-gray-900 leading-relaxed">{caseData.description}</p>
            </div>
          )}
          {caseData.location && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-700 mb-2">Location</h4>
              <p className="text-gray-900">📍 {caseData.location}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Case Updates */}
      {filteredActivities.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-lg text-gray-900">🔄 Case Updates</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {filteredActivities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.activity_type.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    {activity.users && (
                      <p className="text-xs text-gray-600 mt-1">by {activity.users.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Case Notes */}
      {filteredNotes.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-lg text-gray-900">📝 Case Notes</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <div key={note.id} className="border-l-4 border-blue-200 pl-4 py-2">
                  <div className="flex items-center space-x-2 mb-2">
                    {isInternal && (
                      <Badge variant={note.is_internal ? "destructive" : "secondary"} className="text-xs">
                        {note.is_internal ? 'INTERNAL' : 'EXTERNAL'}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDate(note.created_at)}
                    </span>
                    {note.users && (
                      <span className="text-xs text-gray-600">by {note.users.name}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900 leading-relaxed">{note.note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {feedback.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-lg text-gray-900">⭐ Customer Feedback</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {feedback.map((fb) => (
                <div key={fb.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={i < fb.rating ? 'text-yellow-500' : 'text-gray-300'}>
                          ⭐
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-semibold">{fb.rating}/5</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(fb.submitted_at)}
                    </span>
                  </div>
                  {fb.comment && (
                    <p className="text-sm text-gray-900 italic">"{fb.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          This report was generated automatically by the Case Management System
        </p>
        <p className="text-xs text-gray-500 mt-1">
          © {new Date().getFullYear()} Case Management System. All rights reserved.
        </p>
        {isInternal && (
          <p className="text-xs text-red-600 mt-2 font-semibold">
            ⚠️ CONFIDENTIAL - Internal Use Only
          </p>
        )}
      </div>
    </div>
  );
};

export default PDFTemplate;
