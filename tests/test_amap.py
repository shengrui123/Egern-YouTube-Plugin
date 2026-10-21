"""Amap native Egern regression checks (Python 3, Ruby YAML, jq)."""
import json
from pathlib import Path
import re
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]


class AmapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = json.loads(subprocess.check_output([
            'ruby', '-ryaml', '-rjson', '-e',
            'puts JSON.generate(YAML.load_file(ARGV[0]))',
            str(ROOT / 'Amap.RemoveAds.Egern.yaml')]))

    def apply(self, path, payload):
        matches = [r['response_jq'] for r in self.module['body_rewrites']
                   if re.search(r['response_jq']['match'], path)]
        self.assertEqual(len(matches), 1, path)
        output = subprocess.check_output(['jq', '-c', matches[0]['filter']],
                                         input=json.dumps(payload).encode())
        return json.loads(output)

    def test_configuration_and_scope(self):
        self.assertEqual(len(self.module['url_rewrites']), 7)
        self.assertEqual(len(self.module['body_rewrites']), 11)
        self.assertEqual(set(self.module['mitm']['hostnames']['includes']), {
            'm5.amap.com', 'ai.amap.com', 'm5-zb.amap.com',
            'center.amap.com', 'sns.amap.com', 'info.amap.com'})
        self.assertNotIn('scriptings', self.module)
        self.assertNotIn('rules', self.module)
        for row in self.module['url_rewrites']:
            self.assertEqual(row['location'], 'http://reject-dict/')
        rules = self.module['url_rewrites'] + [r['response_jq'] for r in self.module['body_rewrites']]
        for row in rules:
            pattern = re.compile(row['match'])
            host = row['match'].split('https://')[1].split('/')[0].replace(r'\.', '.')
            self.assertIn(host, self.module['mitm']['hostnames']['includes'])
            self.assertFalse(pattern.search('https://example.com/ads'))
            self.assertFalse(pattern.search('https://' + host + '.example.com/ws/'))
        # Navigation, location and unrelated endpoints remain outside interception.
        for url in ['https://m5.amap.com/ws/mapapi/navigation?',
                    'https://m5.amap.com/ws/shield/frogserver/aocs/updatable/2?',
                    'https://m5.amap.com/ws/mapapi/location?',
                    'https://info.amap.com/ws/shield/search/poi/detailExtra?']:
            self.assertFalse(any(re.search(r['match'], url) for r in rules), url)
        splash = self.module['url_rewrites'][0]['match']
        self.assertRegex('HTTPS://M5.AMAP.COM/WS/VALUEADDED/ALIMAMA/SPLASH_SCREEN?x=1', splash)

    def test_updatable_nested_configs_and_partial_responses(self):
        url = 'https://m5.amap.com/ws/shield/frogserver/aocs/updatable/1?x=1'
        inner = {
            'sportsGroupConfig': {'group_banner': 1, 'route': 2},
            'sportsRouteConfig': {'group_banner': 1, 'route': 3},
            'his_input_tip': {'channel_zhitiao': 1, 'his_recommend_bangdan': 1, 'nearby_hotword': {'search_detail': 1, 'keep': 2}},
            'navi_end': {'operator_btns': [1], 'route': 1},
            'engine_render': {'can_show_advert': 1, 'advert_note_num': 2, 'keep': 3},
            'detail_config': {'shelf_coupon_refresh': 1, 'keep': 1},
            'amap_basemap_config': {'splash': 1, 'mainBubble': 1, 'keep': 1},
            'navi_cloud': {'QQMusicVipText': 'ad', 'keep': 1},
            'taxi': {'banner_picture_url': 'ad', 'keep': 1},
            'poi_folder_modules': {'folder_modules': ['enhanceIMQuestions', 'ad'], 'newFolderModules': ['evaluateVO', 'ad']},
            'favorites_info': {'nearby_picture_on': 1, 'keep': 1},
            'container_isolation': {'nearby_feed_poi_card_v2_multi_img': 1},
            'nore_rec': {'recommend': 1},
            'engine_eyrie': {'poi_area_bubble': 1, 'keep': 1},
            'WIA': {'orgGuideVideoConfig': 1, 'keep': 1},
        }
        data = {k: {'value': json.dumps(v), 'version': 'keep'} for k, v in inner.items()}
        data.update(splashscreen=1, **{'920bestwishes': 1}, custom_consultdata={'widget_guide': 1, 'keep': 2})
        result = self.apply(url, {'data': data, 'code': 1})
        self.assertEqual(result['code'], 1)
        self.assertNotIn('splashscreen', result['data'])
        self.assertNotIn('920bestwishes', result['data'])
        self.assertEqual(result['data']['custom_consultdata'], {'keep': 2})
        cleaned = {k: json.loads(result['data'][k]['value']) for k in inner}
        self.assertEqual(cleaned['sportsGroupConfig'], {'route': 2})
        self.assertEqual(cleaned['navi_end'], {'route': 1})
        self.assertEqual(cleaned['engine_render'], {'keep': 3})
        self.assertEqual(cleaned['his_input_tip']['his_recommend_bangdan'], 0)
        self.assertEqual(cleaned['his_input_tip']['nearby_hotword']['search_detail'], 0)
        self.assertEqual(cleaned['amap_basemap_config'], {'keep': 1})
        self.assertEqual(cleaned['navi_cloud']['end_auto_foot_explore'], 0)
        self.assertNotIn('QQMusicVipText', cleaned['navi_cloud'])
        self.assertEqual(cleaned['taxi']['recommend_point_optimization'], 0)
        self.assertNotIn('banner_picture_url', cleaned['taxi'])
        self.assertEqual(cleaned['poi_folder_modules']['folder_modules'], ['enhanceIMQuestions'])
        self.assertEqual(cleaned['favorites_info']['nearby_picture_on'], 0)
        self.assertEqual(cleaned['WIA'], {'keep': 1})
        # Missing or malformed configs cannot discard valid edits in other configs.
        value = {'data': {'taxi': {'value': 'broken'}, 'detail_config': {'value': 'broken'}, 'navi_end': {'value': '{"operator_btns":1,"keep":2}'}}}
        partial = self.apply(url, value)
        self.assertEqual(partial['data']['taxi'], value['data']['taxi'])
        self.assertEqual(json.loads(partial['data']['navi_end']['value']), {'keep': 2})
        for k in ['his_input_tip', 'favorites_info']:
            self.assertNotIn(k, partial['data'])

    def test_profile_and_scene(self):
        value = {'data': {'tipData': 1, 'wallet': 1, 'cardList': [
            {'dataKey': 'MineNewFootprintCard', 'keep': 1},
            {'dataKey': 'MineNewBEntranceCardV4', 'content': {'entranceList_1': [{'id': 7}, {'id': 99}], 'entranceList_2': [{'id': 32}, {'id': 99}]}},
            {'dataKey': 'AdCard'}]}}
        result = self.apply('https://m5.amap.com/ws/shield/dsp/profile/index/nodefaasv3?', value)
        self.assertEqual(len(result['data']['cardList']), 2)
        self.assertEqual(result['data']['cardList'][1]['content']['entranceList_1'], [{'id': 7}])
        self.assertNotIn('wallet', result['data'])
        value = {'data': {'shadingWords': {'data': {}}, 'toolsRecommend': {'data': {'default': [{'id': 102}, {'id': 999}]}}}}
        result = self.apply('https://m5.amap.com/ws/shield/scene/recommend?', value)
        self.assertNotIn('shadingWords', result['data'])
        self.assertEqual(result['data']['toolsRecommend']['data']['default'], [{'id': 102}])

    def test_tools_search_and_taxi(self):
        result = self.apply('https://sns.amap.com/ws/opc/tools/list?', {'data': {'category': [{'tools': [{'id': 547}, {'id': '547'}, {'id': 1, 'tips': 2}, 'keep']} ]}})
        self.assertEqual(result['data']['category'][0]['tools'], [{'id': 1}, 'keep'])
        result = self.apply('https://info.amap.com/ws/c3frontend/af-search/search?', {'data': {'modules': {'quickLink': {'data': {'list': [{'badge': {'text': 'ad', 'keep': 1}}, {'id': 2}]}}}}})
        self.assertEqual(result['data']['modules']['quickLink']['data']['list'][0]['badge'], {'text': '', 'keep': 1})
        result = self.apply('https://info.amap.com/ws/shield/search_business/process/middleLayer/sug?', {'tip_list': [{'tip': {'task_tag': 'sp'}}, {'tip': {'task_tag': 'ad'}}]})
        self.assertEqual(result['tip_list'], [{'tip': {'task_tag': 'sp'}}])
        result = self.apply('https://m5.amap.com/ws/smartui/near_recommend?', {'data': {'operation_activity': 1, 'poi': 2}})
        self.assertEqual(result, {'data': {'poi': 2}})
        result = self.apply('https://m5-zb.amap.com/ws/amap/hitch/passenger/content_info?', {'data': {'lubanData': {'banner': 1, 'route': 2}}})
        self.assertEqual(result['data']['lubanData'], {'route': 2})
        value = {'data': {'lubanData': {'skin': 1, 'popup': 1, 'kingToolBoxBubble': 1, 'kingToolSort': {'dataList': [{'biz': {'kingToolIdList': ['dache_toolbox_hitch', 'ad']}}]}, 'kingToolBox': {'dataList': [{'biz': {'id': 'dache_toolbox_hitch'}}, {'biz': {'id': 'ad'}}]}, 'route': 1}}}
        result = self.apply('https://m5-zb.amap.com/ws/boss/car/order/content_info?', value)['data']['lubanData']
        self.assertEqual(result['route'], 1)
        self.assertNotIn('popup', result)
        self.assertEqual(result['kingToolSort']['dataList'][0]['biz']['kingToolIdList'], ['dache_toolbox_hitch'])
        self.assertEqual(len(result['kingToolBox']['dataList']), 1)
        result = self.apply('https://center.amap.com/ws/amc/server/conv/raise_list?', {'data': {'dataList': [{'categoryId': 1}, {'data': {'id': 'M_100007'}}, {'data': {'id': 'ad'}}]}})
        self.assertEqual(len(result['data']['dataList']), 2)

    def test_detail_preserves_poi_and_filters_references(self):
        value = {'data': {'regions': {'main': ['baseInfo', 'ad', 'hotelRooms', {'keep': 1}]}, 'meta': {'half_hidden_modules': ['ad', 'combineReviews']}, 'modules': {
            'baseInfo': {'data': {'name': 'Test', 'user': {'userLocRgeo': 1, 'homeInfo': 2, 'companyInfo': 3, 'keep': 4}}},
            'combineReviews': {'data': {'write_comment': {'btnRightTag': 'ad', 'title': 'ad', 'keep': 1}}},
            'hotelRooms': {'room': 1}, 'ad': {'banner': 1},
            'anchor': {'data': {'items': [{'anchor': ['ad']}, {'anchor': ['combineReviews']}, {'anchor': ['hotelRooms']}]}}
        }}}
        result = self.apply('https://info.amap.com/ws/shield/search/poi/detail?', value)['data']
        self.assertEqual(result['regions']['main'], ['baseInfo', 'hotelRooms', {'keep': 1}])
        self.assertEqual(result['modules']['hotelRooms'], {'room': 1})
        self.assertEqual(result['modules']['baseInfo']['data']['user'], {'keep': 4})
        self.assertEqual(result['modules']['combineReviews']['data']['write_comment'], {'keep': 1})
        self.assertEqual(result['meta']['half_hidden_modules'], ['combineReviews'])
        self.assertEqual(len(result['modules']['anchor']['data']['items']), 2)
        self.assertNotIn('ad', result['modules'])

    def test_unexpected_json_shapes(self):
        for row in self.module['body_rewrites']:
            f = row['response_jq']['filter']
            for value in [None, [], 42, 'unknown', {}, {'data': None}, {'data': []}]:
                with self.subTest(url=row['response_jq']['match'], value=value):
                    out = subprocess.check_output(['jq', '-c', f], input=json.dumps(value).encode())
                    self.assertEqual(json.loads(out), value)


if __name__ == '__main__':
    unittest.main()
