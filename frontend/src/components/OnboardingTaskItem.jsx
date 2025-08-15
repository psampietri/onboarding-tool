import React from 'react';
import {
    Box, Typography, Link, Tooltip, IconButton, FormControl, Select, MenuItem, Button, Chip, CircularProgress
} from '@mui/material';
import { TreeItem } from '@mui/x-tree-view';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import LinkOffIcon from '@mui/icons-material/LinkOff';

const OnboardingTaskItem = ({
    node, blockedTasks, taskLoading, handleStatusChange,
    handleOpenTicketModal, handleUnassignTicket, handleDryRun,
    handleExecuteTask, renderTree
}) => {
    const isBlocked = blockedTasks.has(node.id);
    const blockers = blockedTasks.get(node.id);

    const getStatusChipColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'in_progress': return 'warning';
            case 'blocked': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircleIcon color="success" />;
            case 'in_progress': return <AccessTimeIcon color="warning" />;
            case 'blocked': return <ErrorIcon color="error" />;
            default: return <HourglassEmptyIcon color="disabled" />;
        }
    };

    return (
        <TreeItem
            key={node.id}
            itemId={String(node.id)}
            label={
                <Box sx={{ display: 'flex', alignItems: 'center', p: 1, width: '100%', opacity: isBlocked ? 0.6 : 1 }}>
                    {/* Left Side: Info */}
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                        {getStatusIcon(node.status)}
                        <Box sx={{ ml: 1.5 }}>
                            <Typography>{node.name}</Typography>
                            {node.ticket_info?.key && (
                                <Typography variant="caption" color="text.secondary">
                                    Ticket: <Link href={node.ticket_info.self} target="_blank" rel="noopener noreferrer">{node.ticket_info.key}</Link>
                                </Typography>
                            )}
                        </Box>
                        {node.instructions && (
                            <Tooltip title={node.instructions}>
                                <IconButton size="small" sx={{ ml: 1 }}><InfoOutlinedIcon fontSize="small" /></IconButton>
                            </Tooltip>
                        )}
                    </Box>

                    {/* Right Side: Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 120 }} disabled={isBlocked}>
                            <Select
                                value={node.status}
                                onChange={(e) => handleStatusChange(node.id, e.target.value)}
                                renderValue={(selected) => (
                                    <Chip label={selected} color={getStatusChipColor(selected)} size="small" />
                                )}
                            >
                                <MenuItem value="not_started">Not Started</MenuItem>
                                <MenuItem value="in_progress">In Progress</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="blocked">Blocked</MenuItem>
                            </Select>
                        </FormControl>

                        {isBlocked && (
                            <Tooltip title={`Blocked by: ${blockers.join(', ')}`}>
                                <IconButton><LockIcon /></IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="View/Edit Ticket">
                            <IconButton onClick={() => handleOpenTicketModal(node)}><ConfirmationNumberIcon /></IconButton>
                        </Tooltip>
                        {node.ticket_info?.key && (
                            <Tooltip title="Unassign Ticket">
                                <IconButton onClick={() => handleUnassignTicket(node.id)}><LinkOffIcon /></IconButton>
                            </Tooltip>
                        )}
                        {node.task_type === 'automated_access_request' && node.status === 'not_started' && !isBlocked && (
                            <>
                                <Button variant="outlined" size="small" onClick={() => handleDryRun(node.id)} disabled={taskLoading === node.id}>Dry Run</Button>
                                <Button variant="contained" size="small" onClick={() => handleExecuteTask(node.id)} disabled={taskLoading === node.id}>
                                    {taskLoading === node.id ? <CircularProgress size={20} /> : 'Run'}
                                </Button>
                            </>
                        )}
                    </Box>
                </Box>
            }
        >
            {Array.isArray(node.children) && node.children.length > 0
                ? renderTree(node.children)
                : null}
        </TreeItem>
    );
};

export default OnboardingTaskItem;