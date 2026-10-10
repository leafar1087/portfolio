import unittest
from html.parser import HTMLParser
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]


class ControlNameAudit(HTMLParser):
    """Small dependency-free audit for native form control names."""

    CONTROL_TAGS = {'input', 'select', 'textarea'}

    def __init__(self):
        super().__init__()
        self.explicit_labels = set()
        self.controls = []
        self.label_depth = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'label':
            self.label_depth += 1
            if attrs.get('for'):
                self.explicit_labels.add(attrs['for'])
        if tag in self.CONTROL_TAGS and attrs.get('type') != 'hidden':
            self.controls.append((tag, attrs, self.label_depth > 0))

    def handle_endtag(self, tag):
        if tag == 'label' and self.label_depth:
            self.label_depth -= 1


class RuntimeContractTests(unittest.TestCase):
    def test_source_and_public_runtime_files_are_identical(self):
        for directory in ('css', 'js'):
            for source in (ROOT / directory).rglob('*'):
                if not source.is_file() or source.suffix not in {'.css', '.js'}:
                    continue
                public = ROOT / 'public' / source.relative_to(ROOT)
                self.assertTrue(public.is_file(), f'Falta distribución pública: {public}')
                self.assertEqual(source.read_bytes(), public.read_bytes(), str(source))

    def test_static_html_controls_have_accessible_names(self):
        for source in sorted(ROOT.glob('*.html')) + sorted((ROOT / 'pages').glob('*.html')):
            audit = ControlNameAudit()
            audit.feed(source.read_text(encoding='utf-8'))
            for tag, attrs, nested_in_label in audit.controls:
                named = (
                    attrs.get('aria-label')
                    or attrs.get('aria-labelledby')
                    or nested_in_label
                    or attrs.get('id') in audit.explicit_labels
                )
                self.assertTrue(named, f'{source}: {tag} sin nombre accesible')

    def test_dynamic_terminal_input_preserves_accessible_name(self):
        source = (ROOT / 'js' / 'terminal.js').read_text(encoding='utf-8')
        self.assertIn('id="term-input" aria-label="Entrada de terminal"', source)
        self.assertIn("'aria-label'", source)

    def test_resilience_explorer_has_a_panel_for_each_stage(self):
        source = (ROOT / 'index.html').read_text(encoding='utf-8')
        stages = re.findall(r'data-resilience-stage="([a-z]+)"', source)
        panels = re.findall(r'data-resilience-panel="([a-z]+)"', source)
        self.assertEqual(stages, ['asset', 'threat', 'risk', 'control', 'detection', 'evidence'])
        self.assertEqual(panels, stages)
        self.assertIn('role="tablist"', source)
        self.assertEqual(source.count('role="tabpanel"'), len(stages))
        self.assertIn("const selectStage", (ROOT / 'js' / 'script.js').read_text(encoding='utf-8'))

    def test_threat_context_map_is_local_and_has_disclosed_sources(self):
        template = (ROOT / 'pages' / 'tools.html').read_text(encoding='utf-8')
        source = (ROOT / 'js' / 'tools.js').read_text(encoding='utf-8')
        self.assertIn('data-tool-tab="threat-map"', template)
        self.assertIn('Sin servicios de terceros', template)
        self.assertIn('MITRE ATT&amp;CK', template)
        self.assertIn('CISA KEV', template)
        self.assertEqual(template.count('data-threat-node'), 4)
        self.assertIn('function initThreatMap()', source)

    def test_kev_snapshot_contract_is_publishable_and_searchable(self):
        import json
        snapshot = json.loads((ROOT / 'data' / 'cisa-kev.json').read_text(encoding='utf-8'))
        self.assertEqual(snapshot['source']['name'], 'CISA Known Exploited Vulnerabilities Catalog')
        self.assertTrue(snapshot['source']['catalogVersion'])
        self.assertGreater(len(snapshot['vulnerabilities']), 1000)
        self.assertTrue({'cveId', 'vendor', 'product', 'dateAdded', 'ransomware'} <= snapshot['vulnerabilities'][0].keys())
        self.assertEqual((ROOT / 'public' / 'data' / 'cisa-kev.json').read_bytes(), (ROOT / 'data' / 'cisa-kev.json').read_bytes())
        source = (ROOT / 'js' / 'tools.js').read_text(encoding='utf-8')
        self.assertIn("fetch('../data/cisa-kev.json')", source)
        self.assertIn('function initKevExplorer()', source)

    def test_kev_refresh_workflow_uses_a_review_branch_and_scoped_token(self):
        workflow = (ROOT / '.github' / 'workflows' / 'refresh-cisa-kev.yml').read_text(encoding='utf-8')
        self.assertIn("cron: '17 5 * * 1'", workflow)
        self.assertIn('KEV_UPDATE_TOKEN', workflow)
        self.assertIn('git switch -C automation/cisa-kev', workflow)
        self.assertIn('git push --force-with-lease origin HEAD:automation/cisa-kev', workflow)
        self.assertIn('gh pr create --base main --head automation/cisa-kev', workflow)
        self.assertNotIn('git push origin main', workflow)

    def test_workflow_actions_are_pinned_to_full_shas(self):
        pattern = re.compile(r'^\s*-?\s*uses:\s+[^@\s]+@([0-9a-f]{40})(?:\s|$)')
        workflows = list((ROOT / '.github' / 'workflows').glob('*.yml'))
        self.assertTrue(workflows)
        for workflow in workflows:
            for line_number, line in enumerate(workflow.read_text(encoding='utf-8').splitlines(), 1):
                if 'uses:' in line:
                    self.assertRegex(line, pattern, f'{workflow}:{line_number} no está fijado por SHA completa')


if __name__ == '__main__':
    unittest.main()
