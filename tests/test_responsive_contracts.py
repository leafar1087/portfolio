import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def assert_media_rule(testcase, stylesheet, breakpoint, fragment):
    pattern = rf"@media \(max-width: {breakpoint}px\) \{{(?:(?!@media).)*?{re.escape(fragment)}"
    testcase.assertRegex(stylesheet, re.compile(pattern, re.DOTALL))


class ResponsiveContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages = (ROOT / 'css' / 'modules' / '05-pages.css').read_text(encoding='utf-8')
        cls.courses = (ROOT / 'css' / 'modules' / '07-courses.css').read_text(encoding='utf-8')

    def test_hero_has_tablet_and_mobile_contracts(self):
        assert_media_rule(self, self.pages, 1024, '.hero-layout { grid-template-columns: 1fr;')
        assert_media_rule(self, self.pages, 1024, '.hero-photo { width: 200px; }')
        assert_media_rule(self, self.pages, 640, '.hero-photo { width: 160px; }')
        self.assertIn('@media (min-width: 1025px)', self.pages)
        self.assertIn('.hero-photo { align-self: center; }', self.pages)
        self.assertIn('width: 141px;', (ROOT / 'css' / 'modules' / '03-layout.css').read_text(encoding='utf-8'))

    def test_reading_and_catalog_surfaces_collapse_before_tablet(self):
        assert_media_rule(self, self.pages, 768, '.editorial-posts-ledger { grid-template-columns: minmax(0, 1fr); }')
        assert_media_rule(self, self.courses, 640, '.academy-grid { grid-template-columns: minmax(0, 1fr);')
        self.assertIn('.course-module-grid {\n    grid-template-columns: 1fr;', self.courses)
        self.assertIn('.cvss-layout { grid-template-columns: 1fr;', self.courses)
        assert_media_rule(self, self.courses, 900, '.course-content-wrapper {')

    def test_tools_map_and_controls_have_narrow_screen_contracts(self):
        assert_media_rule(self, self.courses, 780, '.threat-map-layout { grid-template-columns: 1fr;')
        assert_media_rule(self, self.courses, 520, '.threat-map-canvas { aspect-ratio: auto;')
        assert_media_rule(self, self.courses, 640, '.attack-search-form { grid-template-columns: 1fr;')
        assert_media_rule(self, self.courses, 640, '.academy-toolbar { align-items: stretch; flex-direction: column;')

    def test_interactive_transitions_are_explicit_and_tokenized(self):
        components = (ROOT / 'css' / 'modules' / '04-components.css').read_text(encoding='utf-8')
        self.assertNotIn('transition: all', components)
        self.assertNotIn('transition: all', self.courses)
        self.assertNotIn('course-overview-start:hover { color: #ffffff', self.courses)
    def test_pages_reference_current_stylesheet_revision(self):
        for page in [ROOT / 'index.html', *sorted((ROOT / 'pages').glob('*.html'))]:
            source = page.read_text(encoding='utf-8')
            if 'styles.css' in source:
                self.assertIn('styles.css?v=20261013j', source, str(page))

if __name__ == '__main__':
    unittest.main()
