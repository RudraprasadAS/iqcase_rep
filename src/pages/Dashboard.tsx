
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, FileText, CheckCheck, AlertCircle, Clock } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your case management dashboard.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Cases" 
          value="24" 
          description="Currently active cases" 
          icon={FileText} 
          color="blue"
        />
        <StatCard 
          title="Resolved" 
          value="18" 
          description="Cases resolved this month" 
          icon={CheckCheck} 
          color="green"
        />
        <StatCard 
          title="Escalated" 
          value="5" 
          description="Cases requiring attention" 
          icon={AlertCircle} 
          color="amber"
        />
        <StatCard 
          title="Overdue" 
          value="3" 
          description="Cases past SLA deadlines" 
          icon={Clock} 
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
            <CardDescription>Latest cases that require your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <CaseItem 
                id="CASE-5124"
                title="Service Request: Street Light Replacement"
                status="Open"
                priority="Medium"
                date="2025-05-15"
              />
              <CaseItem 
                id="CASE-5123"
                title="Complaint: Noise from Construction Site"
                status="Assigned"
                priority="High"
                date="2025-05-14"
              />
              <CaseItem 
                id="CASE-5120"
                title="Permit Request: Community Event"
                status="Under Review"
                priority="Low"
                date="2025-05-12"
              />
              <CaseItem 
                id="CASE-5118"
                title="Information Request: Zoning Requirements"
                status="Awaiting User Input"
                priority="Medium"
                date="2025-05-11"
              />
            </div>
            <Button variant="outline" className="w-full mt-4">View All Cases</Button>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
            <CardDescription>Case activity in the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] flex items-center justify-center">
              <BarChart className="w-12 h-12 text-muted-foreground/50" />
              <div className="text-center ml-2">
                <p className="text-muted-foreground">Reports will be available here when you connect to Supabase</p>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <ActivityItem label="New cases" value="12" />
              <ActivityItem label="Resolved cases" value="8" />
              <ActivityItem label="Reassigned cases" value="3" />
              <ActivityItem label="Case updates" value="24" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  color: "blue" | "green" | "amber" | "red";
}

const StatCard = ({ title, value, description, icon: Icon, color }: StatCardProps) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`p-2 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface CaseItemProps {
  id: string;
  title: string;
  status: string;
  priority: string;
  date: string;
}

const CaseItem = ({ id, title, status, priority, date }: CaseItemProps) => {
  const statusClasses = {
    Open: "bg-blue-100 text-blue-800",
    Assigned: "bg-purple-100 text-purple-800",
    "Under Review": "bg-amber-100 text-amber-800",
    "Awaiting User Input": "bg-gray-100 text-gray-800",
    Resolved: "bg-green-100 text-green-800",
  };

  const priorityClasses = {
    High: "text-red-600",
    Medium: "text-amber-600",
    Low: "text-green-600",
  };

  const statusClass = statusClasses[status as keyof typeof statusClasses] || "bg-gray-100 text-gray-800";
  const priorityClass = priorityClasses[priority as keyof typeof priorityClasses] || "text-gray-600";

  return (
    <div className="flex items-center p-3 hover:bg-gray-50 rounded-md transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">{id}</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusClass}`}>{status}</span>
        </div>
        <h4 className="font-medium mt-1">{title}</h4>
      </div>
      <div className="text-right">
        <p className={`text-xs font-semibold ${priorityClass}`}>{priority}</p>
        <p className="text-xs text-gray-500 mt-1">{date}</p>
      </div>
    </div>
  );
};

interface ActivityItemProps {
  label: string;
  value: string;
}

const ActivityItem = ({ label, value }: ActivityItemProps) => {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
};

export default Dashboard;
