"""Run with Python 3, Ruby (YAML) and jq; no downloaded test dependencies."""
import copy
import json
from pathlib import Path
import re
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]


class WeChatMiniProgramsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = json.loads(subprocess.check_output([
            'ruby', '-ryaml', '-rjson', '-e',
            'puts JSON.generate(YAML.load_file(ARGV[0]))',
            str(ROOT / 'WeChat.MiniPrograms.RemoveAds.Egern.yaml')]))
        cls.filters = [r['response_jq'] for r in cls.module['body_rewrites']]

    def apply(self, index, value):
        output = subprocess.check_output(
            ['jq', '-c', self.filters[index]['filter']],
            input=json.dumps(value).encode())
        return json.loads(output)

    def test_rules_and_mitm_scope(self):
        self.assertEqual(len(self.module['rules']), 6)
        self.assertEqual(len(self.module['url_rewrites']), 112)
        self.assertEqual(len(self.filters), 19)
        hosts = set(self.module['mitm']['hostnames']['includes'])
        patterns = [r['match'] for r in self.module['url_rewrites']] + [r['match'] for r in self.filters]
        for pattern in patterns:
            compiled = re.compile(pattern)
            host = pattern.split('https://', 1)[1].split('/', 1)[0].split('(?:', 1)[0].replace(r'\.', '.')
            self.assertIn(host, hosts)
            self.assertFalse(compiled.search('https://example.com/ads'))
            self.assertFalse(compiled.search('https://' + host + '.example.com/ads'))
        self.assertEqual(len(hosts), 90)
        self.assertNotIn('scriptings', self.module)
        self.assertTrue(all(r['location'] in ('http://reject/', 'http://reject-dict/')
                            for r in self.module['url_rewrites']))

    def test_all_json_deletions_preserve_unrelated_fields(self):
        # Each fixture targets a different source rewrite/script branch.
        fixtures = [
            (0, {'data': 1, 'code': 0}, {'code': 0}),
            (1, {'data': [1, 2, 3, 4]}, {'data': [4]}),
            (2, {'data': {'popUpWindows': [1], 'shop': 1}}, {'data': {'shop': 1}}),
            (3, {'respInfo': {'reserveProductList': [1], 'shortcut': [{'name': n} for n in ['充流量', '领话费券', '充值']]}}, {'respInfo': {'shortcut': [{'name': '充值'}]}}),
            (4, {'respInfo': {'productList': [1], 'shortcut': [{'name': '充值'}]}}, {'respInfo': {'shortcut': [{'name': '充值'}]}}),
            (5, {'data': {'request': {'number': {'markSeat': {'servicehallOperList': [1], 'servicehallFuncList': [1], 'keep': 1}, 'servicehallOperList': [1], 'servicehallFuncList': [1], 'keep': 2}}}}, {'data': {'request': {'number': {'markSeat': {'keep': 1}, 'keep': 2}}}}),
            (8, {'data': 1, 'code': 0}, {'code': 0}),
            (9, {'data': {'p3': 1, 'keep': 1}}, {'data': {'keep': 1}}),
            (10, {'data': {'topBanner': 1, 'keep': 1}}, {'data': {'keep': 1}}),
            (11, {'data': {'homeButtonList': 1, 'dysmorphismPictureList': 1, 'keep': 1}}, {'data': {'keep': 1}}),
            (13, {'data': {'top_background_url': 1, 'bottom_banner_list': 1, 'keep': 1}}, {'data': {'keep': 1}}),
            (14, {'data': {'bannerInfoConfig': 1, 'keep': 1}}, {'data': {'keep': 1}}),
            (15, {'data': 1, 'code': 0}, {'code': 0}),
            (17, {'data': 1, 'code': 0}, {'code': 0}),
            (18, {'data': [1], 'code': 0}, {'data': [], 'code': 0}),
        ]
        for index, value, expected in fixtures:
            with self.subTest(index=index):
                self.assertEqual(self.apply(index, value), expected)

    def test_nested_json_strings(self):
        blocked = '13502ede-f5fd-4d5c-90f5-f2454a30fda0'
        value = {'data': {'config': json.dumps([{'id': blocked}, {'id': 'keep', 'goods': [1]}])}}
        self.assertEqual(json.loads(self.apply(6, value)['data']['config']), [{'id': 'keep', 'goods': [1]}])
        value = {'info': {'moduleJson': json.dumps([{'moduleName': '开屏广告'}, {'moduleName': '寄件'}])}}
        self.assertEqual(json.loads(self.apply(7, value)['info']['moduleJson']), [{'moduleName': '寄件'}])
        for index, value in [(6, {'data': {'config': 'invalid json'}}), (7, {'info': {'moduleJson': 'invalid json'}}), (3, {'respInfo': {'shortcut': 42, 'reserveProductList': [1]}})]:
            self.assertEqual(self.apply(index, value), value)

    def test_tea_and_mstand(self):
        data = {'data': {'INDEX_SLOT_01': 1, 'INDEX_SLOT_02': 1, 'INDEX_TOP_BANNER': {'contents': [{'bubble': 1, 'figure': 2, 'value': 'old', 'id': 1}]}, 'keep': 1}}
        result = self.apply(12, data)
        self.assertEqual(result['data']['keep'], 1)
        self.assertNotIn('INDEX_SLOT_01', result['data'])
        self.assertNotIn('INDEX_SLOT_02', result['data'])
        self.assertEqual(result['data']['INDEX_TOP_BANNER']['contents'], [{'id': 1, 'value': 'https://kelee.one/Resource/Script/WexinMiniPrograms/chayanyuese/cyys1.jpg'}])
        keys = ['homeDineInAdv', 'homePickupAdv', 'nearbyShopInfo', 'homeEventThemesAdv', 'eventThemes', 'homeRootAdv', 'homeTopAdv', 'homeDialogAdv', 'homeBannerAdv', 'homeCouponAdv', 'homeCompanyAdv', 'homeDeliveryAdv']
        value = {'data': {key: 1 for key in keys}}
        value['data'].update(homeNewsAdv={'jumpValue': 'ad', 'keep': 1}, keep=2)
        self.assertEqual(self.apply(16, value), {'data': {'homeNewsAdv': {'keep': 1}, 'keep': 2}})

    def test_unexpected_types_return_original_json(self):
        for index in range(len(self.filters)):
            for value in [None, [], 42, 'unexpected']:
                with self.subTest(index=index, value=value):
                    self.assertEqual(self.apply(index, copy.deepcopy(value)), value)


if __name__ == '__main__':
    unittest.main()
