const quotes = [
  "Stay focused and never give up.",
  "Deep work creates real value.",
  "Distraction is the enemy of progress.",
  "You are what you do, not what you say you'll do.",
  "One thing at a time.",
  "Great things are done by a series of small things brought together.",
  "Focus is the new IQ.",
  "You are making progress. Keep going. Every step counts.",
  "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
  "Focus on being productive instead of busy.",
  "Where focus goes, energy flows.",
  "The main thing is to keep the main thing the main thing.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Stay present, stay focused.",
  "Quality over quantity.",
  "Focus on the journey, not the destination.",
  "Small progress is still progress.",
  "Your focus determines your reality.",
  "The difference between ordinary and extraordinary is that little extra.",
  "Focus on what matters most.",
  "The power of concentration is the key to success.",
  "In the midst of chaos, find your focus.",
  "Your mind is like water. When it's agitated, it becomes difficult to see. But if you allow it to settle, the answer becomes clear.",
  "The successful warrior is the average man, with laser-like focus.",
  "Focus on the possibilities for success, not on the potential for failure.",
  "The more you focus on time, the more time seems to pass.",
  "Concentration is the secret of strength.",
  "The key to success is to focus our conscious mind on things we desire, not things we fear.",
  "When you focus on problems, you get more problems. When you focus on possibilities, you get more opportunities.",
  "The successful person is the one who can focus on the task at hand without being distracted by the noise around them.",
  "Focus on the step in front of you, not the whole staircase.",
  "The art of concentration is the art of eliminating distractions.",
  "Your focus is your reality.",
  "The main thing is to keep the main thing the main thing.",
  "Focus on the present moment, for that is where your power lies.",
  "The difference between successful people and very successful people is that very successful people say 'no' to almost everything.",
  "Focus on being productive instead of busy.",
  "The key to productivity is not working harder, but working smarter.",
  "Your focus determines your reality.",
  "The successful person is the one who can focus on the task at hand without being distracted by the noise around them.",
  "Focus on the possibilities for success, not on the potential for failure.",
  "The power of concentration is the key to success.",
  "In the midst of chaos, find your focus.",
  "Your mind is like water. When it's agitated, it becomes difficult to see. But if you allow it to settle, the answer becomes clear.",
  "The successful warrior is the average man, with laser-like focus.",
  "Focus on the possibilities for success, not on the potential for failure.",
  "The more you focus on time, the more time seems to pass.",
  "Concentration is the secret of strength.",
  "The key to success is to focus our conscious mind on things we desire, not things we fear."
]; //Quotes for rotation

// Constants for better maintainability
const TIMER_STATES = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused'
};

const DEFAULT_SESSION_LENGTH = 25;
const QUOTE_ROTATION_INTERVAL = 30000;
const MAX_MINUTES = 180;
const MAX_SECONDS = 59;
const MIN_SESSION_LENGTH = 1;

// Global variables
let timer = null;
let quoteTimer = null;
let timeLeft = DEFAULT_SESSION_LENGTH * 60;
let currentState = TIMER_STATES.IDLE;
let lastQuoteIndex = -1;
let isFocusing = false;

// DOM elements
let timerDisplay;
let startBtn;
let taskInput;
let quoteEl;
let focusContainer;
let sessionLength;
let customMinutes;
let customSeconds;

// Debug logging function with levels
const LOG_LEVELS = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
};

function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`, data || '');
}

// Error handling
class TimerError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'TimerError';
        this.code = code;
    }
}

// Accessibility functions
function updateAriaLabels() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes} minutes and ${seconds} seconds remaining`;
    
    timerDisplay.setAttribute('aria-label', timeString);
    timerDisplay.setAttribute('aria-valuenow', timeLeft);
    timerDisplay.setAttribute('aria-valuemin', 0);
    timerDisplay.setAttribute('aria-valuemax', timeLeft);
}

function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'visually-hidden';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Remove after announcement is read
    setTimeout(() => announcement.remove(), 1000);
}

// Timer functions
function updateTimerDisplay() {
    log(LOG_LEVELS.DEBUG, 'Updating timer display', { timeLeft });
    
    try {
        const min = String(Math.floor(timeLeft / 60)).padStart(2, '0');
        const sec = String(timeLeft % 60).padStart(2, '0');
        timerDisplay.textContent = `${min}:${sec}`;
        timerDisplay.style.display = 'block';
        timerDisplay.style.visibility = 'visible';
        timerDisplay.style.opacity = '1';
        updateAriaLabels();
    } catch (error) {
        log(LOG_LEVELS.ERROR, 'Error updating timer display', error);
        throw new TimerError('Failed to update timer display', 'TIMER_UPDATE_ERROR');
    }
}

function getSessionLengthSeconds() {
    try {
        const minutes = parseInt(customMinutes.value, 10) || 0;
        const seconds = parseInt(customSeconds.value, 10) || 0;
        
        log(LOG_LEVELS.DEBUG, 'Getting session length', { minutes, seconds });
        
        // Validate custom time inputs
        if (minutes > MAX_MINUTES) {
            throw new TimerError(`Minutes cannot exceed ${MAX_MINUTES}`, 'INVALID_MINUTES');
        }
        if (seconds > MAX_SECONDS) {
            throw new TimerError(`Seconds cannot exceed ${MAX_SECONDS}`, 'INVALID_SECONDS');
        }
        
        // If custom time is set, use it
        if (minutes > 0 || seconds > 0) {
            return (minutes * 60) + seconds;
        }
        
        // Otherwise use the dropdown value
        const dropdownMinutes = parseInt(sessionLength.value, 10);
        if (dropdownMinutes < MIN_SESSION_LENGTH) {
            throw new TimerError('Session length must be at least 1 minute', 'INVALID_SESSION_LENGTH');
        }
        
        log(LOG_LEVELS.DEBUG, 'Using dropdown value', { dropdownMinutes });
        return dropdownMinutes * 60;
    } catch (error) {
        log(LOG_LEVELS.ERROR, 'Error getting session length', error);
        throw error;
    }
}

function validateTimeInput() {
    try {
        const minutes = parseInt(customMinutes.value, 10) || 0;
        const seconds = parseInt(customSeconds.value, 10) || 0;
        
        log(LOG_LEVELS.DEBUG, 'Validating time input', { minutes, seconds });
        
        if (minutes > MAX_MINUTES) {
            customMinutes.setCustomValidity(`Maximum ${MAX_MINUTES} minutes`);
            announceToScreenReader(`Maximum ${MAX_MINUTES} minutes allowed`);
            return false;
        }
        if (seconds > MAX_SECONDS) {
            customSeconds.setCustomValidity(`Maximum ${MAX_SECONDS} seconds`);
            announceToScreenReader(`Maximum ${MAX_SECONDS} seconds allowed`);
            return false;
        }
        if (minutes === 0 && seconds === 0 && parseInt(sessionLength.value, 10) === 0) {
            customMinutes.setCustomValidity('Time must be greater than 0');
            announceToScreenReader('Please set a time greater than 0');
            return false;
        }
        
        customMinutes.setCustomValidity('');
        customSeconds.setCustomValidity('');
        return true;
    } catch (error) {
        log(LOG_LEVELS.ERROR, 'Error validating time input', error);
        return false;
    }
}

function validateTaskInput() {
    try {
        const task = taskInput.value.trim();
        log(LOG_LEVELS.DEBUG, 'Validating task input', { task });
        
        if (!task) {
            taskInput.setCustomValidity('Please enter a task to focus on');
            taskInput.reportValidity();
            taskInput.focus();
            announceToScreenReader('Please enter a task to focus on');
            return false;
        }
        return true;
    } catch (error) {
        log(LOG_LEVELS.ERROR, 'Error validating task input', error);
        return false;
    }
}

function createTaskDisplay(taskText) {
    try {
        const taskDisplay = document.createElement('div');
        taskDisplay.className = 'task-display';
        taskDisplay.textContent = taskText;
        taskDisplay.setAttribute('role', 'status');
        taskDisplay.setAttribute('aria-live', 'polite');
        taskDisplay.style.display = 'block';
        taskDisplay.style.visibility = 'visible';
        taskDisplay.style.opacity = '1';
        return taskDisplay;
    } catch (error) {
        log(LOG_LEVELS.ERROR, 'Error creating task display', error);
        throw new TimerError('Failed to create task display', 'TASK_DISPLAY_ERROR');
    }
}

function startFocus() {
    log(LOG_LEVELS.INFO, 'Starting focus session');
    
    try {
        if (!validateTaskInput()) {
            log(LOG_LEVELS.WARN, 'Task validation failed');
            return;
        }
        
        if (!validateTimeInput()) {
            log(LOG_LEVELS.WARN, 'Time validation failed');
            return;
        }

        // Clear any existing timers
        cleanup();
        stopQuoteRotation();

        isFocusing = true;
        currentState = TIMER_STATES.RUNNING;
        
        // Store the task text and hide the input
        const taskText = taskInput.value.trim();
        taskInput.style.display = 'none';
        
        // Create and show task text display
        const taskDisplay = createTaskDisplay(taskText);
        
        // Insert task display after the title
        const title = document.querySelector('.app-title');
        title.parentNode.insertBefore(taskDisplay, title.nextSibling);
        
        // Hide all elements except timer, quote, task, and app-title
        const elements = focusContainer.children;
        for (let element of elements) {
            if (!element.classList.contains('timer') && 
                !element.classList.contains('quote') && 
                !element.classList.contains('task-display') &&
                !element.classList.contains('app-title')) {
                element.style.display = 'none';
            }
        }

        // Set initial time
        timeLeft = getSessionLengthSeconds();
        log(LOG_LEVELS.DEBUG, 'Setting initial time', { timeLeft });
        updateTimerDisplay();

        // Start the timer
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                endFocus();
            }
        }, 1000);

        // Start quote rotation
        startQuoteRotation();

        // Enter fullscreen mode
        focusContainer.classList.add('fullscreen');
        document.body.style.overflow = 'hidden';

        // Disable start button
        startBtn.disabled = true;

        // Hide subtitle
        const subtitle = document.querySelector('.sub-title');
        if (subtitle) {
            subtitle.style.display = 'none';
        }

        announceToScreenReader('Focus session started');

    } catch (error) {
        log(LOG_LEVELS.ERROR, 'Error starting focus session', error);
        resetUI();
        announceToScreenReader('Error starting focus session');
    }
}

function endFocus() {
    log(LOG_LEVELS.INFO, 'Ending focus session');
    
    try {
        isFocusing = false;
        currentState = TIMER_STATES.IDLE;
        
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        stopQuoteRotation();
        
        // Show all elements again
        const elements = focusContainer.children;
        for (let element of elements) {
            element.style.display = '';
        }
        
        // Remove task display and show input again
        const taskDisplay = document.querySelector('.task-display');
        if (taskDisplay) {
            taskDisplay.remove();
        }
        taskInput.style.display = '';
        
        // Show subtitle again
        const subtitle = document.querySelector('.sub-title');
        if (subtitle) {
            subtitle.style.display = '';
        }
        
        focusContainer.classList.remove('fullscreen');
        document.body.style.overflow = '';
        startBtn.disabled = false;
        taskInput.disabled = false;
        showRandomQuote();
        
        announceToScreenReader('Focus session ended');
    } catch (error) {
        log(LOG_LEVELS.ERROR, 'Error ending focus session', error);
        resetUI();
    }
}

function resetUI() {
    log(LOG_LEVELS.INFO, 'Resetting UI');
    
    try {
        // Reset all UI elements to their initial state
        taskInput.style.display = 'block';
        taskInput.disabled = false;
        startBtn.disabled = false;
        
        // Remove task display if it exists
        const taskDisplay = document.querySelector('.task-display');
        if (taskDisplay) {
            taskDisplay.remove();
        }

        // Show all elements
        const elements = focusContainer.children;
        for (let element of elements) {
            element.style.display = '';
        }

        // Remove fullscreen class
        focusContainer.classList.remove('fullscreen');
        document.body.style.overflow = '';

        // Show subtitle
        const subtitle = document.querySelector('.sub-title');
        if (subtitle) {
            subtitle.style.display = '';
        }

        // Reset state
        isFocusing = false;
        currentState = TIMER_STATES.IDLE;
        
        announceToScreenReader('UI reset complete');
    } catch (error) {
        log(LOG_LEVELS.ERROR, 'Error resetting UI', error);
    }
}

function updateTimeFromInputs() {
    log(LOG_LEVELS.DEBUG, 'Updating time from inputs');
    if (!isFocusing) {
        timeLeft = getSessionLengthSeconds();
        updateTimerDisplay();
    }
}

function showRandomQuote() {
    const newQuote = getRandomQuote();
    
    // Add fade-out animation
    quoteEl.classList.add('fade-out');
    
    // Wait for fade-out to complete before changing quote
    setTimeout(() => {
        quoteEl.textContent = newQuote;
        quoteEl.setAttribute('aria-label', `Motivational quote: ${newQuote}`);
        quoteEl.classList.remove('fade-out');
        quoteEl.classList.add('fade-in');
        
        // Remove fade-in class after animation completes
        setTimeout(() => {
            quoteEl.classList.remove('fade-in');
        }, 500);
    }, 500);
}

function startQuoteRotation() {
    if (quoteTimer) {
        clearInterval(quoteTimer);
    }
    quoteTimer = setInterval(showRandomQuote, QUOTE_ROTATION_INTERVAL);
}

function stopQuoteRotation() {
    if (quoteTimer) {
        clearInterval(quoteTimer);
        quoteTimer = null;
    }
}

function getRandomQuote() {
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * quotes.length);
    } while (newIndex === lastQuoteIndex && quotes.length > 1);
    lastQuoteIndex = newIndex;
    return quotes[newIndex];
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    log(LOG_LEVELS.INFO, 'DOM Content Loaded');
    
    try {
        // Initialize DOM elements
        timerDisplay = document.getElementById('timer');
        startBtn = document.getElementById('startBtn');
        taskInput = document.getElementById('taskInput');
        quoteEl = document.getElementById('quote');
        focusContainer = document.querySelector('.focus-container');
        sessionLength = document.getElementById('sessionLength');
        customMinutes = document.getElementById('customMinutes');
        customSeconds = document.getElementById('customSeconds');

        // Initialize timer display
        updateTimerDisplay();
        showRandomQuote();

        // Add click event listener for start button
        startBtn.addEventListener('click', () => {
            log(LOG_LEVELS.DEBUG, 'Start button clicked');
            if (!isFocusing) {
                startFocus();
            }
        });

        // Add input validation for custom time inputs
        customMinutes.addEventListener('input', () => {
            log(LOG_LEVELS.DEBUG, 'Custom minutes changed');
            validateTimeInput();
            updateTimeFromInputs();
        });

        customSeconds.addEventListener('input', () => {
            log(LOG_LEVELS.DEBUG, 'Custom seconds changed');
            validateTimeInput();
            updateTimeFromInputs();
        });

        sessionLength.addEventListener('change', () => {
            log(LOG_LEVELS.DEBUG, 'Session length changed');
            if (!isFocusing) {
                timeLeft = parseInt(sessionLength.value, 10) * 60;
                updateTimerDisplay();
            }
        });

        // Add keyboard event listener for Enter key
        taskInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !startBtn.disabled) {
                startFocus();
            }
        });

        // Add keyboard event listener for Escape key
        document.addEventListener('keydown', (e) => {
            if (isFocusing && e.key === 'Escape') {
                endFocus();
            }
        });

        // Add cleanup on page unload
        window.addEventListener('beforeunload', cleanup);
        
        log(LOG_LEVELS.INFO, 'Initialization complete');
    } catch (error) {
        log(LOG_LEVELS.ERROR, 'Error during initialization', error);
    }
});

// Cleanup function to prevent memory leaks
function cleanup() {
    if (timer) clearInterval(timer);
    if (quoteTimer) clearInterval(quoteTimer);
    timer = null;
    quoteTimer = null;
}
