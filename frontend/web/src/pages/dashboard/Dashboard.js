import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  TrendingUp,
  FitnessCenter,
  People,
  Speed,
  Assessment,
  Refresh,
  Add,
  NotificationsActive,
  CheckCircle,
  Warning,
  Error,
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
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';

// Mock data for demonstration
const mockData = {
  totalUsers: 15420,
  activeUsers: 8750,
  totalWorkouts: 47892,
  totalCaloriesBurned: 2847320,
  averageFormScore: 0.78,
  userGrowth: [
    { date: '2023-01', users: 1200 },
    { date: '2023-02', users: 1450 },
    { date: '2023-03', users: 1780 },
    { date: '2023-04', users: 2100 },
    { date: '2023-05', users: 2650 },
    { date: '2023-06', users: 3200 },
    { date: '2023-07', users: 3800 },
    { date: '2023-08', users: 4500 },
    { date: '2023-09', users: 5200 },
  ],
  workoutData: [
    { date: '2023-09-01', workouts: 1200, calories: 45000 },
    { date: '2023-09-02', workouts: 1450, calories: 52000 },
    { date: '2023-09-03', workouts: 1320, calories: 48000 },
    { date: '2023-09-04', workouts: 1680, calories: 61000 },
    { date: '2023-09-05', workouts: 1890, calories: 68000 },
    { date: '2023-09-06', workouts: 2100, calories: 75000 },
    { date: '2023-09-07', workouts: 1950, calories: 70000 },
  ],
  exercisePopularity: [
    { name: 'Push-ups', value: 25, color: '#007AFF' },
    { name: 'Squats', value: 20, color: '#34C759' },
    { name: 'Planks', value: 15, color: '#FF9500' },
    { name: 'Burpees', value: 12, color: '#FF3B30' },
    { name: 'Lunges', value: 10, color: '#5856D6' },
    { name: 'Others', value: 18, color: '#8E8E93' },
  ],
  recentActivities: [
    { id: 1, user: 'John Doe', action: 'Completed HIIT workout', time: '5 min ago', type: 'success' },
    { id: 2, user: 'Jane Smith', action: 'Achieved perfect form score', time: '12 min ago', type: 'success' },
    { id: 3, user: 'Mike Johnson', action: 'Started strength training', time: '20 min ago', type: 'info' },
    { id: 4, user: 'Sarah Wilson', action: 'Form analysis failed', time: '25 min ago', type: 'warning' },
    { id: 5, user: 'Tom Brown', action: 'Reached 30-day streak', time: '32 min ago', type: 'success' },
  ],
  systemAlerts: [
    { id: 1, message: 'AI service response time increased', severity: 'warning', time: '2 hours ago' },
    { id: 2, message: 'Database backup completed successfully', severity: 'success', time: '4 hours ago' },
    { id: 3, message: 'User registration spike detected', severity: 'info', time: '6 hours ago' },
  ],
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
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
                <TrendingUp fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +{trend}% from last month
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

const ActivityItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'warning':
        return <Warning sx={{ color: 'warning.main' }} />;
      case 'error':
        return <Error sx={{ color: 'error.main' }} />;
      default:
        return <FitnessCenter sx={{ color: 'primary.main' }} />;
    }
  };

  return (
    <ListItem>
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'transparent' }}>
          {getActivityIcon(activity.type)}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={activity.action}
        secondary={`${activity.user} • ${activity.time}`}
        primaryTypographyProps={{ variant: 'body2' }}
        secondaryTypographyProps={{ variant: 'caption' }}
      />
    </ListItem>
  );
};

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [createWorkoutOpen, setCreateWorkoutOpen] = useState(false);

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
            FitAI Pro Dashboard
          </Typography>
          <Typography color="textSecondary" variant="body1">
            Welcome back! Here's what's happening with your fitness platform.
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
              <MenuItem value="24h">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
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
            startIcon={<Add />}
            onClick={() => setCreateWorkoutOpen(true)}
          >
            Create Workout
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={formatNumber(mockData.totalUsers)}
            subtitle={`${formatNumber(mockData.activeUsers)} active`}
            icon={People}
            color="primary.main"
            trend="12"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Workouts"
            value={formatNumber(mockData.totalWorkouts)}
            subtitle="This month"
            icon={FitnessCenter}
            color="success.main"
            trend="8"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Calories Burned"
            value={formatNumber(mockData.totalCaloriesBurned)}
            subtitle="Total platform"
            icon={Speed}
            color="warning.main"
            trend="15"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Form Score"
            value={`${Math.round(mockData.averageFormScore * 100)}%`}
            subtitle="AI analysis accuracy"
            icon={Assessment}
            color="secondary.main"
            trend="5"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={3}>
        {/* User Growth Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Growth
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockData.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#007AFF"
                      fill="#007AFF"
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Exercise Popularity */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Popular Exercises
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockData.exercisePopularity}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {mockData.exercisePopularity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Workout Activity Chart */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Workout Activity
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockData.workoutData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="workouts"
                      fill="#007AFF"
                      name="Workouts Completed"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="calories"
                      stroke="#34C759"
                      name="Calories Burned"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Activity Feed and Alerts */}
      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {mockData.recentActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <NotificationsActive sx={{ mr: 1 }} />
                <Typography variant="h6">
                  System Alerts
                </Typography>
              </Box>
              <List>
                {mockData.systemAlerts.map((alert) => (
                  <ListItem key={alert.id}>
                    <ListItemText
                      primary={alert.message}
                      secondary={alert.time}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <Chip
                      size="small"
                      label={alert.severity}
                      color={
                        alert.severity === 'success' ? 'success' :
                        alert.severity === 'warning' ? 'warning' :
                        alert.severity === 'error' ? 'error' : 'info'
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Workout Dialog */}
      <Dialog open={createWorkoutOpen} onClose={() => setCreateWorkoutOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Workout Template</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              fullWidth
              label="Workout Name"
              variant="outlined"
            />
            <FormControl fullWidth>
              <InputLabel>Workout Type</InputLabel>
              <Select label="Workout Type">
                <MenuItem value="strength">Strength Training</MenuItem>
                <MenuItem value="cardio">Cardiovascular</MenuItem>
                <MenuItem value="hiit">HIIT</MenuItem>
                <MenuItem value="flexibility">Flexibility</MenuItem>
                <MenuItem value="yoga">Yoga</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Target Duration (minutes)"
              type="number"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateWorkoutOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setCreateWorkoutOpen(false)}>
            Create Workout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
