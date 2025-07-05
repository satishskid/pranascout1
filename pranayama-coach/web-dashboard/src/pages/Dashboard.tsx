/**
 * Dashboard Page - Main overview of system metrics and user activity
 */

import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  People,
  FavoriteRounded,
  SelfImprovement,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

// Mock data for demonstration
const mockDashboardData = {
  overview: {
    totalUsers: 12547,
    activeUsers: 8234,
    totalSessions: 45782,
    avgSessionDuration: 18.5, // minutes
    userGrowth: 12.5, // percentage
    sessionGrowth: 8.3,
  },
  userActivity: [
    { date: '2024-01-01', users: 1200, sessions: 3400 },
    { date: '2024-01-02', users: 1350, sessions: 3800 },
    { date: '2024-01-03', users: 1180, sessions: 3200 },
    { date: '2024-01-04', users: 1420, sessions: 4100 },
    { date: '2024-01-05', users: 1580, sessions: 4600 },
    { date: '2024-01-06', users: 1720, sessions: 5200 },
    { date: '2024-01-07', users: 1650, sessions: 4900 },
  ],
  sessionTypes: [
    { name: 'Pranayama', value: 45, color: '#1a1a2e' },
    { name: 'Meditation Walk', value: 25, color: '#16213e' },
    { name: 'Indoor Meditation', value: 20, color: '#eee2dc' },
    { name: 'Breathing Exercise', value: 10, color: '#8e9aaf' },
  ],
  recentSessions: [
    {
      id: 1,
      user: 'john.doe@email.com',
      type: 'Nadi Shodhana',
      duration: 22,
      completion: 95,
      stress_reduction: 18,
      timestamp: '2024-01-07 14:30',
    },
    {
      id: 2,
      user: 'jane.smith@email.com',
      type: 'Box Breathing',
      duration: 15,
      completion: 100,
      stress_reduction: 25,
      timestamp: '2024-01-07 14:15',
    },
    {
      id: 3,
      user: 'mike.wilson@email.com',
      type: 'Morning Walk',
      duration: 35,
      completion: 88,
      stress_reduction: 12,
      timestamp: '2024-01-07 13:45',
    },
  ],
  systemHealth: {
    apiStatus: 'healthy',
    databaseStatus: 'healthy',
    averageResponseTime: 145, // ms
    errorRate: 0.2, // percentage
    uptime: 99.8, // percentage
  },
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: number;
}> = ({ title, value, subtitle, icon, color = '#1a1a2e', trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            backgroundColor: `${color}20`,
            color: color,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="div" fontWeight="bold">
            {typeof value === 'number' && value > 1000
              ? `${(value / 1000).toFixed(1)}k`
              : value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
              <Typography variant="caption" color="success.main">
                +{trend}% this week
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// Status Indicator Component
const StatusIndicator: React.FC<{ status: string; label: string }> = ({
  status,
  label,
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
    {status === 'healthy' ? (
      <CheckCircle sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
    ) : (
      <Warning sx={{ color: 'warning.main', mr: 1, fontSize: 20 }} />
    )}
    <Typography variant="body2">{label}</Typography>
    <Chip
      label={status}
      size="small"
      color={status === 'healthy' ? 'success' : 'warning'}
      sx={{ ml: 'auto' }}
    />
  </Box>
);

const Dashboard: React.FC = () => {
  // In a real app, this would fetch from your API
  const { data: dashboardData = mockDashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => Promise.resolve(mockDashboardData),
  });

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome to the Pranayama Coach Admin Dashboard. Monitor user activity,
        session analytics, and system health.
      </Typography>

      {/* Overview Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Users"
            value={dashboardData.overview.totalUsers}
            icon={<People />}
            color="#1a1a2e"
            trend={dashboardData.overview.userGrowth}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Users (30d)"
            value={dashboardData.overview.activeUsers}
            icon={<SelfImprovement />}
            color="#16213e"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Sessions"
            value={dashboardData.overview.totalSessions}
            icon={<FavoriteRounded />}
            color="#8e9aaf"
            trend={dashboardData.overview.sessionGrowth}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Session Duration"
            value={`${dashboardData.overview.avgSessionDuration}min`}
            icon={<TrendingUp />}
            color="#eee2dc"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* User Activity Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Activity (Last 7 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.userActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stackId="1"
                    stroke="#1a1a2e"
                    fill="#1a1a2e"
                    fillOpacity={0.8}
                    name="Active Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stackId="2"
                    stroke="#8e9aaf"
                    fill="#8e9aaf"
                    fillOpacity={0.6}
                    name="Sessions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Session Types Distribution */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Session Types Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dashboardData.sessionTypes}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {dashboardData.sessionTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Sessions */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Sessions
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Completion</TableCell>
                      <TableCell>Stress Reduction</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recentSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>{session.user}</TableCell>
                        <TableCell>{session.type}</TableCell>
                        <TableCell>{session.duration}min</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={session.completion}
                                sx={{ height: 8, borderRadius: 5 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {session.completion}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`-${session.stress_reduction}%`}
                            size="small"
                            color="success"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {session.timestamp}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <StatusIndicator
                status={dashboardData.systemHealth.apiStatus}
                label="API Status"
              />
              <StatusIndicator
                status={dashboardData.systemHealth.databaseStatus}
                label="Database"
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Avg Response Time
                </Typography>
                <Typography variant="h6">
                  {dashboardData.systemHealth.averageResponseTime}ms
                </Typography>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Error Rate
                </Typography>
                <Typography variant="h6">
                  {dashboardData.systemHealth.errorRate}%
                </Typography>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Uptime
                </Typography>
                <Typography variant="h6" color="success.main">
                  {dashboardData.systemHealth.uptime}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;