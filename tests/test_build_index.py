import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'build_index.py'


class BuildIndexTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.old_cwd = os.getcwd()
        os.chdir(self.tempdir.name)
        Path('posts').mkdir()
        spec = importlib.util.spec_from_file_location('build_index_test', SCRIPT)
        self.build = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.build)

    def tearDown(self):
        os.chdir(self.old_cwd)
        self.tempdir.cleanup()

    def write(self, path, status=None):
        frontmatter = 'title: Test\ndate: 2026-01-01\n'
        if status:
            frontmatter += f'publication_status: {status}\n'
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(f'---\n{frontmatter}---\n# Test\n', encoding='utf-8')

    def run_build(self):
        self.build.main()
        return json.loads(Path('content-index.json').read_text(encoding='utf-8'))

    def test_status_filter_and_legacy_articles(self):
        self.write('posts/article.md')
        self.write('posts/academy/approved/reviewed.md', 'reviewed')
        self.write('posts/academy/approved/canonical.md', 'canonical')
        self.write('posts/academy/approved/candidate.md', 'candidate')
        self.write('posts/academy/approved/historical.md', 'historical')
        ids = {entry['id'] for entry in self.run_build()}
        self.assertTrue({'article', 'academy/approved/reviewed', 'academy/approved/canonical'} <= ids)
        self.assertFalse({'academy/approved/candidate', 'academy/approved/historical'} & ids)

    def test_course_metadata_is_preserved(self):
        Path('posts/academy/course').mkdir(parents=True)
        Path('posts/academy/course/index.md').write_text('''---\ntitle: Course\ntitle_es: Curso\ndescription: Summary\ndescription_es: Resumen\ndate: 2026-01-01\nauthor: Rafael Pérez Llorca\ntags: [ciberseguridad, guia]\ncontent_type: course\ncourse_slug: course\ncourse_title: Curso\nmodule_order: 0\ncourse_order: 1\npublication_status: canonical\nversion: v1\nlearning_stage: básico\n---\n# Course\n''', encoding='utf-8')
        entry = self.run_build()[0]
        self.assertEqual(entry['type'], 'course')
        self.assertEqual(entry['content_type'], 'course')
        self.assertEqual(entry['course_slug'], 'course')
        self.assertEqual(entry['module_order'], '0')
        self.assertEqual(entry['course_order'], '1')
        self.assertEqual(entry['publication_status'], 'canonical')
        self.assertEqual(entry['version'], 'v1')
        self.assertEqual(entry['learning_stage'], 'básico')

    def test_internal_and_outside_paths_are_not_published(self):
        self.write('posts/academy/approved/module.md', 'reviewed')
        self.write('posts/academy/internal/hidden.md', 'reviewed')
        self.write('posts/.env.md', 'reviewed')
        self.write('outside.md', 'reviewed')
        Path('posts/tool.py').write_text('print(1)', encoding='utf-8')
        Path('public/__pycache__').mkdir(parents=True)
        Path('public/stale.py').write_text('stale', encoding='utf-8')
        Path('posts/__pycache__').mkdir()
        Path('posts/__pycache__/cache.pyc').write_bytes(b'x')
        ids = {entry['id'] for entry in self.run_build()}
        self.assertEqual(ids, {'academy/approved/module'})
        public_files = {str(path.relative_to('public')) for path in Path('public').rglob('*') if path.is_file()}
        self.assertIn('posts/academy/approved/module.md', public_files)
        self.assertFalse(any(name.endswith(('.py', '.pyc')) or '.env' in name or '__pycache__' in name or 'internal' in name for name in public_files))


if __name__ == '__main__':
    unittest.main()
