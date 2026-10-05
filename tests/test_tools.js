const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const tools = require(path.join(root, 'js', 'tools.js'));

assert.strictEqual(
    tools.calculateCvss31({ AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'H', I: 'H', A: 'H' }),
    9.8,
    'CVSS v3.1 debe reproducir el vector base crítico de FIRST'
);
assert.strictEqual(
    tools.calculateCvss31({ AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'N', I: 'N', A: 'N' }),
    0,
    'CVSS v3.1 no debe puntuar un vector sin impacto'
);
assert.strictEqual(
    tools.attackDescriptionText('Use <code>pwsh</code> with [PowerShell](https://attack.mitre.org/techniques/T1059/001). (Citation: MITRE)'),
    'Use pwsh with PowerShell.',
    'La descripción ATT&CK debe eliminar marcado remoto sin interpretar HTML'
);
assert.strictEqual(tools.attackHref('T1059.001'), 'https://attack.mitre.org/techniques/T1059/001/', 'La sub-técnica debe enlazar a MITRE');
assert.strictEqual(tools.attackHref('not-a-technique'), '', 'Los identificadores no válidos no deben generar enlaces');

const context = {};
for (const source of ['cvss_lookup.js', 'max_composed.js', 'max_severity.js', 'cvss_score.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(root, 'js', 'vendor', 'cvss-v4', source), 'utf8'), context);
}
const noImpact = { AV: 'N', AC: 'L', AT: 'N', PR: 'N', UI: 'N', VC: 'N', VI: 'N', VA: 'N', SC: 'N', SI: 'N', SA: 'N', E: 'X', CR: 'X', IR: 'X', AR: 'X', MAV: 'X', MAC: 'X', MAT: 'X', MPR: 'X', MUI: 'X', MVC: 'X', MVI: 'X', MVA: 'X', MSC: 'X', MSI: 'X', MSA: 'X' };
assert.strictEqual(context.cvss_score(noImpact, context.cvssLookup_global, context.maxSeverity, context.macroVector(noImpact)), 0, 'CVSS v4.0 no debe puntuar un vector sin impacto');
