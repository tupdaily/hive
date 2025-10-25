class HiveApp {
    constructor() {
        this.apiBase = '/api';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.agents = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
    }

    setupEventListeners() {
        // Login/Register forms
        document.getElementById('login-form-element').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form-element').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('show-register').addEventListener('click', () => this.toggleAuthForms());
        document.getElementById('show-login').addEventListener('click', () => this.toggleAuthForms());
        
        // Questionnaire
        document.getElementById('questionnaire-form').addEventListener('submit', (e) => this.handleQuestionnaire(e));
        
        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        
        // Agent management
        document.getElementById('create-agent-btn').addEventListener('click', () => this.showCreateAgentModal());
        document.getElementById('create-agent-form').addEventListener('submit', (e) => this.handleCreateAgent(e));
        document.getElementById('cancel-create-agent').addEventListener('click', () => this.hideCreateAgentModal());
        
        // Chat interface
        document.getElementById('chat-form').addEventListener('submit', (e) => this.handleChatSubmit(e));
        
        // Auto-resize textarea
        document.getElementById('chat-input').addEventListener('input', (e) => this.autoResizeTextarea(e));
    }

    async checkAuth() {
        if (this.token && this.user) {
            // Check if user has completed questionnaire
            try {
                const response = await fetch(`${this.apiBase}/auth/profile`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                const data = await response.json();
                
                if (data.user && !data.user.hasDescription) {
                    this.showQuestionnaire();
                } else {
                    this.showDashboard();
                    this.loadUserData();
                }
            } catch (error) {
                console.error('Error checking user profile:', error);
                this.showDashboard();
                this.loadUserData();
            }
        } else {
            this.showLogin();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                this.showDashboard();
                this.loadUserData();
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            this.showError('Login failed. Please try again.');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;

        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                // Check if user needs to complete questionnaire
                try {
                    const profileResponse = await fetch(`${this.apiBase}/auth/profile`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${this.token}` }
                    });
                    const profileData = await profileResponse.json();
                    
                    if (profileData.user && !profileData.user.hasDescription) {
                        this.showQuestionnaire();
                    } else {
                        this.showDashboard();
                        this.loadUserData();
                    }
                } catch (error) {
                    console.error('Error checking user profile:', error);
                    this.showDashboard();
                    this.loadUserData();
                }
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            this.showError('Registration failed. Please try again.');
        }
    }

    async handleQuestionnaire(e) {
        e.preventDefault();
        const description = document.getElementById('user-description').value;
        
        try {
            const response = await fetch(`${this.apiBase}/auth/questionnaire`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ description })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showSuccess('Questionnaire submitted successfully!');
                this.showDashboard();
                this.loadUserData();
            } else {
                this.showError(data.error || 'Failed to submit questionnaire. Please try again.');
            }
        } catch (error) {
            this.showError('Failed to submit questionnaire. Please try again.');
        }
    }

    async loadUserData() {
        await this.loadAgents();
        this.loadProjects();
    }

    loadProjects() {
        // For now, show placeholder projects
        const projectsList = document.getElementById('projects-list');
        projectsList.innerHTML = `
            <div class="project-button rounded-lg p-3 text-center text-gray-800 font-medium mb-2">
                <i class="fas fa-project-diagram mr-2"></i>E-commerce Platform
            </div>
            <div class="project-button rounded-lg p-3 text-center text-gray-800 font-medium mb-2">
                <i class="fas fa-mobile-alt mr-2"></i>Mobile App
            </div>
            <div class="project-button rounded-lg p-3 text-center text-gray-800 font-medium mb-2">
                <i class="fas fa-database mr-2"></i>Data Analytics
            </div>
            <div class="project-button rounded-lg p-3 text-center text-gray-800 font-medium">
                <i class="fas fa-plus mr-2"></i>Create New Project
            </div>
        `;
    }

    async loadAgents() {
        try {
            const response = await fetch(`${this.apiBase}/agents/my-agents`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const data = await response.json();
            
            if (response.ok) {
                this.agents = data.agents || [];
                this.renderAgentsSidebar();
            }
        } catch (error) {
            console.error('Failed to load agents:', error);
        }
    }

    renderAgentsSidebar() {
        const agentsSidebar = document.getElementById('agents-sidebar');
        if (this.agents.length === 0) {
            agentsSidebar.innerHTML = '<p class="text-yellow-200 text-sm text-center">No agents yet</p>';
            return;
        }

        agentsSidebar.innerHTML = this.agents.map(agent => `
            <div class="project-button rounded-lg p-3 text-center text-gray-800 font-medium mb-2 cursor-pointer hover:shadow-lg transition-all duration-300" 
                 onclick="app.selectAgent('${agent.id}')">
                <i class="fas fa-robot mr-2"></i>${agent.name}
            </div>
        `).join('');
    }

    selectAgent(agentId) {
        // For now, just show a message
        this.addMessageToChat(`Selected agent: ${this.agents.find(a => a.id === agentId)?.name || 'Unknown'}`, 'assistant');
    }

    async loadAdminStats() {
        try {
            const response = await fetch(`${this.apiBase}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('total-users').textContent = data.totalUsers;
                document.getElementById('total-agents').textContent = data.totalAgents;
                document.getElementById('active-projects').textContent = data.activeProjects;
                document.getElementById('memory-blocks').textContent = data.totalMemoryBlocks;
            }
        } catch (error) {
            console.error('Failed to load admin stats:', error);
        }
    }

    renderAgents() {
        const container = document.getElementById('agents-list');
        container.innerHTML = '';

        if (this.agents.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No agents created yet. Create your first agent to get started!</p>';
            return;
        }

        this.agents.forEach(agent => {
            const agentCard = document.createElement('div');
            agentCard.className = 'bg-gray-50 p-4 rounded-lg border';
            agentCard.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">${agent.name}</h3>
                        <p class="text-sm text-gray-600 mt-1">${agent.personality}</p>
                        <div class="mt-2">
                            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${agent.workPreferences.join(', ')}</span>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="app.queryAgent('${agent.id}')" class="bg-blue-500 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded">
                            Query
                        </button>
                        <button onclick="app.deleteAgent('${agent.id}')" class="bg-red-500 hover:bg-red-700 text-white text-sm px-3 py-1 rounded">
                            Delete
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(agentCard);
        });
    }

    updateAgentSelect() {
        const select = document.getElementById('agent-select');
        select.innerHTML = '<option value="">Choose an agent...</option>';
        
        this.agents.forEach(agent => {
            const option = document.createElement('option');
            option.value = agent.id;
            option.textContent = agent.name;
            select.appendChild(option);
        });
    }

    async handleCreateAgent(e) {
        e.preventDefault();
        const name = document.getElementById('agent-name').value;
        const personality = document.getElementById('agent-personality').value;
        const description = document.getElementById('agent-description').value;

        try {
            const response = await fetch(`${this.apiBase}/agents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ name, personality, description })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.hideCreateAgentModal();
                this.loadAgents();
                this.showSuccess('Agent created successfully!');
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            this.showError('Failed to create agent. Please try again.');
        }
    }

    async sendQuery() {
        const agentId = document.getElementById('agent-select').value;
        const query = document.getElementById('query-input').value;

        if (!agentId || !query) {
            this.showError('Please select an agent and enter a query.');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/agents/${agentId}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ query })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.displayQueryResponse(data);
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            this.showError('Query failed. Please try again.');
        }
    }

    displayQueryResponse(response) {
        const container = document.getElementById('query-response');
        container.innerHTML = `
            <div class="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                <div class="flex items-start">
                    <i class="fas fa-robot text-blue-500 text-xl mr-3 mt-1"></i>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900 mb-2">Agent Response</h4>
                        <p class="text-gray-700 mb-3">${response.response}</p>
                        <div class="text-xs text-gray-500">
                            <p>Agent: ${response.agentId}</p>
                            <p>Time: ${new Date(response.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.classList.remove('hidden');
    }

    async deleteAgent(agentId) {
        if (!confirm('Are you sure you want to delete this agent?')) return;

        try {
            const response = await fetch(`${this.apiBase}/agents/${agentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                this.loadAgents();
                this.showSuccess('Agent deleted successfully!');
            } else {
                const data = await response.json();
                this.showError(data.error);
            }
        } catch (error) {
            this.showError('Failed to delete agent. Please try again.');
        }
    }

    queryAgent(agentId) {
        document.getElementById('agent-select').value = agentId;
        document.getElementById('query-input').focus();
    }

    showLogin() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('chatbot-interface').classList.add('hidden');
        document.getElementById('questionnaire').classList.add('hidden');
    }

    showQuestionnaire() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('chatbot-interface').classList.add('hidden');
        document.getElementById('questionnaire').classList.remove('hidden');
    }

    showDashboard() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('chatbot-interface').classList.remove('hidden');
        document.getElementById('questionnaire').classList.add('hidden');
        this.updateUserInfo();
        this.loadUserData();
    }

    updateUserInfo() {
        if (this.user) {
            document.getElementById('user-name').textContent = this.user.name;
            document.getElementById('user-role').textContent = this.user.role;
        }
    }

    async handleChatSubmit(e) {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addMessageToChat(message, 'user');
        input.value = '';
        this.autoResizeTextarea({ target: input });
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // For now, we'll use a simple response
            // In a real implementation, this would call your AI agent
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            this.addMessageToChat(response, 'assistant');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessageToChat('Sorry, I encountered an error. Please try again.', 'assistant');
        }
    }

    addMessageToChat(message, sender) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`;
        
        const bubbleClass = sender === 'user' 
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white max-w-md rounded-2xl p-4'
            : 'chat-bubble rounded-2xl p-4 max-w-md';
        
        messageDiv.innerHTML = `
            <div class="${bubbleClass}">
                <div class="flex items-start">
                    ${sender === 'assistant' ? `
                        <div class="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <i class="fas fa-robot text-gray-800 text-sm"></i>
                        </div>
                    ` : ''}
                    <div class="flex-1">
                        <p class="font-medium">${message}</p>
                    </div>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'flex justify-start mb-4';
        typingDiv.innerHTML = `
            <div class="chat-bubble rounded-2xl p-4 max-w-md">
                <div class="flex items-start">
                    <div class="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <i class="fas fa-robot text-gray-800 text-sm"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex space-x-1">
                            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async getAIResponse(message) {
        // This is a placeholder - in a real implementation, you would call your AI agent here
        // For now, return a simple response
        const responses = [
            "That's an interesting question! Let me help you with that.",
            "I understand what you're asking. Here's what I think...",
            "Great question! Based on your context, I'd suggest...",
            "I can definitely help you with that. Let me break it down...",
            "That's a common challenge. Here's how I'd approach it..."
        ];
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        return responses[Math.floor(Math.random() * responses.length)] + " " + message;
    }

    autoResizeTextarea(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    toggleAuthForms() {
        document.getElementById('login-form-element').classList.toggle('hidden');
        document.getElementById('register-form').classList.toggle('hidden');
    }

    showCreateAgentModal() {
        document.getElementById('create-agent-modal').classList.remove('hidden');
    }

    hideCreateAgentModal() {
        document.getElementById('create-agent-modal').classList.add('hidden');
        document.getElementById('create-agent-form').reset();
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.showLogin();
    }

    showError(message) {
        alert(`Error: ${message}`);
    }

    showSuccess(message) {
        alert(`Success: ${message}`);
    }

    // Admin functions
    async showProjects() {
        alert('Project management feature coming soon!');
    }

    async showMemory() {
        alert('Memory management feature coming soon!');
    }

    async showAllAgents() {
        alert('All agents view coming soon!');
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HiveApp();
});
