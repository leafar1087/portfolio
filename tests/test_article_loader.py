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
        self.assertIn('id="article-search-status"', source)
        self.assertIn('aria-live="polite"', source)
        self.assertIn("'aria-label'", source)

    def test_article_states_are_explicit_and_announceable(self):
        template = (SOURCE.parents[1] / 'pages' / 'article.html').read_text(encoding='utf-8')
        source = SOURCE.read_text(encoding='utf-8')
        self.assertIn('data-state="loading"', template)
        self.assertIn('class="loading-state" role="status"', template)
        self.assertIn("container.dataset.state = 'success'", source)
        self.assertIn("container.dataset.state = 'error'", source)
        self.assertIn("setAttribute('role', 'alert')", source)


if __name__ == '__main__':
    unittest.main()
