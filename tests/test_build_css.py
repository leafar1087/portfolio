import unittest

from tools import build_css


class CssBuildTests(unittest.TestCase):
    def test_runtime_stylesheet_matches_ordered_modules(self):
        self.assertTrue(build_css.OUTPUT.is_file())
        self.assertEqual(build_css.OUTPUT.read_text(encoding='utf-8'), build_css.build())

    def test_course_grid_collapses_before_tablet_width(self):
        stylesheet = build_css.build()
        base = '.course-module-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));'
        responsive = '@media (max-width: 900px) {\n  .course-module-grid {\n    grid-template-columns: 1fr;'
        self.assertLess(stylesheet.index(base), stylesheet.index(responsive))


if __name__ == '__main__':
    unittest.main()
