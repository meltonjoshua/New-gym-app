import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Security,
  Backup,
  Notifications,
  CloudUpload,
  Edit,
  Delete,
  Add,
  ExpandMore,
  Save,
  Refresh,
  Download,
  Upload,
  Settings as SettingsIcon,
  SmartToy,
  Storage,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Mock settings data
const mockSettings = {
  general: {
    siteName: 'FitAI Pro',
    siteDescription: 'AI-Powered Fitness Training Platform',
    contactEmail: 'admin@fitaipro.com',
    supportEmail: 'support@fitaipro.com',
    maintenanceMode: false,
    registrationEnabled: true,
    maxUsersPerTrainer: 50,
    sessionTimeout: 30,
  },
  ai: {
    poseDetectionEnabled: true,
    formAnalysisThreshold: 0.7,
    realTimeFeedback: true,
    modelVersion: 'v2.1.0',
    confidenceThreshold: 0.85,
    autoCalibration: true,
    exerciseRecognition: true,
    adaptiveDifficulty: true,
  },
  notifications: {
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    workoutReminders: true,
    formFeedback: true,
    achievementAlerts: true,
    maintenanceNotices: true,
    marketingEmails: false,
  },
  security: {
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    sessionExpiration: 24,
    maxLoginAttempts: 5,
    twoFactorRequired: false,
    ipWhitelisting: false,
    encryptionEnabled: true,
  },
  storage: {
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'png', 'mp4', 'webm'],
    cloudProvider: 'aws',
    backupFrequency: 'daily',
    retentionPeriod: 90,
    compressionEnabled: true,
  },
  integrations: [
    { id: 1, name: 'Google Analytics', enabled: true, status: 'connected' },
    { id: 2, name: 'Stripe Payments', enabled: true, status: 'connected' },
    { id: 3, name: 'SendGrid Email', enabled: true, status: 'connected' },
    { id: 4, name: 'AWS S3', enabled: true, status: 'connected' },
    { id: 5, name: 'Firebase Push', enabled: false, status: 'disconnected' },
  ],
};

const SettingsSection = ({ title, icon: Icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Icon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6">{title}</Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  </motion.div>
);

function GeneralSettings({ settings, onUpdate }) {
  return (
    <SettingsSection title="General Settings" icon={SettingsIcon}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Site Name"
            value={settings.siteName}
            onChange={(e) => onUpdate('siteName', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Email"
            value={settings.contactEmail}
            onChange={(e) => onUpdate('contactEmail', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Site Description"
            value={settings.siteDescription}
            onChange={(e) => onUpdate('siteDescription', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.maintenanceMode}
                onChange={(e) => onUpdate('maintenanceMode', e.target.checked)}
              />
            }
            label="Maintenance Mode"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.registrationEnabled}
                onChange={(e) => onUpdate('registrationEnabled', e.target.checked)}
              />
            }
            label="User Registration Enabled"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box>
            <Typography gutterBottom>Max Users per Trainer: {settings.maxUsersPerTrainer}</Typography>
            <Slider
              value={settings.maxUsersPerTrainer}
              onChange={(e, value) => onUpdate('maxUsersPerTrainer', value)}
              min={10}
              max={100}
              step={5}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box>
            <Typography gutterBottom>Session Timeout: {settings.sessionTimeout} minutes</Typography>
            <Slider
              value={settings.sessionTimeout}
              onChange={(e, value) => onUpdate('sessionTimeout', value)}
              min={5}
              max={120}
              step={5}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        </Grid>
      </Grid>
    </SettingsSection>
  );
}

function AISettings({ settings, onUpdate }) {
  return (
    <SettingsSection title="AI & Machine Learning" icon={SmartToy}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.poseDetectionEnabled}
                onChange={(e) => onUpdate('poseDetectionEnabled', e.target.checked)}
              />
            }
            label="Pose Detection Enabled"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.realTimeFeedback}
                onChange={(e) => onUpdate('realTimeFeedback', e.target.checked)}
              />
            }
            label="Real-time Feedback"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box>
            <Typography gutterBottom>
              Form Analysis Threshold: {Math.round(settings.formAnalysisThreshold * 100)}%
            </Typography>
            <Slider
              value={settings.formAnalysisThreshold}
              onChange={(e, value) => onUpdate('formAnalysisThreshold', value)}
              min={0.5}
              max={1.0}
              step={0.05}
              marks
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box>
            <Typography gutterBottom>
              Confidence Threshold: {Math.round(settings.confidenceThreshold * 100)}%
            </Typography>
            <Slider
              value={settings.confidenceThreshold}
              onChange={(e, value) => onUpdate('confidenceThreshold', value)}
              min={0.5}
              max={1.0}
              step={0.05}
              marks
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Model Version"
            value={settings.modelVersion}
            disabled
            margin="normal"
            helperText="Current AI model version"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.autoCalibration}
                onChange={(e) => onUpdate('autoCalibration', e.target.checked)}
              />
            }
            label="Auto Calibration"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.exerciseRecognition}
                onChange={(e) => onUpdate('exerciseRecognition', e.target.checked)}
              />
            }
            label="Exercise Recognition"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.adaptiveDifficulty}
                onChange={(e) => onUpdate('adaptiveDifficulty', e.target.checked)}
              />
            }
            label="Adaptive Difficulty"
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          AI model updates require system restart. Schedule updates during maintenance windows.
        </Typography>
      </Alert>
      
      <Box display="flex" gap={2}>
        <Button variant="outlined" startIcon={<Download />}>
          Download Model Logs
        </Button>
        <Button variant="outlined" startIcon={<Refresh />}>
          Retrain Model
        </Button>
        <Button variant="contained" startIcon={<Upload />}>
          Update Model
        </Button>
      </Box>
    </SettingsSection>
  );
}

function SecuritySettings({ settings, onUpdate }) {
  return (
    <SettingsSection title="Security & Privacy" icon={Security}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box>
            <Typography gutterBottom>Password Min Length: {settings.passwordMinLength}</Typography>
            <Slider
              value={settings.passwordMinLength}
              onChange={(e, value) => onUpdate('passwordMinLength', value)}
              min={6}
              max={20}
              step={1}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box>
            <Typography gutterBottom>Session Expiration: {settings.sessionExpiration} hours</Typography>
            <Slider
              value={settings.sessionExpiration}
              onChange={(e, value) => onUpdate('sessionExpiration', value)}
              min={1}
              max={168}
              step={1}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.requireSpecialChars}
                onChange={(e) => onUpdate('requireSpecialChars', e.target.checked)}
              />
            }
            label="Require Special Characters"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.requireNumbers}
                onChange={(e) => onUpdate('requireNumbers', e.target.checked)}
              />
            }
            label="Require Numbers in Password"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.twoFactorRequired}
                onChange={(e) => onUpdate('twoFactorRequired', e.target.checked)}
              />
            }
            label="Require Two-Factor Authentication"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.encryptionEnabled}
                onChange={(e) => onUpdate('encryptionEnabled', e.target.checked)}
              />
            }
            label="Data Encryption Enabled"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box>
            <Typography gutterBottom>Max Login Attempts: {settings.maxLoginAttempts}</Typography>
            <Slider
              value={settings.maxLoginAttempts}
              onChange={(e, value) => onUpdate('maxLoginAttempts', value)}
              min={3}
              max={10}
              step={1}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.ipWhitelisting}
                onChange={(e) => onUpdate('ipWhitelisting', e.target.checked)}
              />
            }
            label="IP Whitelisting"
          />
        </Grid>
      </Grid>
    </SettingsSection>
  );
}

function NotificationSettings({ settings, onUpdate }) {
  return (
    <SettingsSection title="Notifications" icon={Notifications}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Delivery Methods
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={settings.emailEnabled}
                onChange={(e) => onUpdate('emailEnabled', e.target.checked)}
              />
            }
            label="Email Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.pushEnabled}
                onChange={(e) => onUpdate('pushEnabled', e.target.checked)}
              />
            }
            label="Push Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.smsEnabled}
                onChange={(e) => onUpdate('smsEnabled', e.target.checked)}
              />
            }
            label="SMS Notifications"
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle1" gutterBottom>
            Notification Types
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.workoutReminders}
                    onChange={(e) => onUpdate('workoutReminders', e.target.checked)}
                  />
                }
                label="Workout Reminders"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.formFeedback}
                    onChange={(e) => onUpdate('formFeedback', e.target.checked)}
                  />
                }
                label="Form Feedback Alerts"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.achievementAlerts}
                    onChange={(e) => onUpdate('achievementAlerts', e.target.checked)}
                  />
                }
                label="Achievement Alerts"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.maintenanceNotices}
                    onChange={(e) => onUpdate('maintenanceNotices', e.target.checked)}
                  />
                }
                label="Maintenance Notices"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.marketingEmails}
                    onChange={(e) => onUpdate('marketingEmails', e.target.checked)}
                  />
                }
                label="Marketing Emails"
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </SettingsSection>
  );
}

function IntegrationsSettings({ integrations }) {
  return (
    <SettingsSection title="Integrations" icon={CloudUpload}>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Service</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Enabled</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {integrations.map((integration) => (
              <TableRow key={integration.id}>
                <TableCell component="th" scope="row">
                  {integration.name}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={integration.status}
                    color={integration.status === 'connected' ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={integration.enabled}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small">
                    <Edit />
                  </IconButton>
                  <IconButton size="small">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box mt={3}>
        <Button variant="outlined" startIcon={<Add />}>
          Add Integration
        </Button>
      </Box>
    </SettingsSection>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(mockSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateGeneralSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      general: { ...prev.general, [key]: value }
    }));
    setHasChanges(true);
  };

  const updateAISetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      ai: { ...prev.ai, [key]: value }
    }));
    setHasChanges(true);
  };

  const updateSecuritySetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, [key]: value }
    }));
    setHasChanges(true);
  };

  const updateNotificationSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setHasChanges(false);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            System Settings
          </Typography>
          <Typography color="textSecondary" variant="body1">
            Configure your FitAI Pro platform settings and preferences.
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          {hasChanges && (
            <Alert severity="warning" sx={{ mr: 2 }}>
              You have unsaved changes
            </Alert>
          )}
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {/* Settings Sections */}
      <GeneralSettings 
        settings={settings.general} 
        onUpdate={updateGeneralSetting} 
      />
      
      <AISettings 
        settings={settings.ai} 
        onUpdate={updateAISetting} 
      />
      
      <SecuritySettings 
        settings={settings.security} 
        onUpdate={updateSecuritySetting} 
      />
      
      <NotificationSettings 
        settings={settings.notifications} 
        onUpdate={updateNotificationSetting} 
      />
      
      <IntegrationsSettings 
        integrations={settings.integrations} 
      />

      {/* Backup & Maintenance Section */}
      <SettingsSection title="Backup & Maintenance" icon={Backup}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Database Backup
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Last backup: 2 hours ago
            </Typography>
            <Box display="flex" gap={2}>
              <Button variant="outlined" startIcon={<Download />}>
                Download Backup
              </Button>
              <Button variant="contained" startIcon={<Backup />}>
                Create Backup
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              System Maintenance
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Next maintenance: Tomorrow at 2:00 AM
            </Typography>
            <Box display="flex" gap={2}>
              <Button variant="outlined">
                Schedule Maintenance
              </Button>
              <Button variant="outlined" color="warning">
                Emergency Restart
              </Button>
            </Box>
          </Grid>
        </Grid>
      </SettingsSection>

      {/* Advanced Settings */}
      <SettingsSection title="Advanced Configuration" icon={Storage}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Database Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Connection Pool Size"
                  type="number"
                  defaultValue={20}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Query Timeout (seconds)"
                  type="number"
                  defaultValue={30}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>API Rate Limiting</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Requests per minute"
                  type="number"
                  defaultValue={100}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Burst limit"
                  type="number"
                  defaultValue={200}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>CDN & Caching</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>CDN Provider</InputLabel>
                  <Select defaultValue="cloudflare" label="CDN Provider">
                    <MenuItem value="cloudflare">Cloudflare</MenuItem>
                    <MenuItem value="aws">AWS CloudFront</MenuItem>
                    <MenuItem value="azure">Azure CDN</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cache TTL (hours)"
                  type="number"
                  defaultValue={24}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </SettingsSection>
    </Box>
  );
}
