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
    const terminalHtml = `
        <div class="terminal-line">Rafael.Sec OS [Version 1.0.0]</div>
        <div class="terminal-line">(c) ${new Date().getFullYear()} Rafael Pérez Llorca. All rights reserved.</div>
        <div class="terminal-line"><br></div>
        <div id="term-output"></div>
        <div class="terminal-input-area">
            <span class="prompt">visitor@rafael.sec:~$</span>
            <input type="text" id="term-input" autocomplete="off">
        </div>
    `;

    if (typeof DOMPurify !== 'undefined') {
        terminalDiv.innerHTML = DOMPurify.sanitize(terminalHtml, { 
            USE_PROFILES: { html: true, svg: true },
            ADD_TAGS: ['use', 'svg'],
            ADD_ATTR: ['id', 'autocomplete', 'href', 'xlink:href'] 
        });
    } else {
        terminalDiv.innerHTML = terminalHtml;
    }
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
        printLine(`> Session started. Welcome, user. Type 'help' for commands.`, false);
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
        printLine(`<span class="prompt">visitor@rafael.sec:~$</span> ${safeCmd}`, true);
        
        if (cmd === 'clear') {
            outputDiv.innerHTML = '';
            return;
        }
        
        if (cmd === 'exit') {
            printLine(COMMANDS['exit'], false);
            setTimeout(closeTerminal, 800);
            return;
        }

        if (COMMANDS[cmd]) {
            printLine(`> ${COMMANDS[cmd]}`, false);
        } else if (cmd !== '') {
            printLine(`> Command not found: ${safeCmd}`, true);
        }
        
        // Scroll to inverted
        terminalDiv.scrollTop = terminalDiv.scrollHeight;
    }

    function printLine(content, isHtml = false) {
        const div = document.createElement('div');
        div.className = 'terminal-line';
        if (isHtml) {
            // Hardening: Use DOMPurify if available, otherwise fallback to textContent
            if (typeof DOMPurify !== 'undefined') {
                div.innerHTML = DOMPurify.sanitize(content, {
                    USE_PROFILES: { html: true, svg: true },
                    ADD_TAGS: ['use', 'svg', 'span'],
                    ADD_ATTR: ['class', 'href', 'xlink:href']
                });
            } else {
                div.textContent = content; // Security fallback
            }
        } else {
            div.textContent = content;
        }
        outputDiv.appendChild(div);
    }
})();
