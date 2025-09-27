(() => {
    const STORAGE_KEY = 'nfcIpsConsoleLogger';
    const originalLog = console.log;
    const originalError = console.error;

    const controller = {
        isEnabled: false,
        enable() {
            persistSetting('on');
            if (!controller.isEnabled) {
                window.location.reload();
            }
        },
        disable() {
            persistSetting('off');
            if (controller.isEnabled) {
                window.location.reload();
            }
        },
        flush() {}
    };

    window.NfcIpsLogging = controller;

    const shouldEnable = resolveEnablement();
    if (!shouldEnable) {
        return;
    }

    controller.isEnabled = true;

    const logFileName = `debug-${timestamp()}.log`;
    let logBuffer = [];

    controller.disable = () => {
        flushLogs();
        persistSetting('off');
        window.location.reload();
    };

    controller.flush = flushLogs;

    console.log = (...args) => {
        const message = formatArgs(args);
        writeLogToFile(`LOG: ${message}`);
        originalLog.apply(console, args);
    };

    console.error = (...args) => {
        const message = formatArgs(args);
        writeLogToFile(`ERROR: ${message}`);
        originalError.apply(console, args);
    };

    window.addEventListener('beforeunload', flushLogs);

    window.flushConsoleLogs = flushLogs;

    function resolveEnablement() {
        const host = window.location.hostname || '';
        const protocol = window.location.protocol;
        const params = new URLSearchParams(window.location.search);
        const forced = params.get('consoleLogs');
        const stored = readSetting();

        if (forced === 'on' || forced === 'off') {
            return forced === 'on';
        }
        if (stored === 'on' || stored === 'off') {
            return stored === 'on';
        }

        // Auto-download console logs disabled by default
        // To enable: add ?consoleLogs=on to URL or use window.NfcIpsLogging.enable()
        return false;

        // Original auto-enable logic (commented out):
        // const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
        // const isFileProtocol = protocol === 'file:';
        // const isGithubPages = host.includes('github.io');
        // return !isGithubPages && (isLocalHost || isFileProtocol || host === '');
    }

    function writeLogToFile(entry) {
        logBuffer.push(`[${new Date().toISOString()}] ${entry}`);
        if (logBuffer.length >= 50) {
            flushLogs();
        }
    }

    function flushLogs() {
        if (logBuffer.length === 0) return;

        const blob = new Blob([logBuffer.join('\n') + '\n'], { type: 'text/plain' });
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

    function formatArgs(args) {
        return args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))).join(' ');
    }

    function timestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-');
    }

    function persistSetting(value) {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch (error) {
            // Ignore storage errors (private browsing, etc.)
        }
    }

    function readSetting() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            return null;
        }
    }
})();
