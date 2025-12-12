// modelscript.js - Help Button Functionality (New Tab Version)
console.log('✅ modelscript.js loaded - New Tab Version');

// Function to open user guide in new tab
function openHelp() {
    console.log('Opening user guide in new tab...');
    // Open user guide in a new browser tab/window
    const guideUrl = 'https://devsupport.co.in/interview/userguide.html';
    window.open(guideUrl, '_blank', 'noopener,noreferrer');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing help button...');
    
    // Get help button
    const helpBtn = document.getElementById('helpBtn');
    
    // Check if button exists
    if (!helpBtn) {
        console.error('❌ Help button not found!');
        return;
    }
    
    // Add event listener to help button
    helpBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openHelp();
    });
    
    // Optional: Add keyboard shortcut (F1)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F1') {
            e.preventDefault();
            openHelp();
        }
    });
    
    console.log('✅ Help button initialized - will open in new tab');
});

// Make function available globally
window.openHelp = openHelp;