import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  LinearProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Speed,
  Timer,
  FitnessCenter,
  Assessment,
  Warning,
  Error,
  CheckCircle,
  Search,
  Refresh,
  GetApp,
  Cloud,
  Storage,
  Memory,
  NetworkCheck,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalUsers: 15420,
    activeUsers: 8750,
    totalWorkouts: 47892,
    totalCalories: 2847320,
    averageSessionTime: 28.5,
    userRetention: 0.68,
    aiAccuracy: 0.87,
    systemUptime: 0.997,
  },
  userGrowth: [
    { month: 'Jan', users: 1200, active: 800 },
    { month: 'Feb', users: 1450, active: 950 },
    { month: 'Mar', users: 1780, active: 1200 },
    { month: 'Apr', users: 2100, active: 1400 },
    { month: 'May', users: 2650, active: 1800 },
    { month: 'Jun', users: 3200, active: 2200 },
    { month: 'Jul', users: 3800, active: 2600 },
    { month: 'Aug', users: 4500, active: 3100 },
    { month: 'Sep', users: 5200, active: 3600 },
  ],
  workoutTrends: [
    { date: '2023-09-01', HIIT: 120, Strength: 85, Yoga: 95, Cardio: 75 },
    { date: '2023-09-02', HIIT: 145, Strength: 92, Yoga: 88, Cardio: 82 },
    { date: '2023-09-03', HIIT: 132, Strength: 78, Yoga: 102, Cardio: 69 },
    { date: '2023-09-04', HIIT: 168, Strength: 105, Yoga: 94, Cardio: 91 },
    { date: '2023-09-05', HIIT: 189, Strength: 118, Yoga: 87, Cardio: 103 },
    { date: '2023-09-06', HIIT: 210, Strength: 132, Yoga: 95, Cardio: 115 },
    { date: '2023-09-07', HIIT: 195, Strength: 125, Yoga: 108, Cardio: 98 },
  ],
  deviceUsage: [
    { name: 'Mobile App', value: 65, color: '#007AFF' },
    { name: 'Web Platform', value: 25, color: '#34C759' },
    { name: 'Smart TV', value: 7, color: '#FF9500' },
    { name: 'Tablet', value: 3, color: '#5856D6' },
  ],
  formScores: [
    { exercise: 'Push-ups', avgScore: 0.87, sessions: 1247 },
    { exercise: 'Squats', avgScore: 0.92, sessions: 1156 },
    { exercise: 'Planks', avgScore: 0.89, sessions: 987 },
    { exercise: 'Burpees', avgScore: 0.78, sessions: 856 },
    { exercise: 'Lunges', avgScore: 0.84, sessions: 745 },
  ],
  systemMetrics: {
    cpu: 45,
    memory: 62,
    storage: 38,
    network: 89,
    responseTime: 145,
    errors: 2,
    activeConnections: 1247,
  },
  recentErrors: [
    { id: 1, type: 'AI Service', message: 'Pose detection timeout', time: '2 hours ago', severity: 'warning' },
    { id: 2, type: 'Database', message: 'Connection pool exhausted', time: '4 hours ago', severity: 'error' },
    { id: 3, type: 'API Gateway', message: 'Rate limit exceeded', time: '6 hours ago', severity: 'warning' },
  ],
  topUsers: [
    { id: 1, name: 'John Doe', workouts: 156, calories: 31200, streak: 45 },
    { id: 2, name: 'Jane Smith', workouts: 142, calories: 28400, streak: 38 },
    { id: 3, name: 'Mike Johnson', workouts: 138, calories: 27600, streak: 32 },
    { id: 4, name: 'Sarah Wilson', workouts: 134, calories: 26800, streak: 29 },
    { id: 5, name: 'Tom Brown', workouts: 128, calories: 25600, streak: 25 },
  ],
};

const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend, trendValue }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography color="textSecondary" variant="body2">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend === 'up' ? (
                  <TrendingUp fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDown fontSize="small" sx={{ color: 'error.main', mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  color={trend === 'up' ? 'success.main' : 'error.main'}
                >
                  {trendValue}% from last month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            <Icon fontSize="large" />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

const SystemMetricCard = ({ title, value, max, unit, icon: Icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
        <Icon sx={{ color, mr: 1 }} />
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h4" color={color}>
          {value}{unit}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {Math.round((value / max) * 100)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(value / max) * 100}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
          },
        }}
      />
    </CardContent>
  </Card>
);

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Analytics Dashboard
          </Typography>
          <Typography color="textSecondary" variant="body1">
            Comprehensive insights into your FitAI Pro platform performance.
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<GetApp />}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Overview Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Users"
            value={formatNumber(mockAnalytics.overview.totalUsers)}
            subtitle={`${formatNumber(mockAnalytics.overview.activeUsers)} active`}
            icon={FitnessCenter}
            color="primary.main"
            trend="up"
            trendValue="12"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Workouts"
            value={formatNumber(mockAnalytics.overview.totalWorkouts)}
            subtitle="All time"
            icon={Timer}
            color="success.main"
            trend="up"
            trendValue="8"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Session Time"
            value={`${mockAnalytics.overview.averageSessionTime}m`}
            subtitle="Per workout"
            icon={Speed}
            color="warning.main"
            trend="up"
            trendValue="5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="AI Accuracy"
            value={`${Math.round(mockAnalytics.overview.aiAccuracy * 100)}%`}
            subtitle="Form analysis"
            icon={Assessment}
            color="secondary.main"
            trend="up"
            trendValue="3"
          />
        </Grid>
      </Grid>

      {/* System Health Alerts */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Alert severity="success" sx={{ mb: 2 }}>
            <AlertTitle>System Status: Healthy</AlertTitle>
            All services are operational. System uptime: {Math.round(mockAnalytics.overview.systemUptime * 100)}%
          </Alert>
          
          {/* Recent Errors */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent System Events
              </Typography>
              <List>
                {mockAnalytics.recentErrors.map((error, index) => (
                  <React.Fragment key={error.id}>
                    <ListItem>
                      <ListItemIcon>
                        {error.severity === 'error' ? (
                          <Error color="error" />
                        ) : (
                          <Warning color="warning" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={`${error.type}: ${error.message}`}
                        secondary={error.time}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                    {index < mockAnalytics.recentErrors.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <SystemMetricCard
                title="CPU Usage"
                value={mockAnalytics.systemMetrics.cpu}
                max={100}
                unit="%"
                icon={Speed}
                color="#007AFF"
              />
            </Grid>
            <Grid item xs={12}>
              <SystemMetricCard
                title="Memory"
                value={mockAnalytics.systemMetrics.memory}
                max={100}
                unit="%"
                icon={Memory}
                color="#34C759"
              />
            </Grid>
            <Grid item xs={12}>
              <SystemMetricCard
                title="Storage"
                value={mockAnalytics.systemMetrics.storage}
                max={100}
                unit="%"
                icon={Storage}
                color="#FF9500"
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* User Growth Chart */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Growth & Activity
              </Typography>
              <Box height={350}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockAnalytics.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stackId="1"
                      stroke="#007AFF"
                      fill="#007AFF"
                      fillOpacity={0.6}
                      name="Total Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="active"
                      stackId="2"
                      stroke="#34C759"
                      fill="#34C759"
                      fillOpacity={0.8}
                      name="Active Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Usage
              </Typography>
              <Box height={350}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockAnalytics.deviceUsage}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {mockAnalytics.deviceUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Workout Trends */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Workout Type Popularity Trends
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockAnalytics.workoutTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="HIIT" stroke="#007AFF" strokeWidth={2} />
                    <Line type="monotone" dataKey="Strength" stroke="#34C759" strokeWidth={2} />
                    <Line type="monotone" dataKey="Yoga" stroke="#FF9500" strokeWidth={2} />
                    <Line type="monotone" dataKey="Cardio" stroke="#5856D6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Form Analysis & Top Users */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Form Analysis Performance
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Exercise</TableCell>
                      <TableCell align="right">Avg Score</TableCell>
                      <TableCell align="right">Sessions</TableCell>
                      <TableCell align="right">Accuracy</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockAnalytics.formScores.map((row) => (
                      <TableRow key={row.exercise}>
                        <TableCell component="th" scope="row">
                          {row.exercise}
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end">
                            <Typography variant="body2" mr={1}>
                              {Math.round(row.avgScore * 100)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={row.avgScore * 100}
                              sx={{ width: 50, height: 6 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">{row.sessions.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={row.avgScore >= 0.85 ? 'High' : row.avgScore >= 0.7 ? 'Medium' : 'Low'}
                            color={row.avgScore >= 0.85 ? 'success' : row.avgScore >= 0.7 ? 'warning' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Users
              </Typography>
              <List>
                {mockAnalytics.topUsers.map((user, index) => (
                  <React.Fragment key={user.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          {index + 1}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={user.name}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {user.workouts} workouts • {user.calories.toLocaleString()} calories
                            </Typography>
                            <Typography variant="caption" color="primary">
                              {user.streak} day streak
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < mockAnalytics.topUsers.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
