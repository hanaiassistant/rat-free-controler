document.addEventListener('DOMContentLoaded', function() {
    // WebSocket connection
    let ws;
    const targetId = 'target-' + Math.random().toString(36).substr(2, 8);
    let currentController = null;
    let activePermissions = [];
    let currentRequestId = 0;
    let cameraStream = null;

    // DOM elements
    const connectionStatus = document.getElementById('connection-status');
    const targetIdSpan = document.getElementById('target-id');
    const permissionRequest = document.getElementById('permission-request');
    const connectedStatus = document.getElementById('connected-status');
    const controllerIdSpan = document.getElementById('controller-id');
    const activeControllerIdSpan = document.getElementById('active-controller-id');
    const connectionTimeSpan = document.getElementById('connection-time');
    const requestedPermissions = document.getElementById('requested-permissions');
    const activePermissionsList = document.getElementById('active-permissions');
    const allowBtn = document.getElementById('allow-btn');
    const denyBtn = document.getElementById('deny-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const cameraPreview = document.getElementById('camera-preview');
    const stopCameraBtn = document.getElementById('stop-camera-btn');

    // Connect to WebSocket server
    function connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        ws = new WebSocket(`${protocol}//${host}/?type=target&id=${targetId}`);

        ws.onopen = () => {
            updateConnectionStatus('connected');
            targetIdSpan.textContent = targetId;
        };

        ws.onclose = () => {
            updateConnectionStatus('disconnected');
            // Try to reconnect after 5 seconds
            setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleMessage(data);
            } catch (err) {
                console.error('Error parsing message:', err);
            }
        };
    }

    // Handle incoming messages
    function handleMessage(data) {
        switch (data.type) {
            case 'controller-status':
                updateControllerStatus(data.controllerId, data.status);
                break;
                
            case 'command':
                handleCommand(data);
                break;
        }
    }

    // Update controller status
    function updateControllerStatus(controllerId, status) {
        if (status === 'connected') {
            // Do nothing, wait for actual connection request
        } else if (status === 'disconnected' && currentController === controllerId) {
            // Controller disconnected
            currentController = null;
            activePermissions = [];
            updateActivePermissions();
            connectedStatus.classList.add('hidden');
            connectionStatus.classList.remove('hidden');
            stopCamera();
        }
    }

    // Handle commands from controller
    function handleCommand(data) {
        // If we don't have an active controller, this is a new connection request
        if (!currentController) {
            showPermissionRequest(data);
            return;
        }
        
        // Check if we have permission for this command
        const permission = getPermissionForCommand(data.command);
        if (!activePermissions.includes(permission)) {
            sendResponse(data, { error: 'Permission denied' });
            return;
        }
        
        // Execute the command
        switch (data.command) {
            case 'camera':
                handleCameraCommand(data);
                break;
                
            case 'files':
                handleFilesCommand(data);
                break;
                
            case 'sms':
                handleSMSCommand(data);
                break;
                
            case 'flashlight':
                handleFlashlightCommand(data);
                break;
                
            default:
                sendResponse(data, { error: 'Unknown command' });
        }
    }

    // Show permission request
    function showPermissionRequest(data) {
        currentController = data.controllerId;
        controllerIdSpan.textContent = data.controllerId;
        
        // Determine required permissions
        const permission = getPermissionForCommand(data.command);
        const permissions = [permission];
        
        requestedPermissions.innerHTML = permissions.map(perm => 
            `<div class="permission-item">${getPermissionIcon(perm)} ${formatPermission(perm)}</div>`
        ).join('');
        
        permissionRequest.classList.remove('hidden');
        connectionStatus.classList.add('hidden');
    }

    // Handle camera command
    function handleCameraCommand(data) {
        if (data.args.action === 'toggle') {
            // Simulate camera access
            cameraPreview.classList.remove('hidden');
            cameraPreview.querySelector('.camera-feed').textContent = 'CAMERA FEED ACTIVE';
            
            sendResponse(data, { 
                status: 'active',
                message: 'Camera feed activated'
            });
        }
    }

    // Handle files command
    function handleFilesCommand(data) {
        // Simulate file listing
        const files = [
            { name: 'Documents', isDir: true },
            { name: 'Pictures', isDir: true },
            { name: 'notes.txt', isDir: false },
            { name: 'config.json', isDir: false }
        ];
        
        sendResponse(data, {
            files: files,
            path: data.args.path || '/'
        });
    }

    // Handle SMS command
    function handleSMSCommand(data) {
        // Simulate SMS listing
        const messages = [
            { sender: 'Mom', text: 'Call me when you get home' },
            { sender: 'John', text: 'Meeting at 3pm tomorrow' },
            { sender: 'Bank', text: 'Your payment is due soon' }
        ];
        
        sendResponse(data, {
            messages: messages
        });
    }

    // Handle flashlight command
    function handleFlashlightCommand(data) {
        // Simulate flashlight toggle
        const newStatus = Math.random() > 0.5 ? 'on' : 'off';
        
        sendResponse(data, {
            status: newStatus,
            message: `Flashlight turned ${newStatus}`
        });
    }

    // Stop camera
    function stopCamera() {
        cameraPreview.classList.add('hidden');
    }

    // Send response to controller
    function sendResponse(originalData, response) {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        
        ws.send(JSON.stringify({
            type: 'response',
            controllerId: originalData.controllerId,
            command: originalData.command,
            args: originalData.args,
            response: response,
            requestId: originalData.requestId
        }));
    }

    // Request permission from user
    function requestPermission(controllerId, command, args) {
        currentRequestId++;
        const permission = getPermissionForCommand(command);
        
        return new Promise((resolve) => {
            // In a real app, this would show a UI prompt to the user
            // For demo, we'll auto-approve after a short delay
            setTimeout(() => {
                const granted = true; // Change to false to simulate denial
                
                if (granted) {
                    activePermissions.push(permission);
                    updateActivePermissions();
                }
                
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'permission-response',
                        controllerId: controllerId,
                        granted: granted,
                        permissions: [permission],
                        requestId: currentRequestId
                    }));
                }
                
                resolve(granted);
            }, 1000);
        });
    }

    // Update active permissions display
    function updateActivePermissions() {
        activePermissionsList.innerHTML = activePermissions.map(perm => 
            `<div class="permission-item active">${getPermissionIcon(perm)} ${formatPermission(perm)}</div>`
        ).join('');
    }

    // Helper functions
    function updateConnectionStatus(status) {
        const statusText = connectionStatus.querySelector('span');
        const pulse = connectionStatus.querySelector('.status-pulse');
        
        statusText.textContent = status === 'connected' ? 'Connected to server' : 'Disconnected from server';
        
        if (status === 'connected') {
            pulse.style.borderColor = '#00ff00';
            pulse::before {
                background: rgba(0, 255, 0, 0.4);
            }
        } else {
            pulse.style.borderColor = '#ff0000';
            pulse::before {
                background: rgba(255, 0, 0, 0.4);
            }
        }
    }

    function getPermissionForCommand(command) {
        const permissions = {
            'camera': 'camera',
            'files': 'files',
            'sms': 'sms',
            'flashlight': 'flashlight',
            'location': 'location'
        };
        return permissions[command] || 'unknown';
    }

    function getPermissionIcon(permission) {
        const icons = {
            'camera': '📷',
            'files': '📁',
            'sms': '💬',
            'flashlight': '🔦',
            'location': '📍'
        };
        return icons[permission] || '⚠️';
    }

    function formatPermission(permission) {
        const names = {
            'camera': 'Camera Access',
            'files': 'File Access',
            'sms': 'SMS Access',
            'flashlight': 'Flashlight Control',
            'location': 'Location Access'
        };
        return names[permission] || permission;
    }

    // Event listeners
    allowBtn.addEventListener('click', () => {
        // Grant permission
        const permissions = Array.from(requestedPermissions.querySelectorAll('.permission-item'))
            .map(item => item.textContent.trim().split(' ')[1].toLowerCase());
        
        activePermissions = [...new Set([...activePermissions, ...permissions])];
        updateActivePermissions();
        
        // Update UI
        permissionRequest.classList.add('hidden');
        connectedStatus.classList.remove('hidden');
        activeControllerIdSpan.textContent = currentController;
        connectionTimeSpan.textContent = new Date().toLocaleTimeString();
        
        // Send permission response
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'permission-response',
                controllerId: currentController,
                granted: true,
                permissions: permissions,
                requestId: currentRequestId
            }));
        }
    });

    denyBtn.addEventListener('click', () => {
        // Deny permission
        permissionRequest.classList.add('hidden');
        connectionStatus.classList.remove('hidden');
        
        // Send permission response
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'permission-response',
                controllerId: currentController,
                granted: false,
                permissions: [],
                requestId: currentRequestId
            }));
        }
        
        currentController = null;
    });

    disconnectBtn.addEventListener('click', () => {
        // Disconnect from current controller
        currentController = null;
        activePermissions = [];
        updateActivePermissions();
        connectedStatus.classList.add('hidden');
        connectionStatus.classList.remove('hidden');
        stopCamera();
    });

    stopCameraBtn.addEventListener('click', () => {
        stopCamera();
    });

    // Initialize
    connectWebSocket();
    targetIdSpan.textContent = 'connecting...';
});
