// Background script for Research Assistant extension

// Extension installation handler
chrome.runtime.onInstalled.addListener(() => {
  console.log('Research Assistant extension installed!');
  
  // Set default preferences
  chrome.storage.local.set({
    'enableSuggestions': true,
    'showNotifications': true,
    'autoAnalyze': false,
    'recentPapers': true,
    'highCitations': true,
    'papersAnalyzed': 0,
    'suggestionsMade': 0,
    'papersSaved': 0
  });
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyze') {
    // Forward analyze request to content script
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'analyze'});
    });
    sendResponse({status: 'ok'});
  }
  
  if (request.action === 'searchPapers') {
    // Handle API calls in background script
    searchPapersAPI(request.keywords)
      .then(results => sendResponse({status: 'success', papers: results}))
      .catch(error => sendResponse({status: 'error', error: error.message}));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'updateStats') {
    // Update extension stats
    chrome.storage.local.get(['papersAnalyzed', 'suggestionsMade', 'papersSaved'], (result) => {
      const updates = {};
      if (request.papersAnalyzed) updates.papersAnalyzed = (result.papersAnalyzed || 0) + 1;
      if (request.suggestionsMade) updates.suggestionsMade = (result.suggestionsMade || 0) + request.suggestionsMade;
      if (request.papersSaved) updates.papersSaved = (result.papersSaved || 0) + 1;
      
      chrome.storage.local.set(updates);
    });
    sendResponse({status: 'updated'});
  }
  
  return true; // Keep message channel open for async response
});

// API functions in background script
async function searchPapersAPI(keywords) {
  try {
    const results = [];
    
    // Search arXiv - return raw data for content script to parse
    const arxivResult = await searchArxiv(keywords);
    if (arxivResult.success) {
      results.push({
        type: 'arxiv',
        data: arxivResult.xmlText,
        keywords: keywords
      });
    }
    
    // For demo, return the raw data to be parsed in content script
    return results;
    
  } catch (error) {
    console.error('API search failed:', error);
    return [];
  }
}

async function searchArxiv(keywords) {
  const query = keywords.slice(0, 5).join(' OR ');
  const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=10&sortBy=relevance&sortOrder=descending`;
  
  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    // Return raw XML text - parsing will happen in content script
    return { success: true, xmlText, keywords };
  } catch (error) {
    console.error('ArXiv fetch failed:', error);
    return { success: false, error: error.message };
  }
}

// Remove XML parsing functions - will be handled in content script

function calculateRelevance(text, keywords) {
  const lowerText = text.toLowerCase();
  let score = 0;
  let totalKeywords = keywords.length;
  
  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    const matches = (lowerText.match(new RegExp(keywordLower, 'g')) || []).length;
    score += matches * (1 / totalKeywords);
  });
  
  return Math.min(score / 5, 1);
}

function isBiomedical(keywords) {
  const bioKeywords = ['protein', 'gene', 'dna', 'medical', 'clinical', 'patient', 'therapy', 'drug', 'disease', 'health', 'biology', 'cellular', 'molecular'];
  return keywords.some(k => bioKeywords.some(bio => k.toLowerCase().includes(bio)));
}

function getMockSuggestions() {
  return [
    {
      title: "Fallback Research Paper",
      authors: "Demo Team",
      year: "2024",
      citations: 42,
      relevance: 0.75,
      abstract: "This is a fallback paper when APIs are unavailable...",
      url: "#",
      source: "Demo"
    }
  ];
}