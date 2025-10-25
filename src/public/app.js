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
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('show-register').addEventListener('click', () => this.toggleAuthForms());
        document.getElementById('show-login').addEventListener('click', () => this.toggleAuthForms());
        
        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        
        // Agent management
        document.getElementById('create-agent-btn').addEventListener('click', () => this.showCreateAgentModal());
        document.getElementById('create-agent-form').addEventListener('submit', (e) => this.handleCreateAgent(e));
        document.getElementById('cancel-create-agent').addEventListener('click', () => this.hideCreateAgentModal());
        
        // Query interface
        document.getElementById('query-btn').addEventListener('click', () => this.sendQuery());
        
        // Admin panel
        document.getElementById('manage-projects-btn').addEventListener('click', () => this.showProjects());
        document.getElementById('manage-memory-btn').addEventListener('click', () => this.showMemory());
        document.getElementById('view-all-agents-btn').addEventListener('click', () => this.showAllAgents());
    }

    checkAuth() {
        if (this.token && this.user) {
            this.showDashboard();
            this.loadUserData();
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
                this.showDashboard();
                this.loadUserData();
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            this.showError('Registration failed. Please try again.');
        }
    }

    async loadUserData() {
        await this.loadAgents();
        if (this.user.role === 'admin') {
            await this.loadAdminStats();
        }
    }

    async loadAgents() {
        try {
            const response = await fetch(`${this.apiBase}/agents/my-agents`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const data = await response.json();
            
            if (response.ok) {
                this.agents = data.agents;
                this.renderAgents();
                this.updateAgentSelect();
            }
        } catch (error) {
            console.error('Failed to load agents:', error);
        }
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
        const preferences = document.getElementById('agent-preferences').value.split(',').map(p => p.trim()).filter(p => p);

        try {
            const response = await fetch(`${this.apiBase}/agents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ name, personality, workPreferences: preferences })
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
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('login-btn').classList.remove('hidden');
        document.getElementById('logout-btn').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('login-btn').classList.add('hidden');
        document.getElementById('logout-btn').classList.remove('hidden');
        
        if (this.user && this.user.role === 'admin') {
            document.getElementById('admin-panel').classList.remove('hidden');
        }
        
        document.getElementById('user-info').textContent = `Welcome, ${this.user.name} (${this.user.role})`;
        document.getElementById('user-info').classList.remove('hidden');
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
