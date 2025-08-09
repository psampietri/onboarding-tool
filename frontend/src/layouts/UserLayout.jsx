import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';

const UserLayout = () => {
    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed">
                <Toolbar>
                    <Typography variant="h6" noWrap component="div">
                        Onboarding Portal
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box component="main" sx={{ flexGrow: 1, p: 3, marginTop: '64px' }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default UserLayout;
