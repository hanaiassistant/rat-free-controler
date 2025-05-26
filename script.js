document.addEventListener('DOMContentLoaded', function() {
    const permissionRequest = document.getElementById('permission-request');
    const connectedStatus = document.getElementById('connected-status');
    const allowBtn = document.getElementById('allow-btn');
    const denyBtn = document.getElementById('deny-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const activePermissions = document.getElementById('active-permissions');
    const connectionTime = document.getElementById('connection-time');
    
    // Simulate connection request after delay
    setTimeout(() => {
        permissionRequest.classList.remove('hidden');
        permissionRequest.classList.add('fade-in');
    }, 2000);
    
    // Handle allow button
    allowBtn.addEventListener('click', function() {
        permissionRequest.classList.add('hidden');
        
        // Add active permissions
        activePermissions.innerHTML = `
            <div class="permission-item active">📷 Camera Access</div>
            <div class="permission-item active">📁 File Access</div>
            <div class="permission-item active">💬 SMS Access</div>
            <div class="permission-item active">🔦 Flashlight Control</div>
        `;
        
        // Update connection time
        const now = new Date();
        connectionTime.textContent = now.toLocaleTimeString();
        
        connectedStatus.classList.remove('hidden');
        connectedStatus.classList.add('fade-in');
    });
    
    // Handle deny button
    denyBtn.addEventListener('click', function() {
        permissionRequest.classList.add('hidden');
        document.querySelector('.connection-status span').textContent = 'Connection denied';
    });
    
    // Handle disconnect button
    disconnectBtn.addEventListener('click', function() {
        connectedStatus.classList.add('hidden');
        document.querySelector('.connection-status span').textContent = 'Disconnected';
        
        // After disconnect, simulate new connection request after some time
        setTimeout(() => {
            permissionRequest.classList.remove('hidden');
            permissionRequest.classList.add('fade-in');
        }, 3000);
    });
    
    // Simulate active connection features
    if (connectedStatus.classList.contains('hidden') === false) {
        setInterval(() => {
            const random = Math.random();
            if (random > 0.7) {
                const items = activePermissions.querySelectorAll('.permission-item');
                const randomItem = items[Math.floor(Math.random() * items.length)];
                
                randomItem.style.color = '#00ff00';
                randomItem.style.textShadow = '0 0 5px #00ff00';
                
                setTimeout(() => {
                    randomItem.style.color = '';
                    randomItem.style.textShadow = '';
                }, 500);
            }
        }, 2000);
    }
});