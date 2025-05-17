
import { useEffect, useState } from "react";
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
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasRole, setHasRole] = useState(false);

  // Fetch user profile from Supabase Auth
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Check if the user has a role in the system
  useEffect(() => {
    const checkUserRole = async () => {
      if (session?.user?.id) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("auth_user_id", session.user.id)
          .single();
        
        if (data) {
          setHasRole(true);
        }
      }
    };
    
    checkUserRole();
  }, [session]);

  // Fetch case statistics from Supabase
  const { data: caseStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["caseStats"],
    queryFn: async () => {
      const openCases = await supabase
        .from("cases")
        .select("*", { count: "exact" })
        .eq("status", "open");
      
      const inProgressCases = await supabase
        .from("cases")
        .select("*", { count: "exact" })
        .eq("status", "in_progress");
      
      const closedCases = await supabase
        .from("cases")
        .select("*", { count: "exact" })
        .eq("status", "closed");
      
      const overdueCases = await supabase
        .from("cases")
        .select("*", { count: "exact" })
        .lt("sla_due_at", new Date().toISOString())
        .eq("status", "open");
      
      return {
        open: openCases.count || 0,
        inProgress: inProgressCases.count || 0,
        closed: closedCases.count || 0,
        overdue: overdueCases.count || 0,
      };
    },
    enabled: !!session,
  });

  // Fetch recent activities from Supabase
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("case_activities")
        .select("*, cases(title)")
        .order("created_at", { ascending: false })
        .limit(4);

      return data || [];
    },
    enabled: !!session,
  });

  // Weekly case data (this could be further enhanced with a weekly aggregation query)
  const { data: weeklyData, isLoading: isLoadingWeekly } = useQuery({
    queryKey: ["weeklyData"],
    queryFn: async () => {
      const getDayName = (dateStr) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[new Date(dateStr).getDay()];
      };

      const today = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      
      const { data } = await supabase
        .from("cases")
        .select("created_at")
        .gte("created_at", oneWeekAgo.toISOString())
        .lte("created_at", today.toISOString());
      
      if (!data) return [];
      
      // Group by day of week
      const groupedByDay = data.reduce((acc, curr) => {
        const day = getDayName(curr.created_at);
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});
      
      // Convert to array format for chart
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => ({
        name: day,
        cases: groupedByDay[day] || 0
      }));
    },
    enabled: !!session,
  });

  // Transform fetched data for pie chart
  const statusData = !isLoadingStats ? [
    { name: "Open", value: caseStats?.open || 0, color: "#3B82F6" },
    { name: "In Progress", value: caseStats?.inProgress || 0, color: "#F59E0B" },
    { name: "Closed", value: caseStats?.closed || 0, color: "#10B981" },
  ] : [];

  // Mock user data - would come from auth context in production
  const user = {
    name: session?.user?.email?.split('@')[0] || "User",
    role: hasRole ? "Staff" : "Guest",
    lastLogin: "Recently",
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

  // Format activities for display
  const formattedActivities = activities?.map(activity => {
    const timeAgo = new Date(activity.created_at).toLocaleDateString();
    let icon = "📝";
    
    switch(activity.activity_type) {
      case "note": icon = "📝"; break;
      case "reassigned": icon = "🔄"; break;
      case "closed": icon = "✅"; break;
      case "created": icon = "🆕"; break;
      default: icon = "📝";
    }
    
    return {
      id: activity.id,
      type: activity.activity_type,
      description: `${activity.activity_type} for Case ${activity.case_id.substring(0, 6)}...`,
      time: timeAgo,
      icon,
    };
  }) || [];

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
        <StatusCard 
          title="Open Cases" 
          count={isLoadingStats ? null : caseStats?.open || 0} 
          bgColor="bg-blue-100" 
          textColor="text-blue-700" 
          icon="📂"
          isLoading={isLoadingStats}
        />
        <StatusCard 
          title="In Progress" 
          count={isLoadingStats ? null : caseStats?.inProgress || 0}
          bgColor="bg-yellow-100" 
          textColor="text-yellow-700" 
          icon="⏳"
          isLoading={isLoadingStats}
        />
        <StatusCard 
          title="Closed Cases" 
          count={isLoadingStats ? null : caseStats?.closed || 0} 
          bgColor="bg-green-100" 
          textColor="text-green-700" 
          icon="✅"
          isLoading={isLoadingStats}
        />
        <StatusCard 
          title="Overdue Cases" 
          count={isLoadingStats ? null : caseStats?.overdue || 0}
          bgColor="bg-red-100" 
          textColor="text-red-700" 
          icon="🚨"
          isLoading={isLoadingStats}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Case Status Distribution</h2>
            <div className="h-64">
              {isLoadingStats ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
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
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Weekly Case Volume</h2>
            <div className="h-64">
              {isLoadingWeekly ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
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
              )}
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
            {isLoadingActivities ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {formattedActivities.length > 0 ? (
                  formattedActivities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                      <div className="text-2xl">{activity.icon}</div>
                      <div className="flex-1">
                        <p>{activity.description}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">No recent activities found</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SLA Alerts */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">SLA Alerts</h2>
            <div className="space-y-4">
              {!isLoadingStats && (
                <>
                  {caseStats?.overdue > 0 && (
                    <AlertItem icon="🚨" text={`${caseStats.overdue} case${caseStats.overdue !== 1 ? 's' : ''} overdue`} color="text-red-600" />
                  )}
                  {caseStats?.open > 0 && (
                    <AlertItem icon="⏳" text={`${caseStats.open} open case${caseStats.open !== 1 ? 's' : ''}`} color="text-yellow-600" />
                  )}
                  {caseStats?.inProgress > 0 && (
                    <AlertItem icon="🔔" text={`${caseStats.inProgress} case${caseStats.inProgress !== 1 ? 's' : ''} in progress`} color="text-blue-600" />
                  )}
                  {caseStats?.open === 0 && caseStats?.inProgress === 0 && caseStats?.overdue === 0 && (
                    <div className="text-center py-4 text-gray-500">No active cases requiring attention</div>
                  )}
                </>
              )}
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
  icon,
  isLoading = false
}: { 
  title: string; 
  count: number | null; 
  bgColor: string;
  textColor: string;
  icon: string;
  isLoading?: boolean;
}) => (
  <Card className={`${bgColor} border-none`}>
    <CardContent className="flex items-center justify-between pt-6">
      <div>
        <p className={`text-sm ${textColor}`}>{title}</p>
        <p className={`text-2xl font-bold ${textColor}`}>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            count
          )}
        </p>
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
