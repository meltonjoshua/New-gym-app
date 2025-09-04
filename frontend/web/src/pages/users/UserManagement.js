import React, { useState } from 'react';
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
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Fab,
  Menu,
  MenuItem as MenuItemComponent,
} from '@mui/material';
import {
  Search,
  FilterList,
  PersonAdd,
  Edit,
  Delete,
  MoreVert,
  Block,
  CheckCircle,
  Email,
  Phone,
  LocationOn,
  FitnessCenter,
  Download,
  Upload,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Mock user data
const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    avatar: null,
    status: 'active',
    role: 'user',
    joinDate: '2023-06-15',
    lastActive: '2023-09-10',
    workoutsCompleted: 142,
    totalCalories: 28400,
    averageFormScore: 0.87,
    subscription: 'premium',
    location: 'New York, NY',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 234-5678',
    avatar: null,
    status: 'active',
    role: 'trainer',
    joinDate: '2023-03-22',
    lastActive: '2023-09-10',
    workoutsCompleted: 298,
    totalCalories: 59600,
    averageFormScore: 0.94,
    subscription: 'premium',
    location: 'Los Angeles, CA',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    phone: '+1 (555) 345-6789',
    avatar: null,
    status: 'inactive',
    role: 'user',
    joinDate: '2023-08-01',
    lastActive: '2023-08-15',
    workoutsCompleted: 12,
    totalCalories: 2400,
    averageFormScore: 0.72,
    subscription: 'free',
    location: 'Chicago, IL',
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    phone: '+1 (555) 456-7890',
    avatar: null,
    status: 'active',
    role: 'user',
    joinDate: '2023-07-10',
    lastActive: '2023-09-09',
    workoutsCompleted: 89,
    totalCalories: 17800,
    averageFormScore: 0.81,
    subscription: 'premium',
    location: 'Austin, TX',
  },
  {
    id: 5,
    name: 'Tom Brown',
    email: 'tom.brown@example.com',
    phone: '+1 (555) 567-8901',
    avatar: null,
    status: 'suspended',
    role: 'user',
    joinDate: '2023-05-05',
    lastActive: '2023-08-20',
    workoutsCompleted: 67,
    totalCalories: 13400,
    averageFormScore: 0.65,
    subscription: 'free',
    location: 'Miami, FL',
  },
];

const headCells = [
  { id: 'name', numeric: false, disablePadding: true, label: 'User' },
  { id: 'email', numeric: false, disablePadding: false, label: 'Email' },
  { id: 'role', numeric: false, disablePadding: false, label: 'Role' },
  { id: 'status', numeric: false, disablePadding: false, label: 'Status' },
  { id: 'workoutsCompleted', numeric: true, disablePadding: false, label: 'Workouts' },
  { id: 'averageFormScore', numeric: true, disablePadding: false, label: 'Form Score' },
  { id: 'subscription', numeric: false, disablePadding: false, label: 'Subscription' },
  { id: 'joinDate', numeric: false, disablePadding: false, label: 'Join Date' },
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

function EnhancedTableToolbar({ numSelected, searchTerm, onSearchChange, filterRole, onFilterRoleChange, filterStatus, onFilterStatusChange }) {
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
            User Management
          </Typography>
          <TextField
            size="small"
            placeholder="Search users..."
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
            <InputLabel>Role</InputLabel>
            <Select
              value={filterRole}
              label="Role"
              onChange={(e) => onFilterRoleChange(e.target.value)}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="trainer">Trainer</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => onFilterStatusChange(e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {numSelected > 0 ? (
        <Box display="flex" gap={1}>
          <Tooltip title="Send Email">
            <IconButton>
              <Email />
            </IconButton>
          </Tooltip>
          <Tooltip title="Suspend Users">
            <IconButton>
              <Block />
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
          <Tooltip title="Export Users">
            <IconButton>
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import Users">
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

function UserActionMenu({ user, anchorEl, open, onClose }) {
  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItemComponent onClick={onClose}>
        <Edit sx={{ mr: 1 }} fontSize="small" />
        Edit User
      </MenuItemComponent>
      <MenuItemComponent onClick={onClose}>
        <Email sx={{ mr: 1 }} fontSize="small" />
        Send Email
      </MenuItemComponent>
      <MenuItemComponent onClick={onClose}>
        <FitnessCenter sx={{ mr: 1 }} fontSize="small" />
        View Workouts
      </MenuItemComponent>
      <MenuItemComponent onClick={onClose} sx={{ color: user?.status === 'suspended' ? 'success.main' : 'warning.main' }}>
        {user?.status === 'suspended' ? <CheckCircle sx={{ mr: 1 }} fontSize="small" /> : <Block sx={{ mr: 1 }} fontSize="small" />}
        {user?.status === 'suspended' ? 'Reactivate' : 'Suspend'} User
      </MenuItemComponent>
      <MenuItemComponent onClick={onClose} sx={{ color: 'error.main' }}>
        <Delete sx={{ mr: 1 }} fontSize="small" />
        Delete User
      </MenuItemComponent>
    </Menu>
  );
}

function UserDetailsDialog({ user, open, onClose }) {
  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ width: 60, height: 60 }}>
            {user.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">{user.name}</Typography>
            <Typography color="textSecondary" variant="body2">
              {user.email}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Email fontSize="small" />
                    <Typography variant="body2">{user.email}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Phone fontSize="small" />
                    <Typography variant="body2">{user.phone}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOn fontSize="small" />
                    <Typography variant="body2">{user.location}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Account Details
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Role:</Typography>
                    <Chip size="small" label={user.role} />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Status:</Typography>
                    <Chip
                      size="small"
                      label={user.status}
                      color={
                        user.status === 'active' ? 'success' :
                        user.status === 'suspended' ? 'error' : 'default'
                      }
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Subscription:</Typography>
                    <Chip
                      size="small"
                      label={user.subscription}
                      color={user.subscription === 'premium' ? 'primary' : 'default'}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Join Date:</Typography>
                    <Typography variant="body2">{user.joinDate}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Last Active:</Typography>
                    <Typography variant="body2">{user.lastActive}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fitness Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {user.workoutsCompleted}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Workouts Completed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {user.totalCalories.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Calories Burned
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {Math.round(user.averageFormScore * 100)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Average Form Score
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<Edit />}>
          Edit User
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function UserManagement() {
  const [users] = useState(mockUsers); // setUsers will be used for CRUD operations
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredUsers.map((n) => n.id);
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

  const handleActionMenuOpen = (event, user) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedUser(null);
  };

  const handleUserDetails = (user) => {
    setSelectedUser(user);
    setUserDetailsOpen(true);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  // Filter users based on search term, role, and status
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === '' || user.role === filterRole;
    const matchesStatus = filterStatus === '' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredUsers.length) : 0;

  const visibleRows = React.useMemo(
    () => stableSort(filteredUsers, getComparator(order, orderBy)).slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    ),
    [order, orderBy, page, rowsPerPage, filteredUsers],
  );

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <EnhancedTableToolbar
          numSelected={selected.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterRole={filterRole}
          onFilterRoleChange={setFilterRole}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
        />
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={filteredUsers.length}
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
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ width: 40, height: 40 }}>
                            {row.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight="medium"
                              sx={{ cursor: 'pointer' }}
                              onClick={() => handleUserDetails(row)}
                            >
                              {row.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              ID: {row.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.role}
                          color={row.role === 'trainer' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.status}
                          color={
                            row.status === 'active' ? 'success' :
                            row.status === 'suspended' ? 'error' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">{row.workoutsCompleted}</TableCell>
                      <TableCell align="right">{Math.round(row.averageFormScore * 100)}%</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.subscription}
                          color={row.subscription === 'premium' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{row.joinDate}</TableCell>
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
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Fab
        color="primary"
        aria-label="add user"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        <PersonAdd />
      </Fab>

      <UserActionMenu
        user={selectedUser}
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      />

      <UserDetailsDialog
        user={selectedUser}
        open={userDetailsOpen}
        onClose={() => setUserDetailsOpen(false)}
      />
    </Box>
  );
}
