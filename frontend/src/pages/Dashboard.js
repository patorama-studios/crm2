import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          Welcome, {user?.name}!
        </Typography>
        <Button variant="outlined" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
      
      <Typography variant="h6" color="textSecondary" gutterBottom>
        Role: {user?.role?.replace('_', ' ').toUpperCase()}
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3">0</Typography>
            <Typography variant="body1">Active Jobs</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3">0</Typography>
            <Typography variant="body1">Customers</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3">0</Typography>
            <Typography variant="body1">Pending Uploads</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3">0</Typography>
            <Typography variant="body1">Unpaid Invoices</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={2}>
          <Grid item>
            <Button variant="contained" onClick={() => navigate('/jobs')}>
              View Jobs
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={() => navigate('/customers')}>
              View Customers
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Dashboard;