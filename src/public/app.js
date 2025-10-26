class HiveApp {
    constructor() {
        this.apiBase = '/api';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.userAgent = null; // Single agent per user
        this.selectedProjects = new Set(); // Set of selected project IDs
        this.userProjects = []; // Projects assigned to user
        
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
        
        // Admin console
        document.getElementById('admin-console-btn').addEventListener('click', () => this.showAdminConsole());
        document.getElementById('close-admin-console').addEventListener('click', () => this.hideAdminConsole());
        
        // Chat interface
        document.getElementById('chat-form').addEventListener('submit', (e) => this.handleChatSubmit(e));
        
        // Auto-resize textarea
        document.getElementById('chat-input').addEventListener('input', (e) => {
            this.autoResizeTextarea(e);
        });
        
        // Handle focus events
        document.getElementById('chat-input').addEventListener('focus', (e) => this.handleChatInputFocus(e));
        document.getElementById('chat-input').addEventListener('blur', (e) => this.handleChatInputBlur(e));
    }

    async checkAuth() {
        if (this.token && this.user) {
            // Check if user has completed questionnaire
            try {
                const response = await fetch(`${this.apiBase}/auth/profile`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.user = data.user;
                    
                    if (!data.user.description) {
                        this.showQuestionnaire();
                    } else {
                        await this.showDashboard();
                        await this.loadUserData();
                    }
                } else {
                    this.showLogin();
                }
            } catch (error) {
                console.error('Error checking user profile:', error);
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        console.log('Login form submitted');
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        console.log('Login attempt for email:', email);
        
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
                
                // Check if user has description
                console.log('User data from login:', data.user);
                console.log('Description:', data.user.description);
                
                if (!data.user.description) {
                    console.log('Showing questionnaire - user has no description');
                    this.showQuestionnaire();
                } else {
                    console.log('Showing dashboard - user has description');
                    await this.showDashboard();
                    await this.loadUserData();
                }
            } else {
                this.showError(`Login failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Login error:', error);
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
                
                // Always show questionnaire for new users
                this.showQuestionnaire();
            } else {
                this.showError(`Registration failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Registration failed. Please try again.');
        }
    }

    async handleQuestionnaire(e) {
        e.preventDefault();
        
        const description = document.getElementById('user-description').value.trim();
        
        if (!description || description.length < 10) {
            this.showError('Please provide a description of at least 10 characters.');
            return;
        }
        
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
                this.user.description = description;
                localStorage.setItem('user', JSON.stringify(this.user));
                this.showSuccess('Questionnaire submitted successfully!');
                await this.showDashboard();
                await this.loadUserData();
            } else {
                this.showError(data.error || 'Failed to submit questionnaire. Please try again.');
            }
        } catch (error) {
            console.error('Questionnaire error:', error);
            this.showError('Failed to submit questionnaire. Please try again.');
        }
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

    async showDashboard() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('questionnaire').classList.add('hidden');
        document.getElementById('chatbot-interface').classList.remove('hidden');
        
        this.updateUserInfo();
        
        // Show admin console button if user is admin
        if (this.user.role === 'admin') {
            document.getElementById('admin-console-section').classList.remove('hidden');
        }
    }

    updateUserInfo() {
        document.getElementById('user-name').textContent = this.user.name;
        document.getElementById('user-role').textContent = this.user.role;
    }

    async loadUserData() {
        await this.loadUserAgent();
        await this.loadUserProjects(); // Reset memory blocks on login
    }

    async loadUserAgent() {
        try {
            console.log('Loading user agent...');
            const response = await fetch(`${this.apiBase}/agents/my-agents`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const data = await response.json();
            console.log('Load agents response:', data);
            
            if (response.ok) {
                // Get the first agent (or create one if none exist)
                this.userAgent = data.agents && data.agents.length > 0 ? data.agents[0] : null;
                console.log('Current user agent:', this.userAgent);
                
                if (!this.userAgent) {
                    console.log('No agent found, creating default agent...');
                    // Create a default agent for the user
                    await this.createDefaultAgent();
                } else {
                    console.log('Using existing agent:', this.userAgent.name);
                }
            } else {
                console.error('Failed to load agents:', data);
            }
        } catch (error) {
            console.error('Failed to load user agent:', error);
        }
    }

    async createDefaultAgent() {
        try {
            console.log('Creating default agent for user:', this.user.name);
            console.log('User description:', this.user.description);
            
            const response = await fetch(`${this.apiBase}/agents`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    name: `${this.user.name}'s Assistant`,
                    personality: 'Helpful, professional, and knowledgeable',
                    description: this.user.description || 'General assistance and support'
                })
            });
            
            const data = await response.json();
            console.log('Agent creation response:', data);
            
            if (response.ok) {
                this.userAgent = data.agent;
                console.log('Agent created successfully:', this.userAgent);
                this.addMessageToChat(`Welcome! I'm ${this.userAgent.name}, your AI assistant. How can I help you today?`, 'assistant');
            } else {
                console.error('Failed to create agent:', data);
                this.showError('Failed to create your AI assistant. Please try again.');
            }
        } catch (error) {
            console.error('Failed to create default agent:', error);
            this.showError('Failed to create your AI assistant. Please try again.');
        }
    }

    async loadUserProjects() {
        try {
            const response = await fetch(`${this.apiBase}/projects/my-projects`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const data = await response.json();
            
            if (response.ok) {
                this.userProjects = data.projects || [];
                this.renderProjectsSidebar();
            }
        } catch (error) {
            console.error('Failed to load user projects:', error);
        }
    }

    renderProjectsSidebar() {
        const projectsList = document.getElementById('projects-list');
        
        if (this.userProjects.length === 0) {
            projectsList.innerHTML = '<p class="text-yellow-200 text-sm text-center">No projects assigned</p>';
            return;
        }

        projectsList.innerHTML = this.userProjects.map(project => {
            const isSelected = this.selectedProjects.has(project.id);
            const selectedClass = isSelected ? 'selected' : '';
            
            return `
                <div class="project-button p-3 text-center text-gray-800 font-medium mb-2 cursor-pointer hover:shadow-lg transition-all duration-300 ${selectedClass}" 
                     data-project-id="${project.id}">
                    <i class="fas fa-project-diagram mr-2"></i>${project.name}
                </div>
            `;
        }).join('');

        // Add event listeners to project buttons
        projectsList.querySelectorAll('[data-project-id]').forEach(button => {
            button.addEventListener('click', (e) => {
                const projectId = e.currentTarget.getAttribute('data-project-id');
                this.toggleProjectSelection(projectId);
            });
        });
    }

    toggleProjectSelection(projectId) {
        if (this.selectedProjects.has(projectId)) {
            this.selectedProjects.delete(projectId);
            this.removeProjectMemoryBlock(projectId);
        } else {
            this.selectedProjects.add(projectId);
            this.addProjectMemoryBlock(projectId);
        }
        
        this.renderProjectsSidebar();
    }

    async resetProjectMemoryBlocks() {
        // Reset all project memory blocks on login
        // This would involve removing all project memory blocks from the user's agent
        console.log('Resetting project memory blocks on login');
        // Implementation would depend on the Letta API for removing memory blocks
    }

    async addProjectMemoryBlock(projectId) {
        const project = this.userProjects.find(p => p.id === projectId);
        if (project && this.userAgent) {
            console.log(`Adding memory block for project: ${project.name}`);
            // Implementation would involve adding the project's memory block to the user's agent
        }
    }
    
    // async removeProjectMemoryBlock(projectId) {
    //     const project = this.userProjects.find(p => p.id === projectId);
    //     if (project && this.userAgent) {
    //         console.log(`Removing memory block for project: ${project.name}`);
    //         // Implementation would involve removing the project's memory block from the user's agent
    //     }
    // }

    showAdminConsole() {
        document.getElementById('admin-console-modal').classList.remove('hidden');
        this.loadAdminData();
    }

    hideAdminConsole() {
        document.getElementById('admin-console-modal').classList.add('hidden');
    }

    async loadAdminData() {
        // Load projects and users for admin console
        console.log('Loading admin data...');
        // Implementation would load all projects and users
    }

    async handleChatSubmit(e) {
        e.preventDefault();
        
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Move chat input to bottom on first message
        const container = document.getElementById('chat-input-container');
        if (container.classList.contains('chat-input-centered')) {
            container.classList.remove('chat-input-centered');
            container.classList.add('chat-input-bottom');
        }
        
        // Add user message to chat
        this.addMessageToChat(message, 'user');
        
        // Clear input
        input.value = '';
        this.autoResizeTextarea({ target: input });
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Get AI response
        try {
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            this.addMessageToChat(response, 'assistant');
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            this.addMessageToChat('I apologize, but I encountered an error. Please try again.', 'assistant');
        }
    }

    addMessageToChat(message, sender) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        
        if (sender === 'user') {
            messageDiv.className = 'flex justify-end mb-4';
            messageDiv.innerHTML = `
                <div class="bg-yellow-400 text-gray-800 px-6 py-3 rounded-2xl max-w-xs lg:max-w-md shadow-lg">
                    ${message}
                </div>
            `;
        } else {
            messageDiv.className = 'flex justify-start mb-4';
            messageDiv.innerHTML = `
                <div class="chat-bubble text-gray-800 px-6 py-3 rounded-2xl max-w-xs lg:max-w-md shadow-lg">
                    <i class="fas fa-bee mr-2 text-yellow-500"></i>${message}
                </div>
            `;
        }
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'flex justify-start mb-4';
        typingDiv.innerHTML = `
            <div class="chat-bubble text-gray-800 px-6 py-3 rounded-2xl shadow-lg">
                <i class="fas fa-bee mr-2 text-yellow-500"></i>
                <span class="typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                </span>
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
        if (!this.userAgent) {
            return "I don't have an AI agent available yet. Please contact an administrator.";
        }

        try {
            console.log('Getting AI response for agent:', this.userAgent.id);
            const response = await fetch(`${this.apiBase}/agents/${this.userAgent.id}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ query: message })
            });

            const data = await response.json();
            console.log('Ai response:', data);
            if (response.ok) {
                return data.response || "I received your message but couldn't generate a response.";
            } else {
                console.error('Agent query error:', data);
                return "I encountered an error while processing your request. Please try again.";
            }
        } catch (error) {
            console.error('Error calling AI agent:', error);
            return "I'm having trouble connecting to my AI agents right now. Please try again in a moment.";
        }
    }

    autoResizeTextarea(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    handleChatInputFocus(e) {
        e.target.classList.add('chat-input-focused');
    }

    handleChatInputBlur(e) {
        e.target.classList.remove('chat-input-focused');
    }

    toggleAuthForms() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm.classList.contains('hidden')) {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
            type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    logout() {
        this.token = null;
        this.user = null;
        this.userAgent = null;
        this.selectedProjects.clear();
        this.userProjects = [];
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        this.showLogin();
    }
}

// Initialize the app when the page loads
const app = new HiveApp();


