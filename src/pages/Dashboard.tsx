
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Plus,
  Search,
  FileText,
  Settings,
  Calendar,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Mock data - would come from Supabase in production
const statusData = [
  { name: "Open", value: 14, color: "#3B82F6" },
  { name: "In Progress", value: 7, color: "#F59E0B" },
  { name: "Closed", value: 23, color: "#10B981" },
];

const weeklyData = [
  { name: "Mon", cases: 4 },
  { name: "Tue", cases: 7 },
  { name: "Wed", cases: 5 },
  { name: "Thu", cases: 8 },
  { name: "Fri", cases: 12 },
  { name: "Sat", cases: 3 },
  { name: "Sun", cases: 2 },
];

const activityData = [
  {
    id: 1,
    type: "note",
    description: "Note added to Case #4310",
    time: "2h ago",
    icon: "📝",
  },
  {
    id: 2,
    type: "reassigned",
    description: "Case #4309 reassigned to Maya",
    time: "4h ago",
    icon: "🔄",
  },
  {
    id: 3,
    type: "closed",
    description: "Case #4308 closed",
    time: "1d ago",
    icon: "✅",
  },
  {
    id: 4,
    type: "created",
    description: "Case #4307 created",
    time: "2d ago",
    icon: "🆕",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Mock user data - would come from auth context in production
  const user = {
    name: "Maya",
    role: "Staff",
    lastLogin: "3 hours ago",
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "new":
        toast({
          title: "Create Case",
          description: "Create Case feature coming soon",
        });
        break;
      case "search":
        toast({
          title: "Search Cases",
          description: "Search feature coming soon",
        });
        break;
      case "my-cases":
        toast({
          title: "My Cases",
          description: "My Cases feature coming soon",
        });
        break;
      case "admin":
        toast({
          title: "Admin Panel",
          description: "Admin Panel feature coming soon",
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user.name}
          </h1>
          <p className="text-gray-500">Role: {user.role}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Last login: {user.lastLogin}</span>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatusCard title="Open Cases" count={14} bgColor="bg-blue-100" textColor="text-blue-700" icon="📂" />
        <StatusCard title="In Progress" count={7} bgColor="bg-yellow-100" textColor="text-yellow-700" icon="⏳" />
        <StatusCard title="Closed Cases" count={23} bgColor="bg-green-100" textColor="text-green-700" icon="✅" />
        <StatusCard title="Overdue Cases" count={2} bgColor="bg-red-100" textColor="text-red-700" icon="🚨" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Case Status Distribution</h2>
            <div className="h-64">
              <ChartContainer
                className="h-full"
                config={{
                  Open: { color: "#3B82F6" },
                  "In Progress": { color: "#F59E0B" },
                  Closed: { color: "#10B981" },
                }}
              >
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelKey="name" 
                        label="status"
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Weekly Case Volume</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cases" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton 
            icon={<Plus />} 
            label="Create Case" 
            onClick={() => handleQuickAction("new")}
          />
          <QuickActionButton 
            icon={<Search />} 
            label="Search Cases" 
            onClick={() => handleQuickAction("search")}
          />
          <QuickActionButton 
            icon={<FileText />} 
            label="My Cases" 
            onClick={() => handleQuickAction("my-cases")}
          />
          <QuickActionButton 
            icon={<Settings />} 
            label="Admin Panel" 
            onClick={() => handleQuickAction("admin")}
          />
        </div>
      </div>

      {/* Bottom Grid: Activity Feed and Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {activityData.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="text-2xl">{activity.icon}</div>
                  <div className="flex-1">
                    <p>{activity.description}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SLA Alerts */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">SLA Alerts</h2>
            <div className="space-y-4">
              <AlertItem icon="⏳" text="2 cases due today" color="text-yellow-600" />
              <AlertItem icon="🚨" text="1 case overdue by 5+ days" color="text-red-600" />
              <AlertItem icon="🔔" text="5 unresolved cases assigned to you" color="text-blue-600" />
            </div>
            <div className="mt-6">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => toast({
                  title: "View Deadlines", 
                  description: "SLA View coming soon"
                })}
              >
                <Calendar className="mr-2 h-4 w-4" />
                View All Deadlines
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper Components
const StatusCard = ({ 
  title, 
  count, 
  bgColor, 
  textColor,
  icon 
}: { 
  title: string; 
  count: number; 
  bgColor: string;
  textColor: string;
  icon: string;
}) => (
  <Card className={`${bgColor} border-none`}>
    <CardContent className="flex items-center justify-between pt-6">
      <div>
        <p className={`text-sm ${textColor}`}>{title}</p>
        <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
      </div>
      <div className="text-2xl">{icon}</div>
    </CardContent>
  </Card>
);

const QuickActionButton = ({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
}) => (
  <Button 
    variant="outline" 
    className="h-auto py-6 flex flex-col items-center justify-center hover:bg-gray-50 hover:border-gray-300 space-y-2 transition-all"
    onClick={onClick}
  >
    <div className="text-caseMgmt-primary text-lg">{icon}</div>
    <span>{label}</span>
  </Button>
);

const AlertItem = ({ 
  icon, 
  text, 
  color 
}: { 
  icon: string; 
  text: string; 
  color: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="text-xl">{icon}</div>
    <p className={`${color}`}>{text}</p>
  </div>
);

export default Dashboard;
