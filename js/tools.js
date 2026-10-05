(() => {
    const V31 = {
        AV: { label: 'Vector de ataque', values: [['N', 'Red'], ['A', 'Adyacente'], ['L', 'Local'], ['P', 'Físico']] },
        AC: { label: 'Complejidad de ataque', values: [['L', 'Baja'], ['H', 'Alta']] },
        PR: { label: 'Privilegios requeridos', values: [['N', 'Ninguno'], ['L', 'Bajos'], ['H', 'Altos']] },
        UI: { label: 'Interacción de usuario', values: [['N', 'Ninguna'], ['R', 'Requerida']] },
        S: { label: 'Alcance', values: [['U', 'Sin cambio'], ['C', 'Cambiado']] },
        C: { label: 'Confidencialidad', values: [['H', 'Alta'], ['L', 'Baja'], ['N', 'Ninguna']] },
        I: { label: 'Integridad', values: [['H', 'Alta'], ['L', 'Baja'], ['N', 'Ninguna']] },
        A: { label: 'Disponibilidad', values: [['H', 'Alta'], ['L', 'Baja'], ['N', 'Ninguna']] }
    };
    const V40 = {
        AV: { label: 'Vector de ataque', values: [['N', 'Red'], ['A', 'Adyacente'], ['L', 'Local'], ['P', 'Físico']] },
        AC: { label: 'Complejidad de ataque', values: [['L', 'Baja'], ['H', 'Alta']] },
        AT: { label: 'Requisitos de ataque', values: [['N', 'Ninguno'], ['P', 'Presente']] },
        PR: { label: 'Privilegios requeridos', values: [['N', 'Ninguno'], ['L', 'Bajos'], ['H', 'Altos']] },
        UI: { label: 'Interacción de usuario', values: [['N', 'Ninguna'], ['P', 'Pasiva'], ['A', 'Activa']] },
        VC: { label: 'Confidencialidad vulnerable', values: [['H', 'Alta'], ['L', 'Baja'], ['N', 'Ninguna']] },
        VI: { label: 'Integridad vulnerable', values: [['H', 'Alta'], ['L', 'Baja'], ['N', 'Ninguna']] },
        VA: { label: 'Disponibilidad vulnerable', values: [['H', 'Alta'], ['L', 'Baja'], ['N', 'Ninguna']] },
        SC: { label: 'Confidencialidad posterior', values: [['H', 'Alta'], ['L', 'Baja'], ['N', 'Ninguna']] },
        SI: { label: 'Integridad posterior', values: [['H', 'Alta'], ['L', 'Baja'], ['N', 'Ninguna']] },
        SA: { label: 'Disponibilidad posterior', values: [['H', 'Alta'], ['L', 'Baja'], ['N', 'Ninguna']] },
        E: { label: 'Madurez de explotación', values: [['X', 'No definida'], ['A', 'Atacada'], ['P', 'PoC'], ['U', 'No confirmada']] },
        CR: { label: 'Requisito de confidencialidad', values: [['X', 'No definido'], ['H', 'Alto'], ['M', 'Medio'], ['L', 'Bajo']] },
        IR: { label: 'Requisito de integridad', values: [['X', 'No definido'], ['H', 'Alto'], ['M', 'Medio'], ['L', 'Bajo']] },
        AR: { label: 'Requisito de disponibilidad', values: [['X', 'No definido'], ['H', 'Alto'], ['M', 'Medio'], ['L', 'Bajo']] }
    };
    const V40_DEFAULTS = { AV: 'N', AC: 'L', AT: 'N', PR: 'N', UI: 'N', VC: 'N', VI: 'N', VA: 'N', SC: 'N', SI: 'N', SA: 'N', E: 'X', CR: 'X', IR: 'X', AR: 'X', MAV: 'X', MAC: 'X', MAT: 'X', MPR: 'X', MUI: 'X', MVC: 'X', MVI: 'X', MVA: 'X', MSC: 'X', MSI: 'X', MSA: 'X' };
    const V31_DEFAULTS = { AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'N', I: 'N', A: 'N' };

    function roundUp(value) {
        return Math.ceil((value - 0.00001) * 10) / 10;
    }

    function calculateCvss31(metrics) {
        const av = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 }[metrics.AV];
        const ac = { L: 0.77, H: 0.44 }[metrics.AC];
        const pr = metrics.S === 'C' ? { N: 0.85, L: 0.68, H: 0.5 }[metrics.PR] : { N: 0.85, L: 0.62, H: 0.27 }[metrics.PR];
        const ui = { N: 0.85, R: 0.62 }[metrics.UI];
        const impactValues = { H: 0.56, L: 0.22, N: 0 };
        const impact = 1 - (1 - impactValues[metrics.C]) * (1 - impactValues[metrics.I]) * (1 - impactValues[metrics.A]);
        if (impact <= 0) return 0;
        const impactSubscore = metrics.S === 'U'
            ? 6.42 * impact
            : 7.52 * (impact - 0.029) - 3.25 * Math.pow(impact - 0.02, 15);
        const exploitability = 8.22 * av * ac * pr * ui;
        return roundUp(Math.min(metrics.S === 'U' ? impactSubscore + exploitability : 1.08 * (impactSubscore + exploitability), 10));
    }

    function cvss31Vector(metrics) {
        return `CVSS:3.1/${Object.entries(metrics).map(([metric, value]) => `${metric}:${value}`).join('/')}`;
    }

    function cvss40Vector(metrics) {
        const order = ['AV', 'AC', 'AT', 'PR', 'UI', 'VC', 'VI', 'VA', 'SC', 'SI', 'SA', 'E', 'CR', 'IR', 'AR'];
        return `CVSS:4.0${order.filter(metric => metrics[metric] !== 'X').map(metric => `/${metric}:${metrics[metric]}`).join('')}`;
    }

    function severity(score) {
        if (score === 0) return ['Sin impacto', 'none'];
        if (score < 4) return ['Baja', 'low'];
        if (score < 7) return ['Media', 'medium'];
        if (score < 9) return ['Alta', 'high'];
        return ['Crítica', 'critical'];
    }

    function renderMetrics(container, metrics, state, onChange) {
        container.replaceChildren();
        Object.entries(metrics).forEach(([key, definition]) => {
            const field = document.createElement('fieldset');
            field.className = 'cvss-metric';
            const legend = document.createElement('legend');
            legend.textContent = `${definition.label} (${key})`;
            field.appendChild(legend);
            const options = document.createElement('div');
            options.className = 'cvss-options';
            definition.values.forEach(([value, label]) => {
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = key;
                input.value = value;
                input.id = `cvss-${key}-${value}`;
                input.checked = state[key] === value;
                input.addEventListener('change', () => onChange(key, value));
                const option = document.createElement('label');
                option.htmlFor = input.id;
                option.textContent = `${value} · ${label}`;
                options.append(input, option);
            });
            field.appendChild(options);
            container.appendChild(field);
        });
    }

    function init() {
        const metricsContainer = document.getElementById('cvss-metrics');
        if (!metricsContainer) return;
        const scoreElement = document.getElementById('cvss-score');
        const severityElement = document.getElementById('cvss-severity');
        const vectorElement = document.getElementById('cvss-vector');
        const statusElement = document.getElementById('cvss-copy-status');
        let version = '3.1';
        let state = { ...V31_DEFAULTS };

        function update() {
            const score = version === '3.1'
                ? calculateCvss31(state)
                : cvss_score(state, cvssLookup_global, maxSeverity, macroVector(state));
            const [label, level] = severity(score);
            scoreElement.textContent = Number(score).toFixed(1);
            severityElement.textContent = `${label} severidad`;
            severityElement.className = `cvss-severity severity-${level}`;
            vectorElement.value = version === '3.1' ? cvss31Vector(state) : cvss40Vector(state);
        }

        function render() {
            const definitions = version === '3.1' ? V31 : V40;
            renderMetrics(metricsContainer, definitions, state, (metric, value) => {
                state[metric] = value;
                update();
            });
            update();
        }

        document.querySelectorAll('[data-cvss-version]').forEach(button => button.addEventListener('click', () => {
            version = button.dataset.cvssVersion;
            state = version === '3.1' ? { ...V31_DEFAULTS } : { ...V40_DEFAULTS };
            document.querySelectorAll('[data-cvss-version]').forEach(item => {
                const active = item === button;
                item.classList.toggle('active', active);
                item.setAttribute('aria-pressed', String(active));
            });
            render();
        }));

        document.querySelectorAll('[data-tool-tab]').forEach(button => button.addEventListener('click', () => {
            const selected = button.dataset.toolTab;
            document.querySelectorAll('[data-tool-tab]').forEach(item => {
                const active = item === button;
                item.classList.toggle('active', active);
                item.setAttribute('aria-selected', String(active));
            });
            document.querySelectorAll('[data-tool-panel]').forEach(panel => {
                panel.hidden = panel.dataset.toolPanel !== selected;
            });
        }));

        document.getElementById('copy-cvss-vector')?.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(vectorElement.value);
                statusElement.textContent = 'Vector copiado.';
            } catch {
                vectorElement.select();
                document.execCommand('copy');
                statusElement.textContent = 'Vector seleccionado para copiar.';
            }
        });
        const attackForm = document.getElementById('attack-search-form');
        attackForm?.addEventListener('submit', async event => {
            event.preventDefault();
            const status = document.getElementById('attack-status');
            const results = document.getElementById('attack-results');
            status.textContent = 'Consultando ATT&CK…'; results.replaceChildren();
            const params = new URLSearchParams({ domain: document.getElementById('attack-domain').value, q: document.getElementById('attack-query').value });
            try {
                const response = await fetch(`/api/attack?${params}`);
                const payload = await response.json();
                if (!response.ok) throw new Error(payload.error);
                status.textContent = `${payload.techniques.length} técnicas · fuente ${new Date(payload.fetchedAt).toLocaleDateString('es-ES')}`;
                payload.techniques.forEach(technique => {
                    const item = document.createElement('article'); item.className = 'attack-result';
                    const title = document.createElement('h3'); title.textContent = `${technique.id} · ${technique.name}`;
                    const meta = document.createElement('p'); meta.textContent = [...technique.tactics, ...technique.platforms].join(' · ') || 'Sin clasificación adicional';
                    const description = document.createElement('p'); description.textContent = technique.description;
                    item.append(title, meta, description); results.appendChild(item);
                });
                if (payload.sigma.available) status.textContent += ` · ${payload.sigma.rules.length} reglas Sigma encontradas`;
            } catch (error) { status.textContent = error.message || 'No se pudo consultar ATT&CK.'; }
        });
        render();
    }

    if (typeof module !== 'undefined') module.exports = { calculateCvss31, cvss31Vector };
    if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);
})();
