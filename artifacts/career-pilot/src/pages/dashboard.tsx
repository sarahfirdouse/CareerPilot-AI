import { useGetDashboardStats, useGetRecentActivity, useGetMonthlyTrend, useGetStatusBreakdown } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Briefcase, CheckCircle2, TrendingUp, Clock, Activity } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const STATUS_COLORS = {
  wishlist: "#64748b",
  applied: "#3b82f6",
  oa_received: "#8b5cf6",
  interview_scheduled: "#f59e0b",
  final_round: "#ec4899",
  offer: "#10b981",
  rejected: "#ef4444",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const { data: trends, isLoading: trendsLoading } = useGetMonthlyTrend();
  const { data: breakdown, isLoading: breakdownLoading } = useGetStatusBreakdown();

  if (statsLoading || activityLoading || trendsLoading || breakdownLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-8">
      <motion.div variants={item} className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Command Center</h1>
        <p className="text-muted-foreground text-lg">Mission overview for your job search.</p>
      </motion.div>

      <motion.div variants={item} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Applications", value: stats?.totalApplications || 0, sub: `${stats?.activeApplications || 0} active`, icon: Briefcase, color: "text-blue-400" },
          { title: "Interviews", value: stats?.interviews || 0, sub: "Scheduled", icon: Clock, color: "text-amber-400" },
          { title: "Offers", value: stats?.offers || 0, sub: "Secured", icon: CheckCircle2, color: "text-emerald-400" },
          { title: "Success Rate", value: `${(stats?.successRate || 0).toFixed(1)}%`, sub: "Applications to offers", icon: TrendingUp, color: "text-purple-400" },
        ].map((stat, i) => (
          <Card key={i} className="glass-panel overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={item} className="col-span-4">
          <Card className="glass-panel h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Application Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends || []}>
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value.substring(0, 3)} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'rgba(15,15,20,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(8px)' }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="col-span-3">
          <Card className="glass-panel h-full">
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdown || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="count" nameKey="status">
                      {(breakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15,15,20,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(8px)' }} formatter={(value, name: string) => [value, name.replace('_', ' ')]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 justify-center">
                {(breakdown || []).map((item) => (
                  <div key={item.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] }} />
                    <span className="capitalize">{item.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(activity || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity on your radar.</p>
              ) : (
                (activity || []).map((item, i) => (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={item.id} className="flex items-center gap-4 text-sm p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div className="p-2 bg-primary/10 text-primary rounded-full">
                      {item.type === 'status_change' ? <TrendingUp className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white/90">{item.description}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}