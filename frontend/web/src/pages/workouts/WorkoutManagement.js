import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Typography,
  Checkbox,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Fab,
  Menu,
  MenuItem as MenuItemComponent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Slider,
  Divider,
} from '@mui/material';
import {
  Search,
  FilterList,
  Add,
  Edit,
  Delete,
  MoreVert,
  PlayArrow,
  Stop,
  ContentCopy,
  Visibility,
  FitnessCenter,
  Timer,
  TrendingUp,
  Person,
  ExpandMore,
  Download,
  Upload,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Mock workout data
const mockWorkouts = [
  {
    id: 1,
    name: 'Full Body HIIT Blast',
    type: 'HIIT',
    difficulty: 'Intermediate',
    duration: 30,
    calories: 450,
    exercises: [
      { name: 'Burpees', sets: 3, reps: 15, duration: 45 },
      { name: 'Mountain Climbers', sets: 3, reps: 20, duration: 30 },
      { name: 'Jump Squats', sets: 3, reps: 15, duration: 45 },
      { name: 'Push-ups', sets: 3, reps: 12, duration: 60 },
    ],
    description: 'High-intensity interval training for full body conditioning',
    category: 'Cardio',
    equipment: ['None'],
    targetMuscles: ['Full Body'],
    created: '2023-08-15',
    createdBy: 'Jane Smith',
    isActive: true,
    completions: 1247,
    averageRating: 4.8,
    aiGenerated: false,
  },
  {
    id: 2,
    name: 'Upper Body Strength Builder',
    type: 'Strength',
    difficulty: 'Advanced',
    duration: 45,
    calories: 350,
    exercises: [
      { name: 'Pull-ups', sets: 4, reps: 8, duration: 120 },
      { name: 'Bench Press', sets: 4, reps: 10, duration: 90 },
      { name: 'Dumbbell Rows', sets: 3, reps: 12, duration: 90 },
      { name: 'Overhead Press', sets: 3, reps: 10, duration: 90 },
    ],
    description: 'Advanced upper body strength training routine',
    category: 'Strength',
    equipment: ['Dumbbells', 'Pull-up Bar', 'Bench'],
    targetMuscles: ['Chest', 'Back', 'Shoulders', 'Arms'],
    created: '2023-08-20',
    createdBy: 'Mike Johnson',
    isActive: true,
    completions: 892,
    averageRating: 4.6,
    aiGenerated: true,
  },
  {
    id: 3,
    name: 'Yoga Flow for Flexibility',
    type: 'Yoga',
    difficulty: 'Beginner',
    duration: 25,
    calories: 150,
    exercises: [
      { name: 'Downward Dog', sets: 1, reps: 1, duration: 300 },
      { name: 'Child\'s Pose', sets: 1, reps: 1, duration: 180 },
      { name: 'Warrior I', sets: 2, reps: 1, duration: 240 },
      { name: 'Tree Pose', sets: 2, reps: 1, duration: 180 },
    ],
    description: 'Gentle yoga flow to improve flexibility and relaxation',
    category: 'Flexibility',
    equipment: ['Yoga Mat'],
    targetMuscles: ['Full Body'],
    created: '2023-09-01',
    createdBy: 'Sarah Wilson',
    isActive: true,
    completions: 2156,
    averageRating: 4.9,
    aiGenerated: false,
  },
  {
    id: 4,
    name: 'Core Crusher Challenge',
    type: 'Core',
    difficulty: 'Intermediate',
    duration: 20,
    calories: 200,
    exercises: [
      { name: 'Plank', sets: 3, reps: 1, duration: 60 },
      { name: 'Russian Twists', sets: 3, reps: 20, duration: 45 },
      { name: 'Leg Raises', sets: 3, reps: 15, duration: 45 },
      { name: 'Dead Bug', sets: 3, reps: 10, duration: 60 },
    ],
    description: 'Intense core workout to build abdominal strength',
    category: 'Core',
    equipment: ['None'],
    targetMuscles: ['Core', 'Abs'],
    created: '2023-08-25',
    createdBy: 'Tom Brown',
    isActive: false,
    completions: 567,
    averageRating: 4.4,
    aiGenerated: true,
  },
];

const headCells = [
  { id: 'name', numeric: false, disablePadding: true, label: 'Workout Name' },
  { id: 'type', numeric: false, disablePadding: false, label: 'Type' },
  { id: 'difficulty', numeric: false, disablePadding: false, label: 'Difficulty' },
  { id: 'duration', numeric: true, disablePadding: false, label: 'Duration (min)' },
  { id: 'calories', numeric: true, disablePadding: false, label: 'Est. Calories' },
  { id: 'completions', numeric: true, disablePadding: false, label: 'Completions' },
  { id: 'averageRating', numeric: true, disablePadding: false, label: 'Rating' },
  { id: 'isActive', numeric: false, disablePadding: false, label: 'Status' },
  { id: 'actions', numeric: false, disablePadding: false, label: 'Actions' },
];

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function EnhancedTableHead({ onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort }) {
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function EnhancedTableToolbar({ numSelected, searchTerm, onSearchChange, filterType, onFilterTypeChange, filterDifficulty, onFilterDifficultyChange }) {
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) => theme.palette.action.selected,
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
          {numSelected} selected
        </Typography>
      ) : (
        <Box sx={{ flex: '1 1 100%', display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="h6" id="tableTitle" component="div">
            Workout Library
          </Typography>
          <TextField
            size="small"
            placeholder="Search workouts..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filterType}
              label="Type"
              onChange={(e) => onFilterTypeChange(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="HIIT">HIIT</MenuItem>
              <MenuItem value="Strength">Strength</MenuItem>
              <MenuItem value="Yoga">Yoga</MenuItem>
              <MenuItem value="Core">Core</MenuItem>
              <MenuItem value="Cardio">Cardio</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={filterDifficulty}
              label="Difficulty"
              onChange={(e) => onFilterDifficultyChange(e.target.value)}
            >
              <MenuItem value="">All Levels</MenuItem>
              <MenuItem value="Beginner">Beginner</MenuItem>
              <MenuItem value="Intermediate">Intermediate</MenuItem>
              <MenuItem value="Advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {numSelected > 0 ? (
        <Box display="flex" gap={1}>
          <Tooltip title="Activate/Deactivate">
            <IconButton>
              <PlayArrow />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplicate">
            <IconButton>
              <ContentCopy />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton>
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box display="flex" gap={1}>
          <Tooltip title="Export Workouts">
            <IconButton>
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import Workouts">
            <IconButton>
              <Upload />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filter list">
            <IconButton>
              <FilterList />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Toolbar>
  );
}

function WorkoutActionMenu({ workout, anchorEl, open, onClose, onEdit, onDuplicate, onToggleStatus, onDelete }) {
  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItemComponent onClick={() => { onEdit(workout); onClose(); }}>
        <Edit sx={{ mr: 1 }} fontSize="small" />
        Edit Workout
      </MenuItemComponent>
      <MenuItemComponent onClick={() => { onDuplicate(workout); onClose(); }}>
        <ContentCopy sx={{ mr: 1 }} fontSize="small" />
        Duplicate
      </MenuItemComponent>
      <MenuItemComponent onClick={() => { onToggleStatus(workout); onClose(); }}>
        {workout?.isActive ? <Stop sx={{ mr: 1 }} fontSize="small" /> : <PlayArrow sx={{ mr: 1 }} fontSize="small" />}
        {workout?.isActive ? 'Deactivate' : 'Activate'}
      </MenuItemComponent>
      <MenuItemComponent onClick={() => { onDelete(workout); onClose(); }} sx={{ color: 'error.main' }}>
        <Delete sx={{ mr: 1 }} fontSize="small" />
        Delete Workout
      </MenuItemComponent>
    </Menu>
  );
}

function WorkoutDetailsDialog({ workout, open, onClose }) {
  if (!workout) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{workout.name}</Typography>
          <Box display="flex" gap={1}>
            <Chip
              size="small"
              label={workout.type}
              color="primary"
            />
            <Chip
              size="small"
              label={workout.difficulty}
              color={
                workout.difficulty === 'Beginner' ? 'success' :
                workout.difficulty === 'Intermediate' ? 'warning' : 'error'
              }
            />
            {workout.aiGenerated && (
              <Chip size="small" label="AI Generated" color="secondary" />
            )}
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Workout Details
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Duration:</Typography>
                    <Typography variant="body2">{workout.duration} minutes</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Est. Calories:</Typography>
                    <Typography variant="body2">{workout.calories} kcal</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Category:</Typography>
                    <Typography variant="body2">{workout.category}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Completions:</Typography>
                    <Typography variant="body2">{workout.completions.toLocaleString()}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Rating:</Typography>
                    <Typography variant="body2">⭐ {workout.averageRating}/5</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Created:</Typography>
                    <Typography variant="body2">{workout.created}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Created By:</Typography>
                    <Typography variant="body2">{workout.createdBy}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Equipment & Targets
                </Typography>
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Equipment Needed:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {workout.equipment.map((item, index) => (
                      <Chip key={index} size="small" label={item} variant="outlined" />
                    ))}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Target Muscles:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {workout.targetMuscles.map((muscle, index) => (
                      <Chip key={index} size="small" label={muscle} variant="outlined" color="primary" />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {workout.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Exercise List
                </Typography>
                <List>
                  {workout.exercises.map((exercise, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={exercise.name}
                          secondary={
                            exercise.reps > 1
                              ? `${exercise.sets} sets × ${exercise.reps} reps`
                              : `${exercise.sets} sets × ${exercise.duration}s hold`
                          }
                        />
                      </ListItem>
                      {index < workout.exercises.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="outlined" startIcon={<ContentCopy />}>
          Duplicate
        </Button>
        <Button variant="contained" startIcon={<Edit />}>
          Edit Workout
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CreateWorkoutDialog({ open, onClose }) {
  const [workoutData, setWorkoutData] = useState({
    name: '',
    type: '',
    difficulty: 'Beginner',
    duration: 30,
    description: '',
    category: '',
    equipment: [],
    targetMuscles: [],
    exercises: [],
  });

  const handleSubmit = () => {
    // Handle workout creation
    console.log('Creating workout:', workoutData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Workout</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Workout Name"
              value={workoutData.name}
              onChange={(e) => setWorkoutData({ ...workoutData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Workout Type</InputLabel>
              <Select
                value={workoutData.type}
                label="Workout Type"
                onChange={(e) => setWorkoutData({ ...workoutData, type: e.target.value })}
              >
                <MenuItem value="HIIT">HIIT</MenuItem>
                <MenuItem value="Strength">Strength</MenuItem>
                <MenuItem value="Yoga">Yoga</MenuItem>
                <MenuItem value="Core">Core</MenuItem>
                <MenuItem value="Cardio">Cardio</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={workoutData.difficulty}
                label="Difficulty"
                onChange={(e) => setWorkoutData({ ...workoutData, difficulty: e.target.value })}
              >
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Intermediate">Intermediate</MenuItem>
                <MenuItem value="Advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography gutterBottom>Duration: {workoutData.duration} minutes</Typography>
              <Slider
                value={workoutData.duration}
                onChange={(e, value) => setWorkoutData({ ...workoutData, duration: value })}
                min={5}
                max={120}
                step={5}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={workoutData.description}
              onChange={(e) => setWorkoutData({ ...workoutData, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>AI Workout Generation</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="textSecondary" mb={2}>
                  Let our AI generate a workout based on your preferences
                </Typography>
                <Button variant="outlined" fullWidth>
                  Generate with AI
                </Button>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Create Workout
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function WorkoutManagement() {
  const [workouts, setWorkouts] = useState(mockWorkouts);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutDetailsOpen, setWorkoutDetailsOpen] = useState(false);
  const [createWorkoutOpen, setCreateWorkoutOpen] = useState(false);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredWorkouts.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleActionMenuOpen = (event, workout) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedWorkout(workout);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedWorkout(null);
  };

  const handleWorkoutDetails = (workout) => {
    setSelectedWorkout(workout);
    setWorkoutDetailsOpen(true);
  };

  const handleEditWorkout = (workout) => {
    console.log('Edit workout:', workout);
  };

  const handleDuplicateWorkout = (workout) => {
    console.log('Duplicate workout:', workout);
  };

  const handleToggleWorkoutStatus = (workout) => {
    setWorkouts(workouts.map(w => 
      w.id === workout.id ? { ...w, isActive: !w.isActive } : w
    ));
  };

  const handleDeleteWorkout = (workout) => {
    setWorkouts(workouts.filter(w => w.id !== workout.id));
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  // Filter workouts based on search term, type, and difficulty
  const filteredWorkouts = workouts.filter((workout) => {
    const matchesSearch = workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workout.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === '' || workout.type === filterType;
    const matchesDifficulty = filterDifficulty === '' || workout.difficulty === filterDifficulty;
    
    return matchesSearch && matchesType && matchesDifficulty;
  });

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredWorkouts.length) : 0;

  const visibleRows = React.useMemo(
    () => stableSort(filteredWorkouts, getComparator(order, orderBy)).slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    ),
    [order, orderBy, page, rowsPerPage, filteredWorkouts],
  );

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <EnhancedTableToolbar
          numSelected={selected.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          filterDifficulty={filterDifficulty}
          onFilterDifficultyChange={setFilterDifficulty}
        />
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={filteredWorkouts.length}
            />
            <TableBody>
              <AnimatePresence>
                {visibleRows.map((row, index) => {
                  const isItemSelected = isSelected(row.id);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <motion.tr
                      key={row.id}
                      component={TableRow}
                      hover
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      selected={isItemSelected}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          inputProps={{ 'aria-labelledby': labelId }}
                          onClick={(event) => handleClick(event, row.id)}
                        />
                      </TableCell>
                      <TableCell component="th" id={labelId} scope="row" padding="none">
                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight="medium"
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleWorkoutDetails(row)}
                          >
                            {row.name}
                          </Typography>
                          <Box display="flex" gap={0.5} mt={0.5}>
                            {row.aiGenerated && (
                              <Chip size="small" label="AI" color="secondary" sx={{ fontSize: '0.7rem', height: 20 }} />
                            )}
                            <Typography variant="caption" color="textSecondary">
                              by {row.createdBy}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.type}
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.difficulty}
                          color={
                            row.difficulty === 'Beginner' ? 'success' :
                            row.difficulty === 'Intermediate' ? 'warning' : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">{row.duration}</TableCell>
                      <TableCell align="right">{row.calories}</TableCell>
                      <TableCell align="right">{row.completions.toLocaleString()}</TableCell>
                      <TableCell align="right">⭐ {row.averageRating}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.isActive ? 'Active' : 'Inactive'}
                          color={row.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(event) => handleActionMenuOpen(event, row)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={9} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredWorkouts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Fab
        color="primary"
        aria-label="add workout"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateWorkoutOpen(true)}
      >
        <Add />
      </Fab>

      <WorkoutActionMenu
        workout={selectedWorkout}
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        onEdit={handleEditWorkout}
        onDuplicate={handleDuplicateWorkout}
        onToggleStatus={handleToggleWorkoutStatus}
        onDelete={handleDeleteWorkout}
      />

      <WorkoutDetailsDialog
        workout={selectedWorkout}
        open={workoutDetailsOpen}
        onClose={() => setWorkoutDetailsOpen(false)}
      />

      <CreateWorkoutDialog
        open={createWorkoutOpen}
        onClose={() => setCreateWorkoutOpen(false)}
      />
    </Box>
  );
}
