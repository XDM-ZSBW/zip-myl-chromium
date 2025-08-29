"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
const DEFAULT_SETTINGS = {
    typingThreshold: 100,
    leftHandShortcut: 'Ctrl+Shift+Z',
    rightHandShortcut: 'Ctrl+Shift+M',
    enableTypingIndicator: true,
    enableClickActions: true,
    enableTypingAwareService: true,
    typingAnalysisDelay: 500,
    enablePopupOverlay: true,
    overlayAnimationDuration: 3000,
    enableSoundFeedback: false,
    enableVisualFeedback: true,
    responseTriggerKeywords: ['help', 'assist', 'guide', 'suggest', 'recommend'],
    autoInsertResponses: false,
    enableRunOnThoughtDetection: true,
    runOnThoughtThreshold: 50,
    enableCursorProximityIndicators: true,
    proximityIndicatorStyle: 'pulse',
    soundVolume: 50,
    popupOverlayDuration: 3000
};
class MyPlugin extends obsidian_1.Plugin {
    constructor() {
        super(...arguments);
        this.typingCount = 0;
        this.startTime = Date.now();
        this.typingTimer = null;
        this.typingAnalysisTimer = null;
        this.currentTypingContext = null;
        this.popupOverlay = null;
        this.cursorProximityIndicator = null;
        this.lastTypedText = '';
        this.typingBuffer = '';
    }
    async onload() {
        console.log('Loading ZIP-Myl Obsidian Plugin with Enhanced Typing-Aware Service');
        await this.loadSettings();
        // Create ribbon icon with dynamic color and click functionality
        this.ribbonIconEl = this.addRibbonIcon('dice', 'ZIP-Myl Plugin', (evt) => {
            // Only handle left-click here
            if (evt.button === 0) { // Left mouse button
                this.handleRibbonClick(evt);
            }
        });
        this.ribbonIconEl.addClass('zip-myl-ribbon-class');
        this.updateRibbonColor();
        // Add right-click context menu to ribbon icon
        this.setupRibbonContextMenu();
        // Create status bar item
        this.statusBarItemEl = this.addStatusBarItem();
        this.statusBarItemEl.setText('ZIP-Myl: Ready');
        this.statusBarItemEl.addClass('zip-myl-status');
        // Add commands with keyboard shortcuts
        this.addCommand({
            id: 'zip-myl-left-hand-action',
            name: 'ZIP-Myl Left Hand Action',
            hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "Z" }],
            callback: () => {
                this.handleLeftHandAction();
            }
        });
        this.addCommand({
            id: 'zip-myl-right-hand-action',
            name: 'ZIP-Myl Right Hand Action',
            hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "M" }],
            callback: () => {
                this.handleRightHandAction();
            }
        });
        this.addCommand({
            id: 'open-zip-myl-modal',
            name: 'Open ZIP-Myl Modal',
            callback: () => {
                this.openZipMylModal();
            }
        });
        this.addCommand({
            id: 'toggle-typing-aware-service',
            name: 'Toggle Typing-Aware Service',
            callback: () => {
                this.toggleTypingAwareService();
            }
        });
        this.addCommand({
            id: 'open-zip-myl-settings',
            name: 'Open ZIP-Myl Settings',
            hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "S" }],
            callback: () => {
                this.openSettingsPage();
            }
        });
        this.addCommand({
            id: 'quick-settings-toggle',
            name: 'Quick Settings Toggle',
            hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "T" }],
            callback: () => {
                this.openQuickSettingsPanel();
            }
        });
        // Add settings tab
        this.addSettingTab(new MySettingTab(this.app, this));
        // Monitor typing activity in active editor
        this.registerEvent(this.app.workspace.on('editor-change', (editor, view) => {
            if (this.settings.enableTypingIndicator) {
                this.handleTypingActivity();
            }
            if (this.settings.enableTypingAwareService) {
                this.handleTypingAwareService(editor, view);
            }
        }));
        // Monitor file changes
        this.registerEvent(this.app.workspace.on('file-open', () => {
            console.log('File opened in ZIP-Myl Plugin');
            this.resetTypingCount();
            this.clearTypingContext();
        }));
        // Monitor active leaf changes
        this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
            this.resetTypingCount();
            this.clearTypingContext();
        }));
        // Heartbeat for plugin status
        this.registerInterval(window.setInterval(() => {
            this.updateStatusBar();
        }, 5000));
    }
    onunload() {
        console.log('Unloading ZIP-Myl Obsidian Plugin');
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }
        if (this.typingAnalysisTimer) {
            clearTimeout(this.typingAnalysisTimer);
        }
        if (this.popupOverlay) {
            this.popupOverlay.destroy();
        }
        if (this.cursorProximityIndicator) {
            this.cursorProximityIndicator.destroy();
        }
    }
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
    // Handle ribbon icon click
    handleRibbonClick(evt) {
        if (!this.settings.enableClickActions)
            return;
        new obsidian_1.Notice(`ZIP-Myl Plugin activated! Typing count: ${this.typingCount}`);
        // Show different actions based on typing activity
        if (this.typingCount > this.settings.typingThreshold) {
            new obsidian_1.Notice('High activity detected! Consider taking a breather.');
        }
        else {
            new obsidian_1.Notice('Ready for productivity!');
        }
    }
    // Handle left hand shortcut action
    handleLeftHandAction() {
        new obsidian_1.Notice('Left Hand Action: Quick breather space activated');
        this.resetTypingCount();
        this.updateRibbonColor();
    }
    // Handle right hand shortcut action
    handleRightHandAction() {
        new obsidian_1.Notice('Right Hand Action: Focus mode activated');
        this.updateStatusBar();
    }
    // Handle typing activity
    handleTypingActivity() {
        this.typingCount++;
        // Clear existing timer
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }
        // Update UI immediately
        this.updateRibbonColor();
        this.updateStatusBar();
        // Reset after 2 seconds of inactivity
        this.typingTimer = setTimeout(() => {
            this.resetTypingCount();
        }, 2000);
    }
    // Handle typing-aware service with enhanced context monitoring
    handleTypingAwareService(editor, view) {
        // Clear existing analysis timer
        if (this.typingAnalysisTimer) {
            clearTimeout(this.typingAnalysisTimer);
        }
        // Get current typing context with enhanced page and element information
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        const currentText = editor.getValue();
        // Get page context (file name, path)
        const activeFile = this.app.workspace.getActiveFile();
        const pageContext = activeFile ? `${activeFile.path} (${activeFile.extension})` : 'Unknown';
        // Get element context (editor type, view type)
        const elementContext = view?.getViewType() || 'editor';
        // Calculate run-on thought score
        const runOnThoughtScore = this.calculateRunOnThoughtScore(line, cursor);
        this.currentTypingContext = {
            text: line,
            cursorPosition: cursor.ch,
            lineNumber: cursor.line,
            timestamp: Date.now(),
            wordCount: line.trim().split(/\s+/).filter(word => word.length > 0).length,
            characterCount: line.length,
            pageContext: pageContext,
            elementContext: elementContext,
            runOnThoughtScore: runOnThoughtScore
        };
        // Buffer the typed text for analysis
        this.typingBuffer += line[cursor.ch - 1] || '';
        // Show cursor proximity indicator for run-on thoughts
        if (this.settings.enableCursorProximityIndicators && runOnThoughtScore > this.settings.runOnThoughtThreshold) {
            this.showCursorProximityIndicator(cursor, runOnThoughtScore);
        }
        // Analyze typing after delay
        this.typingAnalysisTimer = setTimeout(() => {
            this.analyzeTypingContext();
        }, this.settings.typingAnalysisDelay);
    }
    // Calculate run-on thought score based on text characteristics
    calculateRunOnThoughtScore(line, cursor) {
        let score = 0;
        // Long sentences (more than 20 words)
        const words = line.trim().split(/\s+/).filter(word => word.length > 0);
        if (words.length > 20)
            score += 30;
        // Very long lines (more than 100 characters)
        if (line.length > 100)
            score += 25;
        // Multiple clauses without proper punctuation
        const clauses = line.split(/[.!?]/).filter(clause => clause.trim().length > 0);
        if (clauses.length > 3)
            score += 20;
        // Excessive use of conjunctions
        const conjunctions = (line.match(/\b(and|or|but|however|therefore|furthermore|moreover|additionally)\b/gi) || []).length;
        if (conjunctions > 2)
            score += 15;
        // Lack of paragraph breaks (very long continuous text)
        if (this.typingBuffer.length > 200)
            score += 20;
        return Math.min(score, 100); // Cap at 100
    }
    // Show cursor proximity indicator for run-on thoughts
    showCursorProximityIndicator(cursor, score) {
        if (this.cursorProximityIndicator) {
            this.cursorProximityIndicator.destroy();
        }
        this.cursorProximityIndicator = new CursorProximityIndicator(this.app, cursor, score, this.settings.proximityIndicatorStyle);
        this.cursorProximityIndicator.show();
    }
    // Analyze typing context for triggers
    async analyzeTypingContext() {
        if (!this.currentTypingContext)
            return;
        const analysis = this.performTypingAnalysis(this.currentTypingContext);
        if (analysis.needsAttention) {
            await this.triggerAttentionResponse(analysis);
        }
    }
    // Perform typing analysis with run-on thought detection
    performTypingAnalysis(context) {
        const text = context.text.toLowerCase();
        const hasTriggerKeywords = this.settings.responseTriggerKeywords.some(keyword => text.includes(keyword.toLowerCase()));
        // Enhanced attention detection including run-on thoughts
        const isRunOnThought = context.runOnThoughtScore > this.settings.runOnThoughtThreshold;
        const needsAttention = hasTriggerKeywords ||
            context.wordCount > 20 ||
            context.characterCount > 100 ||
            text.includes('?') ||
            text.includes('!') ||
            isRunOnThought;
        // Determine run-on thought severity
        let runOnThoughtSeverity = 'low';
        if (context.runOnThoughtScore > 70)
            runOnThoughtSeverity = 'high';
        else if (context.runOnThoughtScore > 40)
            runOnThoughtSeverity = 'medium';
        // Generate suggested response
        let suggestedResponse = '';
        let confidence = 0;
        let contextType = '';
        if (isRunOnThought) {
            confidence = 0.9;
            contextType = 'run-on-thought';
            suggestedResponse = this.generateResponseForRunOnThought(runOnThoughtSeverity);
        }
        else if (hasTriggerKeywords) {
            confidence = 0.8;
            contextType = 'keyword-trigger';
            suggestedResponse = this.generateResponseForKeywords(text);
        }
        else if (context.wordCount > 20) {
            confidence = 0.6;
            contextType = 'long-text';
            suggestedResponse = 'Consider breaking this into smaller, focused sections.';
        }
        else if (text.includes('?')) {
            confidence = 0.7;
            contextType = 'question';
            suggestedResponse = 'This looks like a question. Would you like me to help you find an answer?';
        }
        return {
            hasTriggerKeywords,
            needsAttention,
            suggestedResponse,
            confidence,
            context: contextType,
            isRunOnThought,
            runOnThoughtSeverity
        };
    }
    // Generate response for run-on thoughts
    generateResponseForRunOnThought(severity) {
        switch (severity) {
            case 'high':
                return 'This looks like a run-on thought. Consider breaking it into smaller, focused paragraphs for better readability.';
            case 'medium':
                return 'This passage could benefit from some structure. Try adding breaks or organizing into bullet points.';
            case 'low':
                return 'Consider adding a paragraph break here to improve readability.';
            default:
                return 'This text might benefit from some structure and breaks.';
        }
    }
    // Generate response for keyword triggers
    generateResponseForKeywords(text) {
        if (text.includes('help')) {
            return 'I can help you with that! What specific assistance do you need?';
        }
        else if (text.includes('assist')) {
            return 'I\'m here to assist you. Let me know what you\'d like to work on.';
        }
        else if (text.includes('guide')) {
            return 'I can guide you through this process. What would you like to accomplish?';
        }
        else if (text.includes('suggest')) {
            return 'I have some suggestions for you. Would you like to hear them?';
        }
        else if (text.includes('recommend')) {
            return 'I can recommend some approaches. What are you trying to achieve?';
        }
        return 'I noticed you might need some help. How can I assist you?';
    }
    // Trigger attention response
    async triggerAttentionResponse(analysis) {
        if (this.settings.enablePopupOverlay) {
            await this.showPopupOverlay(analysis);
        }
        if (this.settings.enableSoundFeedback) {
            this.playAttentionSound();
        }
        if (this.settings.enableVisualFeedback) {
            this.triggerVisualFeedback();
        }
        // Auto-insert response if enabled
        if (this.settings.autoInsertResponses && analysis.suggestedResponse) {
            await this.autoInsertResponse(analysis.suggestedResponse);
        }
    }
    // Show popup overlay
    async showPopupOverlay(analysis) {
        if (this.popupOverlay) {
            this.popupOverlay.destroy();
        }
        this.popupOverlay = new PopupOverlay(this.app, analysis, this.settings.overlayAnimationDuration);
        await this.popupOverlay.show();
    }
    // Play attention sound
    playAttentionSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }
        catch (error) {
            console.log('Could not play attention sound:', error);
        }
    }
    // Trigger visual feedback
    triggerVisualFeedback() {
        // Flash the ribbon icon
        this.ribbonIconEl.addClass('zip-myl-attention-flash');
        setTimeout(() => {
            this.ribbonIconEl.removeClass('zip-myl-attention-flash');
        }, 500);
    }
    // Auto-insert response
    async autoInsertResponse(response) {
        const activeView = this.app.workspace.getActiveViewOfType(obsidian_1.MarkdownView);
        if (!activeView)
            return;
        const editor = activeView.editor;
        const cursor = editor.getCursor();
        // Insert response at cursor position
        editor.replaceRange(`\n\n**ZIP-Myl Assistant:** ${response}\n\n`, cursor);
        // Move cursor to end of inserted text
        const newCursor = {
            line: cursor.line + 3,
            ch: response.length + 20
        };
        editor.setCursor(newCursor);
    }
    // Toggle typing-aware service
    toggleTypingAwareService() {
        this.settings.enableTypingAwareService = !this.settings.enableTypingAwareService;
        this.saveSettings();
        const status = this.settings.enableTypingAwareService ? 'enabled' : 'disabled';
        new obsidian_1.Notice(`Typing-Aware Service ${status}`);
    }
    // Clear typing context
    clearTypingContext() {
        this.currentTypingContext = null;
        this.typingBuffer = '';
        if (this.cursorProximityIndicator) {
            this.cursorProximityIndicator.destroy();
            this.cursorProximityIndicator = null;
        }
    }
    // Reset typing count
    resetTypingCount() {
        this.typingCount = 0;
        this.updateRibbonColor();
        this.updateStatusBar();
    }
    // Update ribbon color based on typing activity
    updateRibbonColor() {
        const icon = this.ribbonIconEl.querySelector('svg');
        if (!icon)
            return;
        // Remove existing color classes
        icon.classList.remove('zip-myl-color-low', 'zip-myl-color-medium', 'zip-myl-color-high');
        // Add color class based on typing activity
        if (this.typingCount === 0) {
            icon.classList.add('zip-myl-color-low');
        }
        else if (this.typingCount < this.settings.typingThreshold) {
            icon.classList.add('zip-myl-color-medium');
        }
        else {
            icon.classList.add('zip-myl-color-high');
        }
    }
    // Update status bar text
    updateStatusBar() {
        if (this.typingCount === 0) {
            this.statusBarItemEl.setText('ZIP-Myl: Ready');
        }
        else if (this.typingCount < this.settings.typingThreshold) {
            this.statusBarItemEl.setText(`ZIP-Myl: Active (${this.typingCount})`);
        }
        else {
            this.statusBarItemEl.setText(`ZIP-Myl: High Activity (${this.typingCount})`);
        }
    }
    // Open ZIP-Myl modal
    openZipMylModal() {
        const modal = new ZipMylModal(this.app, this);
        modal.open();
    }
    // Setup right-click context menu for ribbon icon
    setupRibbonContextMenu() {
        console.log('ZIP-Myl: Setting up right-click context menu for ribbon icon');
        console.log('ZIP-Myl: Ribbon icon element:', this.ribbonIconEl);
        // Remove any existing context menu listeners
        this.ribbonIconEl.removeEventListener('contextmenu', this.handleContextMenu);
        // Add right-click context menu listener
        this.ribbonIconEl.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        console.log('ZIP-Myl: Right-click event listener attached');
    }
    // Handle right-click context menu (bound method)
    handleContextMenu(evt) {
        console.log('ZIP-Myl: Right-click event fired on ribbon icon');
        evt.preventDefault();
        evt.stopPropagation();
        this.showRibbonContextMenu(evt);
    }
    // Show right-click context menu
    showRibbonContextMenu(evt) {
        console.log('ZIP-Myl: Creating context menu at position:', evt.clientX, evt.clientY);
        // Remove existing context menu
        const existingMenu = document.querySelector('.zip-myl-context-menu');
        if (existingMenu) {
            existingMenu.remove();
            console.log('ZIP-Myl: Removed existing context menu');
        }
        // Create context menu
        const contextMenu = document.createElement('div');
        contextMenu.addClass('zip-myl-context-menu');
        contextMenu.innerHTML = this.generateContextMenuContent();
        console.log('ZIP-Myl: Context menu HTML generated');
        // Position menu at cursor
        contextMenu.style.position = 'fixed';
        contextMenu.style.left = `${evt.clientX}px`;
        contextMenu.style.top = `${evt.clientY}px`;
        contextMenu.style.zIndex = '999999';
        contextMenu.style.backgroundColor = '#2d2d2d';
        contextMenu.style.border = '2px solid #4a4a4a';
        contextMenu.style.borderRadius = '8px';
        contextMenu.style.padding = '8px';
        contextMenu.style.minWidth = '200px';
        contextMenu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
        contextMenu.style.color = '#ffffff';
        contextMenu.style.fontFamily = 'Arial, sans-serif';
        contextMenu.style.fontSize = '14px';
        // Add to document
        document.body.appendChild(contextMenu);
        console.log('ZIP-Myl: Context menu added to document, element:', contextMenu);
        // Auto-hide when clicking outside
        const hideMenu = (e) => {
            if (!contextMenu.contains(e.target)) {
                contextMenu.remove();
                document.removeEventListener('click', hideMenu);
            }
        };
        // Delay to prevent immediate hiding
        setTimeout(() => {
            document.addEventListener('click', hideMenu);
        }, 100);
        // Add event listeners for menu items
        this.setupContextMenuEvents(contextMenu);
    }
    // Generate context menu content
    generateContextMenuContent() {
        return `
			<div class="zip-myl-context-menu-header">
				<div class="zip-myl-context-menu-title">ZIP-Myl Plugin</div>
				<div class="zip-myl-context-menu-status">Status: ${this.settings.enableTypingAwareService ? '🟢 Active' : '🔴 Inactive'}</div>
			</div>
			<div class="zip-myl-context-menu-separator"></div>
			<div class="zip-myl-context-menu-item" data-action="settings">
				⚙️ Plugin Settings
			</div>
			<div class="zip-myl-context-menu-item" data-action="quick-settings">
				🔧 Quick Settings
			</div>
			<div class="zip-myl-context-menu-item" data-action="dashboard">
				📊 Productivity Dashboard
			</div>
			<div class="zip-myl-context-menu-separator"></div>
			<div class="zip-myl-context-menu-toggle">
				<div class="zip-myl-toggle-label">
					<span>Typing Service</span>
					<label class="zip-myl-toggle-switch">
						<input type="checkbox" ${this.settings.enableTypingAwareService ? 'checked' : ''} data-setting="enableTypingAwareService">
						<span class="zip-myl-toggle-slider"></span>
					</label>
				</div>
			</div>
			<div class="zip-myl-context-menu-toggle">
				<div class="zip-myl-toggle-label">
					<span>Run-on Detection</span>
					<label class="zip-myl-toggle-switch">
						<input type="checkbox" ${this.settings.enableRunOnThoughtDetection ? 'checked' : ''} data-setting="enableRunOnThoughtDetection">
						<span class="zip-myl-toggle-slider"></span>
					</label>
				</div>
			</div>
			<div class="zip-myl-context-menu-toggle">
				<div class="zip-myl-toggle-label">
					<span>Visual Indicators</span>
					<label class="zip-myl-toggle-switch">
						<input type="checkbox" ${this.settings.enableCursorProximityIndicators ? 'checked' : ''} data-setting="enableCursorProximityIndicators">
						<span class="zip-myl-toggle-slider"></span>
					</label>
				</div>
			</div>
			<div class="zip-myl-context-menu-separator"></div>
			<div class="zip-myl-context-menu-item" data-action="reset">
				🔄 Reset Typing Counter
			</div>
			<div class="zip-myl-context-menu-item" data-action="help">
				❓ Help & Documentation
			</div>
		`;
    }
    // Setup context menu event listeners
    setupContextMenuEvents(menu) {
        // Handle regular menu items
        const items = menu.querySelectorAll('.zip-myl-context-menu-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                if (action) {
                    this.handleContextMenuAction(action);
                }
                menu.remove();
            });
        });
        // Handle toggle switches
        const toggles = menu.querySelectorAll('.zip-myl-context-menu-toggle input[type="checkbox"]');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', async (e) => {
                const setting = e.target.dataset.setting;
                const value = e.target.checked;
                if (setting) {
                    await this.handleToggleSetting(setting, value);
                }
            });
        });
    }
    // Handle context menu actions
    handleContextMenuAction(action) {
        switch (action) {
            case 'settings':
                this.openSettingsPage();
                break;
            case 'quick-settings':
                this.openQuickSettingsPanel();
                break;
            case 'dashboard':
                this.openZipMylModal();
                break;
            case 'reset':
                this.resetTypingCount();
                new obsidian_1.Notice('Typing counter reset');
                break;
            case 'help':
                this.showHelpDocumentation();
                break;
        }
    }
    // Handle toggle setting changes
    async handleToggleSetting(setting, value) {
        switch (setting) {
            case 'enableTypingAwareService':
                this.settings.enableTypingAwareService = value;
                break;
            case 'enableRunOnThoughtDetection':
                this.settings.enableRunOnThoughtDetection = value;
                break;
            case 'enableCursorProximityIndicators':
                this.settings.enableCursorProximityIndicators = value;
                break;
        }
        await this.saveSettings();
        // Update status display
        const statusEl = this.ribbonIconEl.querySelector('.zip-myl-context-menu-status');
        if (statusEl) {
            statusEl.textContent = `Status: ${this.settings.enableTypingAwareService ? '🟢 Active' : '🔴 Inactive'}`;
        }
        // Show feedback
        const settingName = setting.replace('enable', '').replace(/([A-Z])/g, ' $1').trim();
        new obsidian_1.Notice(`${settingName} ${value ? 'enabled' : 'disabled'}`);
    }
    // Toggle run-on thought detection
    toggleRunOnThoughtDetection() {
        this.settings.enableRunOnThoughtDetection = !this.settings.enableRunOnThoughtDetection;
        this.saveSettings();
        const status = this.settings.enableRunOnThoughtDetection ? 'enabled' : 'disabled';
        new obsidian_1.Notice(`Run-on Thought Detection ${status}`);
    }
    // Toggle cursor proximity indicators
    toggleCursorProximityIndicators() {
        this.settings.enableCursorProximityIndicators = !this.settings.enableCursorProximityIndicators;
        this.saveSettings();
        const status = this.settings.enableCursorProximityIndicators ? 'enabled' : 'disabled';
        new obsidian_1.Notice(`Cursor Proximity Indicators ${status}`);
    }
    // Open dedicated settings page
    openSettingsPage() {
        const settingsPage = new ZipMylSettingsPage(this.app, this);
        settingsPage.open();
    }
    // Open quick settings panel
    openQuickSettingsPanel() {
        const quickSettings = new QuickSettingsPanel(this.app, this);
        quickSettings.open();
    }
    // Show help documentation
    showHelpDocumentation() {
        const helpModal = new ZipMylHelpModal(this.app, this);
        helpModal.open();
    }
}
exports.default = MyPlugin;
// Cursor Proximity Indicator Class for Run-on Thought Detection
class CursorProximityIndicator {
    constructor(app, cursor, score, style) {
        this.indicatorEl = null;
        this.isVisible = false;
        this.autoHideTimer = null;
        this.isHovered = false;
        this.isFocused = false;
        this.remainingTime = 3000; // Default 3 seconds
        this.lastDistractionPoint = null;
        this.app = app;
        this.cursor = cursor;
        this.score = score;
        this.style = style;
    }
    show() {
        if (this.isVisible)
            return;
        this.createIndicator();
        this.positionIndicator();
        this.animateIndicator();
        this.setupInteractionHandlers();
        // Start auto-hide timer
        this.startAutoHideTimer();
    }
    createIndicator() {
        // Remove existing indicator
        if (this.indicatorEl) {
            document.body.removeChild(this.indicatorEl);
        }
        // Create indicator element
        this.indicatorEl = document.createElement('div');
        this.indicatorEl.addClass('zip-myl-cursor-indicator');
        this.indicatorEl.addClass(`zip-myl-indicator-${this.style}`);
        // Set severity-based styling
        const severity = this.score > 70 ? 'high' : this.score > 40 ? 'medium' : 'low';
        this.indicatorEl.addClass(`zip-myl-severity-${severity}`);
        // Add content
        this.indicatorEl.innerHTML = `
			<div class="zip-myl-indicator-content">
				<div class="zip-myl-indicator-icon">⚠️</div>
				<div class="zip-myl-indicator-text">Run-on Thought Detected</div>
				<div class="zip-myl-indicator-score">${this.score}%</div>
			</div>
		`;
        // Add to document
        document.body.appendChild(this.indicatorEl);
        this.isVisible = true;
    }
    positionIndicator() {
        if (!this.indicatorEl)
            return;
        // Get cursor position from active editor
        const activeView = this.app.workspace.getActiveViewOfType(obsidian_1.MarkdownView);
        if (!activeView)
            return;
        const editor = activeView.editor;
        const coords = editor.coordsAtPos(this.cursor);
        if (coords) {
            // Position indicator near cursor
            const indicatorRect = this.indicatorEl.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;
            let top = coords.top - indicatorRect.height - 10; // Above cursor
            let left = coords.left;
            // Adjust if indicator would go off-screen
            if (top < 20) {
                top = coords.top + 30; // Below cursor
            }
            if (left + indicatorRect.width > windowWidth) {
                left = windowWidth - indicatorRect.width - 20;
            }
            if (left < 20) {
                left = 20;
            }
            this.indicatorEl.style.top = `${top}px`;
            this.indicatorEl.style.left = `${left}px`;
        }
    }
    animateIndicator() {
        if (!this.indicatorEl)
            return;
        // Add entrance animation
        this.indicatorEl.style.opacity = '0';
        this.indicatorEl.style.transform = 'scale(0.8)';
        setTimeout(() => {
            if (this.indicatorEl) {
                this.indicatorEl.style.opacity = '1';
                this.indicatorEl.style.transform = 'scale(1)';
            }
        }, 10);
    }
    hide() {
        if (!this.indicatorEl || !this.isVisible)
            return;
        this.clearAutoHideTimer();
        this.indicatorEl.style.opacity = '0';
        this.indicatorEl.style.transform = 'scale(0.8)';
        setTimeout(() => {
            if (this.indicatorEl && this.indicatorEl.parentNode) {
                this.indicatorEl.parentNode.removeChild(this.indicatorEl);
            }
            this.indicatorEl = null;
            this.isVisible = false;
        }, 300);
    }
    destroy() {
        this.hide();
    }
    setupInteractionHandlers() {
        if (!this.indicatorEl)
            return;
        // Mouse enter/leave handlers
        this.indicatorEl.addEventListener('mouseenter', () => {
            this.isHovered = true;
            this.pauseAutoHideTimer();
        });
        this.indicatorEl.addEventListener('mouseleave', (e) => {
            this.isHovered = false;
            // Store the last distraction point (where mouse left)
            this.lastDistractionPoint = { x: e.clientX, y: e.clientY };
            this.resumeAutoHideTimer();
        });
        // Focus/blur handlers for keyboard navigation
        this.indicatorEl.addEventListener('focus', () => {
            this.isFocused = true;
            this.pauseAutoHideTimer();
        });
        this.indicatorEl.addEventListener('blur', () => {
            this.isFocused = false;
            this.resumeAutoHideTimer();
        });
        // Make the indicator focusable
        this.indicatorEl.setAttribute('tabindex', '0');
    }
    startAutoHideTimer() {
        this.clearAutoHideTimer();
        this.remainingTime = 3000; // Reset to 3 seconds
        this.autoHideTimer = setTimeout(() => {
            this.hide();
        }, this.remainingTime);
    }
    pauseAutoHideTimer() {
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
            this.autoHideTimer = null;
        }
    }
    resumeAutoHideTimer() {
        // Only resume if not hovered or focused
        if (!this.isHovered && !this.isFocused && this.remainingTime > 0) {
            this.autoHideTimer = setTimeout(() => {
                this.hide();
            }, this.remainingTime);
        }
    }
    clearAutoHideTimer() {
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
            this.autoHideTimer = null;
        }
    }
}
// Popup Overlay Class
class PopupOverlay {
    constructor(app, analysis, duration) {
        this.overlayEl = null;
        this.isVisible = false;
        this.autoHideTimer = null;
        this.isHovered = false;
        this.isFocused = false;
        this.remainingTime = 0;
        this.lastDistractionPoint = null;
        this.app = app;
        this.analysis = analysis;
        this.duration = duration;
    }
    async show() {
        if (this.isVisible)
            return;
        this.createOverlay();
        this.animateIn();
        this.setupInteractionHandlers();
        // Start auto-hide timer
        this.startAutoHideTimer();
    }
    createOverlay() {
        // Remove existing overlay
        if (this.overlayEl) {
            document.body.removeChild(this.overlayEl);
        }
        // Create overlay container
        this.overlayEl = document.createElement('div');
        this.overlayEl.addClass('zip-myl-popup-overlay');
        this.overlayEl.innerHTML = this.generateOverlayContent();
        // Position overlay near cursor
        this.positionOverlay();
        // Add to document
        document.body.appendChild(this.overlayEl);
        this.isVisible = true;
    }
    generateOverlayContent() {
        const confidenceColor = this.analysis.confidence > 0.7 ? '#4CAF50' :
            this.analysis.confidence > 0.5 ? '#FF9800' : '#F44336';
        const runOnThoughtClass = this.analysis.isRunOnThought ? 'run-on-thought' : '';
        const severityClass = this.analysis.isRunOnThought ? `severity-${this.analysis.runOnThoughtSeverity}` : '';
        return `
			<div class="zip-myl-overlay-header ${runOnThoughtClass} ${severityClass}">
				<div class="zip-myl-overlay-icon">${this.analysis.isRunOnThought ? '⚠️' : '🎯'}</div>
				<div class="zip-myl-overlay-title">
					${this.analysis.isRunOnThought ? 'Run-on Thought Detected' : 'ZIP-Myl Assistant'}
				</div>
				<div class="zip-myl-overlay-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</div>
			</div>
			<div class="zip-myl-overlay-content">
				<div class="zip-myl-overlay-context">
					<strong>Context:</strong> ${this.analysis.context}
				</div>
				<div class="zip-myl-overlay-confidence">
					<strong>Confidence:</strong> 
					<span style="color: ${confidenceColor}">${Math.round(this.analysis.confidence * 100)}%</span>
				</div>
				${this.analysis.isRunOnThought ? `
				<div class="zip-myl-overlay-severity">
					<strong>Severity:</strong> 
					<span class="severity-${this.analysis.runOnThoughtSeverity}">${this.analysis.runOnThoughtSeverity.toUpperCase()}</span>
				</div>
				` : ''}
				<div class="zip-myl-overlay-suggestion">
					<strong>Suggestion:</strong><br>
					${this.analysis.suggestedResponse}
				</div>
			</div>
			<div class="zip-myl-overlay-actions">
				<button class="zip-myl-overlay-btn zip-myl-overlay-btn-primary" onclick="this.closest('.zip-myl-popup-overlay').remove()">
					Got it!
				</button>
				<button class="zip-myl-overlay-btn zip-myl-overlay-btn-secondary" onclick="this.closest('.zip-myl-popup-overlay').remove()">
					Ignore
				</button>
			</div>
		`;
    }
    positionOverlay() {
        if (!this.overlayEl)
            return;
        // Get cursor position from active editor
        const activeView = this.app.workspace.getActiveViewOfType(obsidian_1.MarkdownView);
        if (!activeView) {
            // Fallback to center of screen
            this.overlayEl.style.top = '50%';
            this.overlayEl.style.left = '50%';
            this.overlayEl.style.transform = 'translate(-50%, -50%)';
            return;
        }
        const editor = activeView.editor;
        const cursor = editor.getCursor();
        const coords = editor.coordsAtPos(cursor);
        if (coords) {
            // Position overlay near cursor
            const overlayRect = this.overlayEl.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;
            let top = coords.top + 30; // Below cursor
            let left = coords.left;
            // Adjust if overlay would go off-screen
            if (top + overlayRect.height > windowHeight) {
                top = coords.top - overlayRect.height - 10; // Above cursor
            }
            if (left + overlayRect.width > windowWidth) {
                left = windowWidth - overlayRect.width - 20;
            }
            if (left < 20) {
                left = 20;
            }
            this.overlayEl.style.top = `${top}px`;
            this.overlayEl.style.left = `${left}px`;
            this.overlayEl.style.transform = 'none';
        }
    }
    animateIn() {
        if (!this.overlayEl)
            return;
        this.overlayEl.style.opacity = '0';
        this.overlayEl.style.transform = 'scale(0.8)';
        // Trigger animation
        setTimeout(() => {
            if (this.overlayEl) {
                this.overlayEl.style.opacity = '1';
                this.overlayEl.style.transform = 'scale(1)';
            }
        }, 10);
    }
    hide() {
        if (!this.overlayEl || !this.isVisible)
            return;
        this.clearAutoHideTimer();
        this.overlayEl.style.opacity = '0';
        this.overlayEl.style.transform = 'scale(0.8)';
        setTimeout(() => {
            if (this.overlayEl && this.overlayEl.parentNode) {
                this.overlayEl.parentNode.removeChild(this.overlayEl);
            }
            this.overlayEl = null;
            this.isVisible = false;
        }, 300);
    }
    destroy() {
        this.hide();
    }
    setupInteractionHandlers() {
        if (!this.overlayEl)
            return;
        // Mouse enter/leave handlers
        this.overlayEl.addEventListener('mouseenter', () => {
            this.isHovered = true;
            this.pauseAutoHideTimer();
        });
        this.overlayEl.addEventListener('mouseleave', (e) => {
            this.isHovered = false;
            // Store the last distraction point (where mouse left)
            this.lastDistractionPoint = { x: e.clientX, y: e.clientY };
            this.resumeAutoHideTimer();
        });
        // Focus/blur handlers for keyboard navigation
        this.overlayEl.addEventListener('focus', () => {
            this.isFocused = true;
            this.pauseAutoHideTimer();
        });
        this.overlayEl.addEventListener('blur', () => {
            this.isFocused = false;
            this.resumeAutoHideTimer();
        });
        // Make the overlay focusable
        this.overlayEl.setAttribute('tabindex', '0');
    }
    startAutoHideTimer() {
        this.clearAutoHideTimer();
        this.remainingTime = this.duration;
        this.autoHideTimer = setTimeout(() => {
            this.hide();
        }, this.remainingTime);
    }
    pauseAutoHideTimer() {
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
            this.autoHideTimer = null;
        }
    }
    resumeAutoHideTimer() {
        // Only resume if not hovered or focused
        if (!this.isHovered && !this.isFocused && this.remainingTime > 0) {
            this.autoHideTimer = setTimeout(() => {
                this.hide();
            }, this.remainingTime);
        }
    }
    clearAutoHideTimer() {
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
            this.autoHideTimer = null;
        }
    }
}
// ZIP-Myl Modal Class
class ZipMylModal extends obsidian_1.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.app = app;
        this.plugin = plugin;
    }
    open() {
        const modal = new this.app.Modal(this.app);
        modal.titleEl.setText('ZIP-Myl - Productivity Dashboard');
        const content = modal.contentEl;
        content.empty();
        content.addClass('zip-myl-modal');
        // Current status
        const statusEl = content.createEl('div', { cls: 'modal-content' });
        statusEl.innerHTML = `
			<h3>Current Status</h3>
			<p><strong>Typing Count:</strong> ${this.plugin.typingCount}</p>
			<p><strong>Activity Level:</strong> ${this.getActivityLevel()}</p>
			<p><strong>Recommendation:</strong> ${this.getRecommendation()}</p>
			<p><strong>Typing-Aware Service:</strong> ${this.plugin.settings.enableTypingAwareService ? 'Active' : 'Inactive'}</p>
			<p><strong>Run-on Thought Detection:</strong> ${this.plugin.settings.enableRunOnThoughtDetection ? 'Active' : 'Inactive'}</p>
		`;
        // Actions
        const actionsEl = content.createEl('div', { cls: 'modal-actions' });
        const resetBtn = actionsEl.createEl('button', { text: 'Reset Counter' });
        resetBtn.addEventListener('click', () => {
            this.plugin.resetTypingCount();
            modal.close();
        });
        const toggleBtn = actionsEl.createEl('button', { text: this.plugin.settings.enableTypingAwareService ? 'Disable Service' : 'Enable Service' });
        toggleBtn.addEventListener('click', () => {
            this.plugin.toggleTypingAwareService();
            modal.close();
        });
        const closeBtn = actionsEl.createEl('button', { text: 'Close', cls: 'secondary' });
        closeBtn.addEventListener('click', () => modal.close());
    }
    getActivityLevel() {
        if (this.plugin.typingCount === 0)
            return 'Ready';
        if (this.plugin.typingCount < this.plugin.settings.typingThreshold)
            return 'Active';
        return 'High Activity';
    }
    getRecommendation() {
        if (this.plugin.typingCount === 0)
            return 'Ready to work!';
        if (this.plugin.typingCount < this.plugin.settings.typingThreshold)
            return 'Good pace, keep going!';
        return 'Consider taking a breather before switching tasks.';
    }
    display() {
        // This is required by the interface but not used for the modal
    }
}
class MySettingTab extends obsidian_1.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('zip-myl-settings');
        containerEl.createEl('h2', { text: 'ZIP-Myl Plugin Settings' });
        // Typing threshold setting
        new obsidian_1.Setting(containerEl)
            .setName('Typing Threshold')
            .setDesc('Number of keystrokes before considering high activity')
            .addSlider((slider) => slider
            .setLimits(50, 200, 10)
            .setValue(this.plugin.settings.typingThreshold)
            .setDynamicTooltip()
            .onChange(async (value) => {
            this.plugin.settings.typingThreshold = value;
            await this.plugin.saveSettings();
        }));
        // Left hand shortcut
        new obsidian_1.Setting(containerEl)
            .setName('Left Hand Shortcut')
            .setDesc('Keyboard shortcut for left hand action (Ctrl+Shift+Z)')
            .addText((text) => text
            .setPlaceholder('Ctrl+Shift+Z')
            .setValue(this.plugin.settings.leftHandShortcut)
            .onChange(async (value) => {
            this.plugin.settings.leftHandShortcut = value;
            await this.plugin.saveSettings();
        }));
        // Right hand shortcut
        new obsidian_1.Setting(containerEl)
            .setName('Right Hand Shortcut')
            .setDesc('Keyboard shortcut for right hand action (Ctrl+Shift+M)')
            .addText((text) => text
            .setPlaceholder('Ctrl+Shift+M')
            .setValue(this.plugin.settings.rightHandShortcut)
            .onChange(async (value) => {
            this.plugin.settings.rightHandShortcut = value;
            await this.plugin.saveSettings();
        }));
        // Enable typing indicator
        new obsidian_1.Setting(containerEl)
            .setName('Enable Typing Indicator')
            .setDesc('Show color changes based on typing activity')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.enableTypingIndicator)
            .onChange(async (value) => {
            this.plugin.settings.enableTypingIndicator = value;
            await this.plugin.saveSettings();
        }));
        // Enable click actions
        new obsidian_1.Setting(containerEl)
            .setName('Enable Click Actions')
            .setDesc('Allow ribbon icon clicks to show status')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.enableClickActions)
            .onChange(async (value) => {
            this.plugin.settings.enableClickActions = value;
            await this.plugin.saveSettings();
        }));
        // Typing-Aware Service section
        containerEl.createEl('h3', { text: 'Typing-Aware Service' });
        // Enable typing-aware service
        new obsidian_1.Setting(containerEl)
            .setName('Enable Typing-Aware Service')
            .setDesc('Monitor typing activity and provide intelligent feedback')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.enableTypingAwareService)
            .onChange(async (value) => {
            this.plugin.settings.enableTypingAwareService = value;
            await this.plugin.saveSettings();
        }));
        // Typing analysis delay
        new obsidian_1.Setting(containerEl)
            .setName('Typing Analysis Delay')
            .setDesc('Delay in milliseconds before analyzing typed content')
            .addSlider((slider) => slider
            .setLimits(100, 2000, 100)
            .setValue(this.plugin.settings.typingAnalysisDelay)
            .setDynamicTooltip()
            .onChange(async (value) => {
            this.plugin.settings.typingAnalysisDelay = value;
            await this.plugin.saveSettings();
        }));
        // Enable popup overlay
        new obsidian_1.Setting(containerEl)
            .setName('Enable Popup Overlay')
            .setDesc('Show attention-grabbing popup overlays when assistance is needed')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.enablePopupOverlay)
            .onChange(async (value) => {
            this.plugin.settings.enablePopupOverlay = value;
            await this.plugin.saveSettings();
        }));
        // Overlay animation duration
        new obsidian_1.Setting(containerEl)
            .setName('Overlay Duration')
            .setDesc('How long popup overlays stay visible (milliseconds)')
            .addSlider((slider) => slider
            .setLimits(1000, 10000, 500)
            .setValue(this.plugin.settings.overlayAnimationDuration)
            .setDynamicTooltip()
            .onChange(async (value) => {
            this.plugin.settings.overlayAnimationDuration = value;
            await this.plugin.saveSettings();
        }));
        // Enable sound feedback
        new obsidian_1.Setting(containerEl)
            .setName('Enable Sound Feedback')
            .setDesc('Play attention sounds when assistance is triggered')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.enableSoundFeedback)
            .onChange(async (value) => {
            this.plugin.settings.enableSoundFeedback = value;
            await this.plugin.saveSettings();
        }));
        // Enable visual feedback
        new obsidian_1.Setting(containerEl)
            .setName('Enable Visual Feedback')
            .setDesc('Show visual effects when assistance is triggered')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.enableVisualFeedback)
            .onChange(async (value) => {
            this.plugin.settings.enableVisualFeedback = value;
            await this.plugin.saveSettings();
        }));
        // Auto-insert responses
        new obsidian_1.Setting(containerEl)
            .setName('Auto-Insert Responses')
            .setDesc('Automatically insert suggested responses into the document')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.autoInsertResponses)
            .onChange(async (value) => {
            this.plugin.settings.autoInsertResponses = value;
            await this.plugin.saveSettings();
        }));
        // Response trigger keywords
        new obsidian_1.Setting(containerEl)
            .setName('Response Trigger Keywords')
            .setDesc('Comma-separated keywords that trigger assistance (e.g., help, assist, guide)')
            .addText((text) => text
            .setPlaceholder('help, assist, guide, suggest, recommend')
            .setValue(this.plugin.settings.responseTriggerKeywords.join(', '))
            .onChange(async (value) => {
            this.plugin.settings.responseTriggerKeywords = value.split(',').map(k => k.trim()).filter(k => k.length > 0);
            await this.plugin.saveSettings();
        }));
        // Run-on Thought Detection section
        containerEl.createEl('h3', { text: 'Run-on Thought Detection' });
        // Enable run-on thought detection
        new obsidian_1.Setting(containerEl)
            .setName('Enable Run-on Thought Detection')
            .setDesc('Detect and alert when writing becomes too verbose or unstructured')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.enableRunOnThoughtDetection)
            .onChange(async (value) => {
            this.plugin.settings.enableRunOnThoughtDetection = value;
            await this.plugin.saveSettings();
        }));
        // Run-on thought threshold
        new obsidian_1.Setting(containerEl)
            .setName('Run-on Thought Threshold')
            .setDesc('Sensitivity level for detecting run-on thoughts (lower = more sensitive)')
            .addSlider((slider) => slider
            .setLimits(20, 100, 5)
            .setValue(this.plugin.settings.runOnThoughtThreshold)
            .setDynamicTooltip()
            .onChange(async (value) => {
            this.plugin.settings.runOnThoughtThreshold = value;
            await this.plugin.saveSettings();
        }));
        // Enable cursor proximity indicators
        new obsidian_1.Setting(containerEl)
            .setName('Enable Cursor Proximity Indicators')
            .setDesc('Show visual indicators near your cursor for run-on thoughts')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.enableCursorProximityIndicators)
            .onChange(async (value) => {
            this.plugin.settings.enableCursorProximityIndicators = value;
            await this.plugin.saveSettings();
        }));
        // Proximity indicator style
        new obsidian_1.Setting(containerEl)
            .setName('Indicator Style')
            .setDesc('Visual style for cursor proximity indicators')
            .addDropdown((dropdown) => dropdown
            .addOption('pulse', 'Pulse')
            .addOption('glow', 'Glow')
            .addOption('ripple', 'Ripple')
            .addOption('bounce', 'Bounce')
            .setValue(this.plugin.settings.proximityIndicatorStyle)
            .onChange(async (value) => {
            this.plugin.settings.proximityIndicatorStyle = value;
            await this.plugin.saveSettings();
        }));
    }
}
// ZIP-Myl Settings Page Class
class ZipMylSettingsPage extends obsidian_1.Modal {
    constructor(app, plugin) {
        super(app);
        this.app = app;
        this.plugin = plugin;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('zip-myl-settings-page');
        // Header
        const header = contentEl.createEl('div', { cls: 'zip-myl-settings-header' });
        header.createEl('h2', { text: 'ZIP-Myl Settings' });
        header.createEl('p', { text: 'Configure your productivity assistant' });
        // Main content
        const main = contentEl.createEl('div', { cls: 'zip-myl-settings-main' });
        // Statistics section
        const stats = main.createEl('div', { cls: 'zip-myl-settings-stats' });
        stats.createEl('h3', { text: 'Current Statistics' });
        const statGrid = stats.createEl('div', { cls: 'zip-myl-stat-grid' });
        this.createStatItem(statGrid, 'Total Typing', this.plugin.typingCount.toString());
        this.createStatItem(statGrid, 'Session Time', this.getSessionTime());
        this.createStatItem(statGrid, 'Activity Level', this.getActivityLevel());
        this.createStatItem(statGrid, 'Service Status', this.plugin.settings.enableTypingAwareService ? 'Active' : 'Inactive');
        // General Settings section
        this.createSettingsSection(main, 'General Settings', [
            {
                name: 'Typing Threshold',
                desc: 'Number of keystrokes before considering high activity',
                type: 'slider',
                value: this.plugin.settings.typingThreshold,
                min: 50,
                max: 200,
                step: 10,
                onChange: async (value) => {
                    this.plugin.settings.typingThreshold = value;
                    await this.plugin.saveSettings();
                }
            },
            {
                name: 'Enable Typing-Aware Service',
                desc: 'Monitor typing activity and provide intelligent feedback',
                type: 'toggle',
                value: this.plugin.settings.enableTypingAwareService,
                onChange: async (value) => {
                    this.plugin.settings.enableTypingAwareService = value;
                    await this.plugin.saveSettings();
                }
            }
        ]);
        // Run-on Thought Detection section
        this.createSettingsSection(main, 'Run-on Thought Detection', [
            {
                name: 'Enable Run-on Thought Detection',
                desc: 'Detect verbose writing patterns and suggest breaks',
                type: 'toggle',
                value: this.plugin.settings.enableRunOnThoughtDetection,
                onChange: async (value) => {
                    this.plugin.settings.enableRunOnThoughtDetection = value;
                    await this.plugin.saveSettings();
                }
            },
            {
                name: 'Run-on Thought Threshold',
                desc: 'Minimum characters before detecting run-on thoughts',
                type: 'slider',
                value: this.plugin.settings.runOnThoughtThreshold,
                min: 100,
                max: 500,
                step: 25,
                onChange: async (value) => {
                    this.plugin.settings.runOnThoughtThreshold = value;
                    await this.plugin.saveSettings();
                }
            }
        ]);
        // Cursor Proximity section
        this.createSettingsSection(main, 'Cursor Proximity Indicators', [
            {
                name: 'Enable Cursor Proximity Indicators',
                desc: 'Show visual indicators near the cursor for feedback',
                type: 'toggle',
                value: this.plugin.settings.enableCursorProximityIndicators,
                onChange: async (value) => {
                    this.plugin.settings.enableCursorProximityIndicators = value;
                    await this.plugin.saveSettings();
                }
            },
            {
                name: 'Proximity Indicator Style',
                desc: 'Visual style for cursor proximity indicators',
                type: 'dropdown',
                value: this.plugin.settings.proximityIndicatorStyle,
                options: [
                    { value: 'pulse', label: 'Pulse' },
                    { value: 'glow', label: 'Glow' },
                    { value: 'bounce', label: 'Bounce' }
                ],
                onChange: async (value) => {
                    this.plugin.settings.proximityIndicatorStyle = value;
                    await this.plugin.saveSettings();
                }
            }
        ]);
        // Feedback Settings section
        this.createSettingsSection(main, 'Feedback Settings', [
            {
                name: 'Enable Sound Feedback',
                desc: 'Play sounds for typing milestones and alerts',
                type: 'toggle',
                value: this.plugin.settings.enableSoundFeedback,
                onChange: async (value) => {
                    this.plugin.settings.enableSoundFeedback = value;
                    await this.plugin.saveSettings();
                }
            },
            {
                name: 'Sound Volume',
                desc: 'Volume level for sound feedback (0-100)',
                type: 'slider',
                value: this.plugin.settings.soundVolume,
                min: 0,
                max: 100,
                step: 5,
                onChange: async (value) => {
                    this.plugin.settings.soundVolume = value;
                    await this.plugin.saveSettings();
                }
            },
            {
                name: 'Enable Visual Feedback',
                desc: 'Show visual effects for typing milestones and alerts',
                type: 'toggle',
                value: this.plugin.settings.enableVisualFeedback,
                onChange: async (value) => {
                    this.plugin.settings.enableVisualFeedback = value;
                    await this.plugin.saveSettings();
                }
            },
            {
                name: 'Popup Overlay Duration',
                desc: 'How long to show popup overlays (milliseconds)',
                type: 'slider',
                value: this.plugin.settings.popupOverlayDuration,
                min: 1000,
                max: 5000,
                step: 500,
                onChange: async (value) => {
                    this.plugin.settings.popupOverlayDuration = value;
                    await this.plugin.saveSettings();
                }
            }
        ]);
        // Actions section
        const actions = main.createEl('div', { cls: 'zip-myl-settings-actions' });
        const resetBtn = actions.createEl('button', { text: 'Reset Counter', cls: 'zip-myl-btn zip-myl-btn-secondary' });
        resetBtn.addEventListener('click', () => {
            this.plugin.resetTypingCount();
            this.close();
        });
        const closeBtn = actions.createEl('button', { text: 'Close', cls: 'zip-myl-btn' });
        closeBtn.addEventListener('click', () => this.close());
    }
    createStatItem(container, label, value) {
        const item = container.createEl('div', { cls: 'zip-myl-stat-item' });
        item.createEl('div', { text: value, cls: 'zip-myl-stat-value' });
        item.createEl('div', { text: label, cls: 'zip-myl-stat-label' });
    }
    createSettingsSection(container, title, settings) {
        const section = container.createEl('div', { cls: 'zip-myl-settings-section' });
        section.createEl('h3', { text: title });
        settings.forEach(setting => {
            const settingEl = section.createEl('div', { cls: 'zip-myl-setting-item' });
            if (setting.type === 'toggle') {
                const toggle = settingEl.createEl('input', { type: 'checkbox' });
                toggle.checked = setting.value;
                toggle.addEventListener('change', (e) => setting.onChange(e.target.checked));
                const label = settingEl.createEl('label');
                label.createEl('strong', { text: setting.name });
                label.createEl('p', { text: setting.desc });
            }
            else if (setting.type === 'slider') {
                const label = settingEl.createEl('label');
                label.createEl('strong', { text: setting.name });
                label.createEl('p', { text: setting.desc });
                const slider = settingEl.createEl('input', { type: 'range' });
                slider.min = setting.min.toString();
                slider.max = setting.max.toString();
                slider.step = setting.step.toString();
                slider.value = setting.value.toString();
                slider.addEventListener('input', (e) => setting.onChange(parseInt(e.target.value)));
                const value = settingEl.createEl('span', { text: setting.value.toString() });
                slider.addEventListener('input', (e) => value.setText(e.target.value));
            }
            else if (setting.type === 'dropdown') {
                const label = settingEl.createEl('label');
                label.createEl('strong', { text: setting.name });
                label.createEl('p', { text: setting.desc });
                const select = settingEl.createEl('select');
                setting.options.forEach((option) => {
                    const optionEl = select.createEl('option', { value: option.value, text: option.label });
                    if (option.value === setting.value)
                        optionEl.selected = true;
                });
                select.addEventListener('change', (e) => setting.onChange(e.target.value));
            }
        });
    }
    getSessionTime() {
        // Simple session time calculation
        const now = Date.now();
        const start = this.plugin.startTime || now;
        const diff = now - start;
        const minutes = Math.floor(diff / 60000);
        return `${minutes} min`;
    }
    getActivityLevel() {
        if (this.plugin.typingCount === 0)
            return 'Ready';
        if (this.plugin.typingCount < this.plugin.settings.typingThreshold)
            return 'Active';
        return 'High Activity';
    }
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
// Quick Settings Panel Class
class QuickSettingsPanel extends obsidian_1.Modal {
    constructor(app, plugin) {
        super(app);
        this.app = app;
        this.plugin = plugin;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('zip-myl-quick-settings');
        // Header
        const header = contentEl.createEl('div', { cls: 'zip-myl-quick-header' });
        header.createEl('h3', { text: 'Quick Settings' });
        header.createEl('p', { text: 'Quick access to common settings' });
        // Main services section
        const mainSection = contentEl.createEl('div', { cls: 'zip-myl-quick-section' });
        mainSection.createEl('h4', { text: 'Main Services' });
        // Typing-aware service toggle
        const serviceToggle = mainSection.createEl('div', { cls: 'zip-myl-quick-toggle' });
        serviceToggle.createEl('span', { text: 'Typing-Aware Service' });
        const serviceCheckbox = serviceToggle.createEl('input', { type: 'checkbox' });
        serviceCheckbox.checked = this.plugin.settings.enableTypingAwareService;
        serviceCheckbox.addEventListener('change', async (e) => {
            this.plugin.settings.enableTypingAwareService = e.target.checked;
            await this.plugin.saveSettings();
        });
        // Run-on thought detection toggle
        const runOnToggle = mainSection.createEl('div', { cls: 'zip-myl-quick-toggle' });
        runOnToggle.createEl('span', { text: 'Run-on Thought Detection' });
        const runOnCheckbox = runOnToggle.createEl('input', { type: 'checkbox' });
        runOnCheckbox.checked = this.plugin.settings.enableRunOnThoughtDetection;
        runOnCheckbox.addEventListener('change', async (e) => {
            this.plugin.settings.enableRunOnThoughtDetection = e.target.checked;
            await this.plugin.saveSettings();
        });
        // Cursor proximity indicators toggle
        const cursorToggle = mainSection.createEl('div', { cls: 'zip-myl-quick-toggle' });
        cursorToggle.createEl('span', { text: 'Cursor Proximity Indicators' });
        const cursorCheckbox = cursorToggle.createEl('input', { type: 'checkbox' });
        cursorCheckbox.checked = this.plugin.settings.enableCursorProximityIndicators;
        cursorCheckbox.addEventListener('change', async (e) => {
            this.plugin.settings.enableCursorProximityIndicators = e.target.checked;
            await this.plugin.saveSettings();
        });
        // Quick actions section
        const actionsSection = contentEl.createEl('div', { cls: 'zip-myl-quick-section' });
        actionsSection.createEl('h4', { text: 'Quick Actions' });
        // Reset counter button
        const resetBtn = actionsSection.createEl('button', { text: 'Reset Typing Counter', cls: 'zip-myl-quick-btn' });
        resetBtn.addEventListener('click', () => {
            this.plugin.resetTypingCount();
            this.close();
        });
        // Open full settings button
        const settingsBtn = actionsSection.createEl('button', { text: 'Open Full Settings', cls: 'zip-myl-quick-btn zip-myl-quick-btn-secondary' });
        settingsBtn.addEventListener('click', () => {
            this.close();
            this.plugin.openSettingsPage();
        });
        // Status section
        const statusSection = contentEl.createEl('div', { cls: 'zip-myl-quick-section' });
        statusSection.createEl('h4', { text: 'Current Status' });
        const statusItems = [
            { label: 'Typing Count', value: this.plugin.typingCount.toString() },
            { label: 'Service Status', value: this.plugin.settings.enableTypingAwareService ? 'Active' : 'Inactive' },
            { label: 'Run-on Detection', value: this.plugin.settings.enableRunOnThoughtDetection ? 'Active' : 'Inactive' },
            { label: 'Cursor Indicators', value: this.plugin.settings.enableCursorProximityIndicators ? 'Active' : 'Inactive' }
        ];
        statusItems.forEach(item => {
            const statusItem = statusSection.createEl('div', { cls: 'zip-myl-status-item' });
            statusItem.createEl('span', { text: item.label, cls: 'zip-myl-status-label' });
            statusItem.createEl('span', { text: item.value, cls: 'zip-myl-status-value' });
        });
        // Close button
        const closeBtn = contentEl.createEl('button', { text: 'Close', cls: 'zip-myl-quick-btn' });
        closeBtn.addEventListener('click', () => this.close());
    }
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
// ZIP-Myl Help Modal Class
class ZipMylHelpModal extends obsidian_1.Modal {
    constructor(app, plugin) {
        super(app);
        this.app = app;
        this.plugin = plugin;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('zip-myl-help-modal');
        // Header
        const header = contentEl.createEl('div', { cls: 'zip-myl-help-header' });
        header.createEl('h2', { text: 'ZIP-Myl Help & Documentation' });
        header.createEl('p', { text: 'Your guide to intelligent typing assistance' });
        // Quick Start section
        this.createHelpSection(contentEl, 'Quick Start', [
            'Enable the Typing-Aware Service in settings',
            'Start typing in any Obsidian note',
            'Watch for visual and audio feedback',
            'Use right-click on the sidebar icon for quick access',
            'Configure thresholds and preferences as needed'
        ]);
        // Key Features section
        this.createHelpSection(contentEl, 'Key Features', [
            'Real-time typing activity monitoring',
            'Intelligent run-on thought detection',
            'Cursor proximity visual indicators',
            'Customizable feedback mechanisms',
            'Right-click context menu access',
            'Comprehensive settings management'
        ]);
        // Pro Tips section
        this.createHelpSection(contentEl, 'Pro Tips', [
            'Adjust typing threshold based on your writing style',
            'Enable sound feedback for better awareness',
            'Use cursor proximity indicators for focused writing',
            'Customize popup overlay duration for your workflow',
            'Reset counter between different writing sessions'
        ]);
        // Troubleshooting section
        this.createHelpSection(contentEl, 'Troubleshooting', [
            'If feedback stops working, check service status in settings',
            'Adjust thresholds if you get too many or too few alerts',
            'Disable sound feedback if working in quiet environments',
            'Use quick settings panel for rapid configuration changes'
        ]);
        // Support section
        this.createHelpSection(contentEl, 'Support & Feedback', [
            'Check the project documentation for detailed guides',
            'Review settings to ensure optimal configuration',
            'Test features in different note contexts',
            'Provide feedback for future improvements'
        ]);
        // Close button
        const closeBtn = contentEl.createEl('button', { text: 'Got It!', cls: 'zip-myl-btn' });
        closeBtn.addEventListener('click', () => this.close());
    }
    createHelpSection(container, title, items) {
        const section = container.createEl('div', { cls: 'zip-myl-help-section' });
        section.createEl('h3', { text: title });
        const list = section.createEl('ul');
        items.forEach(item => {
            list.createEl('li', { text: item });
        });
    }
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
