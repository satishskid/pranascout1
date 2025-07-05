import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Avatar,
  Chip,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  People,
  AccessTime,
  Favorite,
  Psychology,
  SelfImprovement,
} from '@mui/icons-material';
import { ApiService, Analytics as AnalyticsData } from '../services/ApiService';
import { format, subDays, startOfDay } from 'date-fns';

// Color scheme
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const Analytics: React.FC = () => {
  // State
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [vitalSignsData, setVitalSignsData] = useState<any>(null);
  const [retentionData, setRetentionData] = useState<any>(null);

  // Mock data for demo
  const mockUserGrowth = [
    { date: '2025-01-01', users: 1200, newUsers: 45 },
    { date: '2025-01-02', users: 1245, newUsers: 52 },
    { date: '2025-01-03', users: 1297, newUsers: 38 },
    { date: '2025-01-04', users: 1335, newUsers: 67 },
    { date: '2025-01-05', users: 1402, newUsers: 71 },
    { date: '2025-01-06', users: 1473, newUsers: 84 },
    { date: '2025-01-07', users: 1557, newUsers: 92 },
  ];

  const mockSessionData = [
    { type: 'Pranayama', count: 3420, duration: 15.2 },
    { type: 'Meditation', count: 2180, duration: 22.5 },
    { type: 'Walking', count: 1890, duration: 32.1 },
    { type: 'Breathing', count: 4210, duration: 8.7 },
  ];

  const mockEngagementData = [
    { date: '2025-01-01', dau: 850, wau: 4200, mau: 15600 },
    { date: '2025-01-02', dau: 920, wau: 4350, mau: 15800 },
    { date: '2025-01-03', dau: 780, wau: 4180, mau: 15900 },
    { date: '2025-01-04', dau: 1050, wau: 4520, mau: 16100 },
    { date: '2025-01-05', dau: 1120, wau: 4680, mau: 16300 },
    { date: '2025-01-06', dau: 990, wau: 4590, mau: 16500 },
    { date: '2025-01-07', dau: 1180, wau: 4720, mau: 16700 },
  ];

  const mockVitalSigns = [
    { metric: 'Heart Rate', avg: 72, min: 45, max: 160, sessions: 8420 },
    { metric: 'HRV', avg: 38, min: 15, max: 85, sessions: 7890 },
    { metric: 'SpO2', avg: 98, min: 92, max: 100, sessions: 6210 },
    { metric: 'Breathing Rate', avg: 16, min: 8, max: 35, sessions: 9340 },
  ];

  const mockStressData = [
    { time: '00:00', stress: 3.2, calm: 6.8 },
    { time: '04:00', stress: 2.1, calm: 7.9 },
    { time: '08:00', stress: 5.8, calm: 4.2 },
    { time: '12:00', stress: 7.2, calm: 2.8 },
    { time: '16:00', stress: 6.4, calm: 3.6 },
    { time: '20:00', stress: 4.1, calm: 5.9 },
  ];

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, these would be actual API calls
      setTimeout(() => {
        setAnalytics({
          totalUsers: 16700,
          activeUsers: 4720,
          totalSessions: 23891,
          avgSessionDuration: 18.6,
          userGrowth: mockUserGrowth,
          sessionsByType: mockSessionData,
          engagementMetrics: {
            dailyActiveUsers: 1180,
            weeklyActiveUsers: 4720,
            monthlyActiveUsers: 16700,
            retentionRate: 78.3,
          },
        });
        setEngagementData(mockEngagementData);
        setVitalSignsData(mockVitalSigns);
        setRetentionData([
          { cohort: 'Jan 2025', day0: 100, day1: 85, day7: 62, day30: 34 },
          { cohort: 'Dec 2024', day0: 100, day1: 82, day7: 58, day30: 31 },
          { cohort: 'Nov 2024', day0: 100, day1: 79, day7: 55, day30: 28 },
        ]);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value as any)}
          >
            <MenuItem value="day">Last 7 Days</MenuItem>
            <MenuItem value="week">Last 4 Weeks</MenuItem>
            <MenuItem value="month">Last 12 Months</MenuItem>
            <MenuItem value="year">Last 3 Years</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Total Users
                  </Typography>
                  <Typography variant="h5">{analytics?.totalUsers?.toLocaleString()}</Typography>
                  <Typography variant="body2" color="success.main">
                    +12.5% from last month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Active Users
                  </Typography>
                  <Typography variant="h5">{analytics?.activeUsers?.toLocaleString()}</Typography>
                  <Typography variant="body2" color="success.main">
                    +8.2% from last week
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <SelfImprovement />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Total Sessions
                  </Typography>
                  <Typography variant="h5">{analytics?.totalSessions?.toLocaleString()}</Typography>
                  <Typography variant="body2" color="success.main">
                    +15.7% from last month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <AccessTime />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Avg Session Duration
                  </Typography>
                  <Typography variant="h5">{analytics?.avgSessionDuration}m</Typography>
                  <Typography variant="body2" color="success.main">
                    +2.3 min from last month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="User Growth" />
            <Tab label="Session Analytics" />
            <Tab label="Engagement" />
            <Tab label="Vital Signs" />
            <Tab label="Retention" />
          </Tabs>
        </Box>

        {/* User Growth Tab */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Growth Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={mockUserGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                  formatter={(value, name) => [value, name === 'users' ? 'Total Users' : 'New Users']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="users"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                  name="Total Users"
                />
                <Area
                  type="monotone"
                  dataKey="newUsers"
                  stackId="2"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                  name="New Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </TabPanel>

        {/* Session Analytics Tab */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Sessions by Type
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockSessionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                    >
                      {mockSessionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value.toLocaleString(), 'Sessions']} />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Average Session Duration
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockSessionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value} minutes`, 'Duration']} />
                    <Bar dataKey="duration" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Engagement Tab */}
        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Engagement Metrics
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={mockEngagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                />
                <Legend />
                <Line type="monotone" dataKey="dau" stroke="#8884d8" name="Daily Active Users" strokeWidth={2} />
                <Line type="monotone" dataKey="wau" stroke="#82ca9d" name="Weekly Active Users" strokeWidth={2} />
                <Line type="monotone" dataKey="mau" stroke="#ffc658" name="Monthly Active Users" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </TabPanel>

        {/* Vital Signs Tab */}
        <TabPanel value={tabValue} index={3}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Stress vs Calm Levels Throughout Day
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockStressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="stress" stackId="1" stroke="#ff7300" fill="#ff7300" fillOpacity={0.6} name="Stress Level" />
                    <Area type="monotone" dataKey="calm" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} name="Calm Level" />
                  </AreaChart>
                </ResponsiveContainer>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>
                  Vital Signs Summary
                </Typography>
                {mockVitalSigns.map((vital, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">{vital.metric}</Typography>
                        <Chip
                          label={`${vital.avg} avg`}
                          color="primary"
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        Range: {vital.min} - {vital.max}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {vital.sessions.toLocaleString()} sessions
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Retention Tab */}
        <TabPanel value={tabValue} index={4}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Retention Cohorts
            </Typography>
            <Grid container spacing={2}>
              {retentionData?.map((cohort: any, index: number) => (
                <Grid item xs={12} key={index}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {cohort.cohort} Cohort
                      </Typography>
                      <Box display="flex" gap={2}>
                        <Chip label={`Day 0: ${cohort.day0}%`} color="primary" />
                        <Chip label={`Day 1: ${cohort.day1}%`} color="success" />
                        <Chip label={`Day 7: ${cohort.day7}%`} color="warning" />
                        <Chip label={`Day 30: ${cohort.day30}%`} color="error" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Analytics;