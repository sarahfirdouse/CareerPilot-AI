import { useGetDashboardStats, useGetMonthlyTrend, useGetStatusBreakdown } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { Target, Trophy, Percent, TrendingUp } from "lucide-react";

const STATUS_COLORS = {
  wishlist: "#94a3b8",
  applied: "#3b82f6",
  oa_received: "#8b5cf6",
  interview_scheduled: "#f59e0b",
  final_round: "#ec4899",
  offer: "#10b981",
  rejected: "#ef4444",
};

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: trends, isLoading: trendsLoading } = useGetMonthlyTrend();
  const { data: breakdown, isLoading: breakdownLoading } = useGetStatusBreakdown();

  const interviewRate = stats?.totalApplications ? ((stats.interviews / stats.totalApplications) * 100) : 0;
  const offerRate = stats?.interviews ? ((stats.offers / stats.interviews) * 100) : 0;

  if (statsLoading || trendsLoading || breakdownLoading) {
    return <div className="flex items-center justify-center h-96">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">Deep dive into your application funnel performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{interviewRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Applications resulting in interviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offer Conversion</CardTitle>
            <Trophy className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{offerRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Interviews resulting in offers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Success Rate</CardTitle>
            <Percent className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(stats?.successRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Applications resulting in offers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Application Volume</CardTitle>
            <CardDescription>Number of applications sent over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends || []}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funnel Breakdown</CardTitle>
            <CardDescription>Current state of all applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown || []} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="status" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    fontSize={12}
                    tickFormatter={(value) => value.replace('_', ' ').toUpperCase()}
                  />
                  <Tooltip 
                    cursor={{fill: 'var(--color-secondary)'}}
                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                    formatter={(value, name: string) => [value, 'Count']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {(breakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#8884d8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
