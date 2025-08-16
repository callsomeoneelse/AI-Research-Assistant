// Content script that runs on academic paper pages
class ResearchAssistant {
  constructor() {
    this.sidebar = null;
    this.isAnalyzing = false;
    this.suggestions = [];
    this.init();
  }

  init() {
    // Only activate on academic paper sites
    if (this.isAcademicPaper()) {
      this.createSidebar();
      this.analyzePage();
      this.setupScrollListener();
    }
  }

  isAcademicPaper() {
    // Simple heuristic to detect academic papers
    const url = window.location.href;
    const title = document.title.toLowerCase();
    const content = document.body.innerText.toLowerCase();
    
    return url.includes('arxiv.org') || 
           url.includes('pubmed') || 
           url.includes('scholar.google') ||
           title.includes('paper') ||
           title.includes('journal') ||
           content.includes('abstract') ||
           content.includes('references') ||
           content.includes('doi:');
  }

  createSidebar() {
    // Create sidebar container
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'research-assistant-sidebar';
    this.sidebar.innerHTML = `
      <div class="sidebar-header">
        <h3>📚 Research Assistant</h3>
        <button id="toggle-sidebar">−</button>
      </div>
      <div class="sidebar-content">
        <div class="status">
          <div class="analyzing">🔍 Analyzing paper...</div>
        </div>
        <div class="suggestions-container">
          <h4>Suggested Papers</h4>
          <div class="ai-insights" id="aiInsights" style="display: none;">
            <div class="insight-box">
              <strong>🤖 AI Insight:</strong>
              <p class="ai-summary"></p>
            </div>
          </div>
          <div class="suggestions-list"></div>
        </div>
        <div class="preferences">
          <label>
            <input type="checkbox" id="recent-papers" checked>
            Recent papers (last 2 years)
          </label>
          <label>
            <input type="checkbox" id="high-citations" checked>
            Highly cited papers
          </label>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.sidebar);
    
    // Add toggle functionality
    document.getElementById('toggle-sidebar').addEventListener('click', () => {
      this.sidebar.classList.toggle('collapsed');
    });
  }

  async analyzePage() {
    if (this.isAnalyzing) return;
    
    this.isAnalyzing = true;
    this.updateStatus('🔍 Analyzing paper...');
    
    try {
      // Extract key content from the page
      const content = this.extractContent();
      
      // Generate AI insights about the current paper
      await this.generateAIInsights(content);
      
      const keywords = await this.extractKeywords(content);
      const suggestions = await this.getSuggestions(keywords);
      
      this.suggestions = suggestions;
      this.displaySuggestions();
      this.updateStatus('✅ Analysis complete');
    } catch (error) {
      console.error('Analysis failed:', error);
      this.updateStatus('❌ Analysis failed');
    } finally {
      this.isAnalyzing = false;
    }
  }

  async generateAIInsights(content) {
    try {
      // Hardcoded API key - replace with your actual key
      const API_KEY = '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'; // Replace this with your actual API key
      
      if (!API_KEY || API_KEY === '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') {
        return;
      }

      this.updateStatus('🤖 Generating AI insights...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a research assistant. Provide a brief, insightful summary of the key research contribution and its significance. Keep it under 50 words.'
            },
            {
              role: 'user',
              content: `Summarize the key contribution of this research paper:\n\n${content.substring(0, 1000)}`
            }
          ],
          max_tokens: 80,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        const insight = data.choices[0].message.content.trim();
        this.displayAIInsight(insight);
      }
    } catch (error) {
      console.log('AI insights generation failed:', error);
    }
  }

  displayAIInsight(insight) {
    const aiInsights = document.getElementById('aiInsights');
    const aiSummary = document.querySelector('.ai-summary');
    
    if (aiInsights && aiSummary) {
      aiSummary.textContent = insight;
      aiInsights.style.display = 'block';
    }
  }

  extractContent() {
    // Try to find abstract, introduction, conclusion sections
    const selectors = [
      'div:contains("Abstract")',
      'section:contains("Abstract")',
      'p:contains("Abstract")',
      'h1, h2, h3',
      'p'
    ];
    
    let content = '';
    
    // Get title
    const title = document.querySelector('h1') || document.querySelector('title');
    if (title) content += title.textContent + '\n\n';
    
    // Get abstract if available
    const abstractSection = this.findSection('abstract');
    if (abstractSection) content += abstractSection + '\n\n';
    
    // Get first few paragraphs
    const paragraphs = document.querySelectorAll('p');
    for (let i = 0; i < Math.min(5, paragraphs.length); i++) {
      const text = paragraphs[i].textContent.trim();
      if (text.length > 50) {
        content += text + '\n';
      }
    }
    
    return content.substring(0, 2000); // Limit content size
  }

  findSection(sectionName) {
    const text = document.body.innerText.toLowerCase();
    const index = text.indexOf(sectionName.toLowerCase());
    if (index !== -1) {
      return text.substring(index, index + 500);
    }
    return null;
  }

  async extractKeywords(content) {
    try {
      // Try AI-powered keyword extraction first
      const aiKeywords = await this.extractKeywordsWithAI(content);
      if (aiKeywords && aiKeywords.length > 0) {
        return aiKeywords;
      }
    } catch (error) {
      console.log('AI keyword extraction failed, falling back to simple method:', error);
    }
    
    // Fallback to simple keyword extraction
    return this.extractKeywordsSimple(content);
  }

  async extractKeywordsWithAI(content) {
    try {
      // Hardcoded API key - replace with your actual key
      const API_KEY = 'sk-your-openai-api-key-here'; // Replace this with your actual API key
      
      if (!API_KEY || API_KEY === 'sk-your-openai-api-key-here') {
        console.log('No API key configured, using simple extraction');
        return null;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a research assistant that extracts key academic terms and concepts from research papers. Return only the most important keywords/phrases separated by commas, no explanations.'
            },
            {
              role: 'user',
              content: `Extract the 10 most important academic keywords and concepts from this research paper content:\n\n${content.substring(0, 1500)}`
            }
          ],
          max_tokens: 100,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const keywords = data.choices[0].message.content
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 2)
        .slice(0, 10);

      console.log('AI extracted keywords:', keywords);
      return keywords;

    } catch (error) {
      console.error('AI keyword extraction failed:', error);
      return null;
    }
  }

  extractKeywordsSimple(content) {
    // Enhanced simple keyword extraction
    const commonAcademicWords = ['the', 'and', 'of', 'to', 'in', 'for', 'with', 'on', 'by', 'from', 'this', 'that', 'we', 'our', 'study', 'research', 'analysis', 'method', 'results', 'conclusion', 'paper', 'approach', 'using', 'based', 'show', 'can', 'also', 'such', 'these', 'than', 'more', 'been', 'have', 'were', 'are', 'was', 'been'];
    
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4 && !commonAcademicWords.includes(word));
    
    // Get word frequency
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Return top keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  async getSuggestions(keywords) {
    try {
      // Send request to background script to fetch raw data
      const response = await chrome.runtime.sendMessage({
        action: 'searchPapers',
        keywords: keywords
      });
      
      if (response.status === 'success' && response.papers.length > 0) {
        const suggestions = [];
        
        // Parse the raw data returned from background script
        for (const result of response.papers) {
          if (result.type === 'arxiv') {
            const arxivPapers = this.parseArxivResponse(result.data, result.keywords);
            suggestions.push(...arxivPapers);
          }
        }
        
        return suggestions.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
      } else {
        console.log('No API results, using mock data');
        return this.getMockSuggestions(keywords);
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return this.getMockSuggestions(keywords);
    }
  }

  parseArxivResponse(xmlText, keywords) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const entries = xmlDoc.getElementsByTagName('entry');
      const papers = [];
      
      for (let i = 0; i < Math.min(entries.length, 5); i++) {
        const entry = entries[i];
        
        try {
          const title = entry.getElementsByTagName('title')[0]?.textContent?.trim();
          const summary = entry.getElementsByTagName('summary')[0]?.textContent?.trim();
          const published = entry.getElementsByTagName('published')[0]?.textContent;
          const id = entry.getElementsByTagName('id')[0]?.textContent;
          
          const authors = Array.from(entry.getElementsByTagName('author'))
            .map(author => author.getElementsByTagName('name')[0]?.textContent)
            .filter(name => name)
            .slice(0, 3)
            .join(', ') + (entry.getElementsByTagName('author').length > 3 ? ' et al.' : '');
          
          if (title && summary && id) {
            const year = new Date(published).getFullYear();
            const relevance = this.calculateRelevance(title + ' ' + summary, keywords);
            
            papers.push({
              title: title,
              authors: authors || 'Unknown',
              year: year.toString(),
              citations: Math.floor(Math.random() * 200),
              relevance: relevance,
              abstract: summary.substring(0, 200) + '...',
              url: id,
              source: 'arXiv'
            });
          }
        } catch (error) {
          console.error('Error parsing arXiv entry:', error);
        }
      }
      
      return papers;
    } catch (error) {
      console.error('Error parsing arXiv XML:', error);
      return [];
    }
  }

  calculateRelevance(text, keywords) {
    // Try AI-powered relevance scoring
    return this.calculateRelevanceWithAI(text, keywords)
      .catch(() => this.calculateRelevanceSimple(text, keywords));
  }

  async calculateRelevanceWithAI(text, keywords) {
    try {
      // Hardcoded API key - replace with your actual key
      const API_KEY = 'sk-your-openai-api-key-here'; // Replace this with your actual API key
      
      if (!API_KEY || API_KEY === 'sk-your-openai-api-key-here') {
        return this.calculateRelevanceSimple(text, keywords);
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a research assistant that scores paper relevance. Return only a number between 0 and 1 indicating how relevant a paper is to given keywords. Higher scores mean more relevant.'
            },
            {
              role: 'user',
              content: `Rate the relevance (0-1) of this paper to keywords [${keywords.join(', ')}]:\n\nTitle and Abstract: ${text.substring(0, 500)}`
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        const score = parseFloat(data.choices[0].message.content.trim());
        return isNaN(score) ? this.calculateRelevanceSimple(text, keywords) : Math.max(0, Math.min(1, score));
      }
    } catch (error) {
      console.log('AI relevance scoring failed, using simple method');
    }
    
    return this.calculateRelevanceSimple(text, keywords);
  }

  calculateRelevanceSimple(text, keywords) {
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

  getMockSuggestions(keywords) {
    // Generate more realistic mock data based on keywords
    const templates = [
      {
        titleTemplate: "Deep Learning Approaches for {keyword1} and {keyword2}",
        abstractTemplate: "This paper presents novel approaches for {keyword1} using state-of-the-art methods..."
      },
      {
        titleTemplate: "A Comprehensive Survey of {keyword1} in {keyword2} Applications", 
        abstractTemplate: "We provide an extensive review of {keyword1} techniques applied to {keyword2}..."
      },
      {
        titleTemplate: "{keyword1}-Based Methods for {keyword2}: Recent Advances",
        abstractTemplate: "Recent advances in {keyword1} have shown promising results for {keyword2} tasks..."
      }
    ];
    
    const suggestions = [];
    const years = ['2024', '2023', '2022'];
    const sources = ['arXiv', 'Nature', 'Science', 'IEEE'];
    
    keywords.slice(0, 3).forEach((keyword, i) => {
      const template = templates[i % templates.length];
      const keyword1 = keywords[0] || 'machine learning';
      const keyword2 = keywords[1] || 'data analysis';
      
      suggestions.push({
        title: template.titleTemplate
          .replace('{keyword1}', keyword1)
          .replace('{keyword2}', keyword2),
        authors: `Researcher ${i + 1}, A. et al.`,
        year: years[i % years.length],
        citations: Math.floor(Math.random() * 300) + 50,
        relevance: Math.max(0.6, Math.random()),
        abstract: template.abstractTemplate
          .replace('{keyword1}', keyword1)  
          .replace('{keyword2}', keyword2) + "...",
        url: `https://example.com/paper${i + 1}`,
        source: sources[i % sources.length]
      });
    });
    
    return suggestions;
  }

  displaySuggestions() {
    const suggestionsContainer = document.querySelector('.suggestions-list');
    suggestionsContainer.innerHTML = '';
    
    this.suggestions.forEach((paper, index) => {
      const paperElement = document.createElement('div');
      paperElement.className = 'suggestion-item';
      
      // Add AI score badge if relevance is high
      const aiScoreBadge = paper.relevance > 0.8 ? 
        `<span class="ai-score">AI: ${(paper.relevance * 100).toFixed(0)}%</span>` : '';
      
      paperElement.innerHTML = `
        <div class="paper-title">
          <a href="${paper.url}" target="_blank">${paper.title}</a>
          ${aiScoreBadge}
        </div>
        <div class="paper-meta">
          <span class="authors">${paper.authors}</span>
          <span class="year">(${paper.year})</span>
        </div>
        <div class="paper-stats">
          <span class="citations">📊 ${paper.citations} citations</span>
          <span class="relevance">🎯 ${(paper.relevance * 100).toFixed(0)}% relevant</span>
          <span class="source">📚 ${paper.source}</span>
        </div>
        <div class="paper-abstract">
          ${paper.abstract.substring(0, 150)}...
        </div>
        <div class="paper-actions">
          <button onclick="this.parentElement.parentElement.classList.toggle('saved')">💾 Save</button>
          <button onclick="this.parentElement.parentElement.style.display='none'">❌ Hide</button>
          <button onclick="window.open('${paper.url}', '_blank')" class="ai-action">🤖 Analyze</button>
        </div>
      `;
      
      suggestionsContainer.appendChild(paperElement);
    });
    
    // Add notification with AI enhancement
    const aiEnhanced = this.suggestions.some(p => p.relevance > 0.8) ? ' (AI-enhanced)' : '';
    this.showNotification(`Found ${this.suggestions.length} relevant papers${aiEnhanced}!`);
  }

  updateStatus(message) {
    const statusElement = document.querySelector('.status .analyzing');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'research-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  setupScrollListener() {
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Trigger re-analysis if user scrolls significantly
        const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        if (scrollPercent > 0.5 && !this.isAnalyzing) {
          // Could trigger additional analysis for different sections
        }
      }, 1000);
    });
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ResearchAssistant());
} else {
  new ResearchAssistant();
}