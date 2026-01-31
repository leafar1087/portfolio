(function() {
    const SECRET_CODE = 'hack';
    let inputSequence = '';
    let terminalOpen = false;

    // Command configurations
    const COMMANDS = {
        'help': 'Available commands: help, whoami, skills, contact, clear, exit',
        'whoami': 'Visitor: Authenticated as Guest User (Level 1).',
        'skills': 'Detected: [SecDevOps, Threat Intelligence, Governance, Python, Bash]',
        'contact': 'Secure Channel: [hidden] (Use the GUI contact form or check legal for email)',
        'exit': 'Terminating session...'
    };



    // Create Terminal Iframe/Div
    const terminalDiv = document.createElement('div');
    terminalDiv.id = 'hack-terminal';
    terminalDiv.innerHTML = `
        <div class="terminal-line">Rafael.Sec OS [Version 1.0.0]</div>
        <div class="terminal-line">(c) 2026 Rafael Pérez Llorca. All rights reserved.</div>
        <div class="terminal-line"><br></div>
        <div id="term-output"></div>
        <div class="terminal-input-area">
            <span class="prompt">visitor@rafael.sec:~$</span>
            <input type="text" id="term-input" autocomplete="off">
        </div>
    `;
    document.body.appendChild(terminalDiv);

    const outputDiv = terminalDiv.querySelector('#term-output');
    const inputField = terminalDiv.querySelector('#term-input');

    // Key Listener for Secret Code
    document.addEventListener('keydown', (e) => {
        if (terminalOpen && e.key === 'Escape') {
            closeTerminal();
            return;
        }

        if (!terminalOpen) {
            inputSequence += e.key.toLowerCase();
            if (inputSequence.length > SECRET_CODE.length) {
                inputSequence = inputSequence.substr(inputSequence.length - SECRET_CODE.length);
            }
            if (inputSequence === SECRET_CODE) {
                openTerminal();
            }
        }
    });

    // Terminal Input Listener
    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = inputField.value.trim().toLowerCase();
            processCommand(command);
            inputField.value = '';
        }
    });

    function openTerminal() {
        terminalOpen = true;
        terminalDiv.style.display = 'block';
        inputField.focus();
        printLine(`> Session started. Welcome, user. Type 'help' for commands.`);
    }

    function closeTerminal() {
        terminalOpen = false;
        terminalDiv.style.display = 'none';
        inputSequence = ''; // Reset sequence
    }

    function escapeHtml(text) {
        if (!text) return text;
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function processCommand(cmd) {
        const safeCmd = escapeHtml(cmd);
        printLine(`<span class="prompt">visitor@rafael.sec:~$</span> ${safeCmd}`);
        
        if (cmd === 'clear') {
            outputDiv.innerHTML = '';
            return;
        }
        
        if (cmd === 'exit') {
            printLine(COMMANDS['exit']);
            setTimeout(closeTerminal, 800);
            return;
        }

        if (COMMANDS[cmd]) {
            printLine(`> ${COMMANDS[cmd]}`);
        } else if (cmd !== '') {
            printLine(`> Command not found: ${safeCmd}`);
        }
        
        // Scroll to inverted
        terminalDiv.scrollTop = terminalDiv.scrollHeight;
    }

    function printLine(html) {
        const div = document.createElement('div');
        div.className = 'terminal-line';
        div.innerHTML = html;
        outputDiv.appendChild(div);
    }
})();
