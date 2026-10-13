import unittest

from tools import asset_versions


class AssetVersionTests(unittest.TestCase):
    def test_all_runtime_asset_references_are_current(self):
        self.assertEqual(asset_versions.check(), [])


if __name__ == '__main__':
    unittest.main()
