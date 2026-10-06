import unittest
from pathlib import Path


SOURCE = Path(__file__).resolve().parents[1] / 'js' / 'article-loader.js'


class CourseOverviewTests(unittest.TestCase):
    def test_learning_stages_are_not_nested_in_a_second_grid(self):
        source = SOURCE.read_text(encoding='utf-8')
        self.assertIn('${moduleCards}', source)
        self.assertNotIn('<div class="course-module-grid">${moduleCards}</div>', source)

    def test_article_search_has_an_accessible_name(self):
        source = SOURCE.read_text(encoding='utf-8')
        self.assertIn('id="article-search"', source)
        self.assertIn('aria-label="Buscar publicaciones"', source)


if __name__ == '__main__':
    unittest.main()
