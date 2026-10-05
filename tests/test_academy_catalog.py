import unittest
from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parents[1]


class AcademyCatalogContractTests(unittest.TestCase):
    def test_stage_filters_and_course_syllabus_are_derived_from_index_data(self):
        template = (ROOT / 'pages' / 'academy.html').read_text(encoding='utf-8')
        loader = (ROOT / 'js' / 'academy-loader.js').read_text(encoding='utf-8')

        for stage in ('all', 'básico', 'intermedio', 'avanzado'):
            self.assertIn(f'data-stage="{stage}"', template)

        self.assertIn("courseStages(course)", loader)
        self.assertIn("modules.slice(0, 3)", loader)
        self.assertIn("item.textContent", loader)

    def test_cvss_calculators_match_minimum_verified_vectors(self):
        result = subprocess.run(
            ['node', 'tests/test_tools.js'], cwd=ROOT, text=True, capture_output=True, check=False
        )
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == '__main__':
    unittest.main()
