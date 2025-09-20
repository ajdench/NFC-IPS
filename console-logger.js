// Console logging to timestamped file
const originalLog = console.log;
const originalError = console.error;

function getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

const logFileName = `debug-${getTimestamp()}.log`;
let logBuffer = [];

function writeLogToFile(message) {
    logBuffer.push(`[${new Date().toISOString()}] ${message}`);

    // Write to file every 50 messages or when buffer is full
    if (logBuffer.length >= 50) {
        flushLogs();
    }
}

function flushLogs() {
    if (logBuffer.length === 0) return;

    const logContent = logBuffer.join('\n') + '\n';

    // Create download link for logs
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = logFileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logBuffer = [];
}

// Override console methods
console.log = function(...args) {
    const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    writeLogToFile(`LOG: ${message}`);
    originalLog.apply(console, args);
};

console.error = function(...args) {
    const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    writeLogToFile(`ERROR: ${message}`);
    originalError.apply(console, args);
};

// Flush logs on page unload
window.addEventListener('beforeunload', flushLogs);

// Expose manual flush function
window.flushConsoleLogs = flushLogs;