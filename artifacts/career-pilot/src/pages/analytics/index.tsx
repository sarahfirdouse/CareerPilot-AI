import { useGetDashboardStats, useGetMonthlyTrend, useGetStatusBreakdown } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { Target, Trophy, Percent } from "lucide-react";
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

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: trends, isLoading: trendsLoading } = useGetMonthlyTrend();
  const { data: breakdown, isLoading: breakdownLoading } = useGetStatusBreakdown();

  const interviewRate = stats?.totalApplications ? ((stats.interviews / stats.totalApplications) * 100) : 0;
  const offerRate = stats?.interviews ? ((stats.offers / stats.interviews) * 100) : 0;

  if (statsLoading || trendsLoading || breakdownLoading) {
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
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Analytics</h1>
        <p className="text-muted-foreground text-lg">Deep dive into your application funnel performance.</p>
      </motion.div>

      <motion.div variants={item} className="grid gap-6 md:grid-cols-3">
        <Card className="glass-panel overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Interview Rate</CardTitle>
            <Target className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{interviewRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Applications resulting in interviews</p>
          </CardContent>
        </Card>
        <Card className="glass-panel overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offer Conversion</CardTitle>
            <Trophy className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{offerRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Interviews resulting in offers</p>
          </CardContent>
        </Card>
        <Card className="glass-panel overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Success Rate</CardTitle>
            <Percent className="h-5 w-5 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{(stats?.successRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Applications resulting in offers</p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={item}>
          <Card className="glass-panel h-full">
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
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{stroke: 'rgba(255,255,255,0.1)'}} contentStyle={{ backgroundColor: 'rgba(15,15,20,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(8px)' }} />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass-panel h-full">
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
                      stroke="#888888"
                    />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'rgba(15,15,20,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(8px)' }} formatter={(value, name: string) => [value, 'Count']} />
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
        </motion.div>
      </div>
    </motion.div>
  );
}