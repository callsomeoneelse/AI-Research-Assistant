// Popup script for Research Assistant extension

document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup loaded');
    
    // Load saved settings and stats
    chrome.storage.local.get([
        'enableSuggestions', 
        'showNotifications', 
        'autoAnalyze', 
        'recentPapers', 
        'highCitations',
        'papersAnalyzed',
        'suggestionsMade', 
        'papersSaved'
    ], function(result) {
        console.log('Loaded settings:', result);
        
        // Set toggle states
        const toggles = {
            'enableSuggestions': result.enableSuggestions !== false,
            'showNotifications': result.showNotifications !== false,
            'autoAnalyze': result.autoAnalyze === true,
            'recentPapers': result.recentPapers !== false,
            'highCitations': result.highCitations !== false
        };
        
        Object.keys(toggles).forEach(id => {
            const toggle = document.getElementById(id);
            if (toggle && toggles[id]) {
                toggle.classList.add('active');
            }
        });
        
        // Update stats display
        if (document.getElementById('papersAnalyzed')) {
            document.getElementById('papersAnalyzed').textContent = result.papersAnalyzed || 0;
        }
        if (document.getElementById('suggestionsMade')) {
            document.getElementById('suggestionsMade').textContent = result.suggestionsMade || 0;
        }
        if (document.getElementById('papersSaved')) {
            document.getElementById('papersSaved').textContent = result.papersSaved || 0;
        }
    });
    
    // Toggle switches
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', function() {
            this.classList.toggle('active');
            
            // Save setting
            const setting = {};
            setting[this.id] = this.classList.contains('active');
            chrome.storage.local.set(setting, function() {
                console.log('Setting saved:', setting);
            });
        });
    });
    
    // Button handlers
    const analyzeBtn = document.getElementById('analyzeNow');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', function() {
            console.log('Analyze button clicked');
            // Send message to content script to analyze current page
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: 'analyze'}, function(response) {
                        if (chrome.runtime.lastError) {
                            console.log('Content script not ready or page not supported');
                        }
                    });
                }
            });
            window.close();
        });
    }
    
    const savedBtn = document.getElementById('viewSaved');
    if (savedBtn) {
        savedBtn.addEventListener('click', function() {
            alert('Saved papers feature - would open saved papers page');
            window.close();
        });
    }
    
    const settingsBtn = document.getElementById('settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            alert('Settings feature - would open detailed settings page');
            window.close();
        });
    }
});