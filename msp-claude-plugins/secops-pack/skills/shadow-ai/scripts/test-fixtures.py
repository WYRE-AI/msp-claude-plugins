#!/usr/bin/env python3
"""No dependencies; writes fixtures only in a temporary directory, never an endpoint adapter."""
import csv
import json
import os
from pathlib import Path
import re
import runpy
from datetime import datetime, timezone
import shutil
import subprocess
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
CONTRACT = re.compile(r'SAI1;v=1\.0\.0;ts=\d{8}T\d{6}Z;os=(win|mac|lin);st=(ok|partial|error);n=(\d+);f=([a-z0-9.,]*);tr=(\d+)')
parse_result = runpy.run_path(str(HERE/'parse-result.py'))['parse_result']
with (HERE/'signatures.tsv').open() as stream:
    KNOWN = {r['id'] for r in csv.DictReader(stream, delimiter='\t')}


def parse(value):
    match = CONTRACT.fullmatch(value)
    assert match, value
    os_name, status, count, ids, omitted = match.groups()
    tokens = ids.split(',') if ids else []
    assert len(tokens) == len(set(tokens))
    assert int(count) == len(tokens) + int(omitted)
    assert all(re.fullmatch(r'[a-z][a-z0-9]*\.[mu]', t) and t.split('.')[0] in KNOWN for t in tokens)
    return os_name, status, set(tokens), int(omitted)


class InventoryFixtures(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='sai-fixture-')
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def directory(self, name):
        path = self.root/name
        path.mkdir(parents=True, exist_ok=True)
        return path

    def file(self, name, text):
        path = self.root/name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        return path

    def run_scan(self, os_name, max_len=255):
        script = 'detect-shadow-ai-'+('macos' if os_name=='mac' else 'linux')+'.sh'
        before = sorted((str(x.relative_to(self.root)), x.lstat().st_size, x.lstat().st_mtime_ns) for x in self.root.rglob('*'))
        result = subprocess.run(['bash' if os_name=='mac' else 'sh',str(HERE/script)], env={**os.environ,'SAI_ROOT':str(self.root),'RMM':'stdout','MAX_LEN':str(max_len)}, capture_output=True, text=True, timeout=45, check=True)
        self.assertEqual(before, sorted((str(x.relative_to(self.root)), x.lstat().st_size, x.lstat().st_mtime_ns) for x in self.root.rglob('*')))
        self.assertEqual(result.stderr,'')
        value = result.stdout.strip()
        self.assertLessEqual(len(value),max_len)
        return parse(value)

    def test_strict_parser(self):
        now=datetime(2026,11,11,15,tzinfo=timezone.utc)
        good='SAI1;v=1.0.0;ts=20261111T150000Z;os=lin;st=ok;n=1;f=cu.u;tr=0'
        self.assertFalse(parse_result(good,now=now)['incomplete'])
        self.assertTrue(parse_result(good.replace('20261111','20261001'),now=now)['incomplete'])
        self.assertTrue(parse_result(good.replace('st=ok','st=partial'),now=now)['incomplete'])
        self.assertTrue(parse_result(good.replace('n=1','n=2').replace('tr=0','tr=1'),now=now)['incomplete'])
        self.assertTrue(parse_result(good.replace('20261111','20261112'),now=now)['incomplete'])
        for bad in [good+';execute=anything', good.replace('cu.u','unknown.u'),good.replace('cu.u','cu.u,cu.u'),good.replace('n=1','n=2'),good.replace('20261111','20260230'),good+'\n',good.replace('cu.u','cp.u')]:
            with self.assertRaises(ValueError):parse_result(bad,now=now)

    def test_plain_grammarly_not_ai(self):
        self.file('home/a/.config/google-chrome/Default/Extensions/id/1/manifest.json',json.dumps({'name':'Grammarly Spell Checker'}))
        self.assertNotIn('by.u', self.run_scan('lin')[2])

    def test_shell_vendors_fallback_stdout(self):
        for adapter in ['datto','ncentral','atera','cwautomate','kaseyavsa']:
            # Fixture mode deliberately refuses every non-stdout adapter, including output mappings.
            p=subprocess.run(['sh',str(HERE/'detect-shadow-ai-linux.sh')],env={**os.environ,'SAI_ROOT':str(self.root),'RMM':adapter},capture_output=True,timeout=10)
            self.assertNotEqual(p.returncode,0)

    def test_empty(self):
        self.assertEqual(self.run_scan('lin')[2],set())
        self.assertEqual(self.run_scan('mac')[2],set())

    def test_linux_multiple_profiles_and_machine(self):
        self.directory('home/one/.config/Cursor')
        self.directory('home/two/.vscode-insiders/extensions/github.copilot-1.2')
        self.directory('root/.windsurf/extensions/continue.continue-1.0')
        self.directory('home/two/.local/share/JetBrains/Idea2025/copilot')
        self.directory('usr/lib/node_modules/@google/gemini-cli')
        self.file('usr/local/bin/ollama','not executable')
        self.file('var/lib/dpkg/status','Package: claude-desktop\nStatus: install ok installed\n\nPackage: perplexity\nStatus: deinstall ok config-files\n')
        hits = self.run_scan('lin')[2]
        self.assertTrue({'cu.u','ve.u','va.u','je.u','gc.m','ol.m','cl.m'} <= hits,hits)
        self.assertNotIn('px.m',hits)

    def test_mac_spaces_casks_and_user_apps(self):
        for path in ['Applications/ChatGPT.app','Users/A Person/Applications/Claude.app','opt/homebrew/Caskroom/lm-studio','usr/local/Cellar/ollama','Users/Second/Library/Application Support/JetBrains/Idea/plugins/github-copilot']:
            self.directory(path)
        self.assertTrue({'cg.m','cl.u','lm.m','ol.m','je.u'} <= self.run_scan('mac')[2])

    def test_browsers_localized_and_firefox(self):
        base='home/alice/.config/google-chrome/Default/Extensions/arbitrary-id/1.0/'
        self.file(base+'manifest.json',json.dumps({'name':'__MSG_name__','default_locale':'en'}))
        self.file(base+'_locales/en/messages.json',json.dumps({'name':{'message':'Sider: AI assistant'}}))
        self.file('home/bob/.mozilla/firefox/abcd/extensions.json',json.dumps({'addons':[{'active':True,'defaultLocale':{'name':'Perplexity'}},{'active':False,'defaultLocale':{'name':'Monica'}}]}))
        hits=self.run_scan('lin')[2]
        self.assertTrue({'bs.u','bp.u'} <= hits,hits)
        self.assertNotIn('bm.u',hits)

    def test_linux_flatpak_snap_appimage_and_shortcut(self):
        self.directory('home/alice/.local/share/flatpak/app/com.example.Cursor')
        self.directory('snap/ollama')
        self.file('home/bob/Applications/LM-Studio-1.0.AppImage','not executable')
        self.file('usr/share/applications/gemini.desktop','[Desktop Entry]\nName=Gemini\n')
        hits=self.run_scan('lin')[2]
        self.assertTrue({'cu.u','ol.m','lm.u','gp.m'} <= hits,hits)

    def test_mac_browser_localized(self):
        base='Users/A Person/Library/Application Support/Microsoft Edge/Profile 1/Extensions/id/1/'
        self.file(base+'manifest.json',json.dumps({'name':'__MSG_extName__','default_locale':'en_US'}))
        self.file(base+'_locales/en_US/messages.json',json.dumps({'extName':{'message':'Monica AI'}}))
        self.assertIn('bm.u',self.run_scan('mac')[2])

    def test_malformed_and_unresolved_manifest_partial(self):
        self.file('home/alice/.config/microsoft-edge/Default/Extensions/id/1/manifest.json','{bad')
        self.assertEqual(self.run_scan('lin')[1],'partial')

    def test_extension_directory_cap_partial(self):
        base=self.directory('home/alice/.vscode/extensions')
        for n in range(2001): (base/('github.copilot-'+str(n))).mkdir()
        result=self.run_scan('lin')
        self.assertEqual(result[1],'partial')
        self.assertIn('ve.u',result[2])

    def test_symlink_cannot_escape(self):
        with tempfile.TemporaryDirectory(prefix='sai-outside-') as outside:
            p=Path(outside)/'Cursor'; p.mkdir()
            self.directory('home/alice')
            (self.root/'home/alice/.config').symlink_to(outside)
            result=self.run_scan('lin')
            self.assertEqual(result[1],'partial')
            self.assertNotIn('cu.u',result[2])

    def test_fifo_manifest_does_not_block(self):
        for os_name, profile in [('lin', 'home/a/.config/google-chrome'),
                                 ('mac', 'Users/a/Library/Application Support/Google/Chrome')]:
            with self.subTest(os_name=os_name):
                folder = self.directory(profile+'/Default/Extensions/id/1')
                os.mkfifo(folder/'manifest.json')
                # run_scan enforces a subprocess timeout and checks no fixture changes.
                result = self.run_scan(os_name)
                self.assertEqual(result[1], 'partial')
                self.assertEqual(result[2], set())

    def test_literal_star_does_not_reglob_symlink(self):
        with tempfile.TemporaryDirectory(prefix='sai-outside-') as outside:
            target = Path(outside)/'1'
            target.mkdir()
            (target/'manifest.json').write_text(json.dumps({'name': 'ChatGPT'}))
            for os_name, profile in [('lin', 'home/a/.config/google-chrome'),
                                     ('mac', 'Users/a/Library/Application Support/Google/Chrome')]:
                with self.subTest(os_name=os_name):
                    extensions = self.directory(profile+'/Default/Extensions')
                    self.file(profile+'/Default/Extensions/*/1/manifest.json',
                              json.dumps({'name': 'Unrelated Extension'}))
                    (extensions/'evil').symlink_to(outside)
                    result = self.run_scan(os_name)
                    self.assertEqual(result[1], 'partial')
                    self.assertEqual(result[2], set())

    def test_large_manifest_partial(self):
        self.file('Users/alice/Library/Application Support/Google/Chrome/Default/Extensions/id/1/manifest.json',' ' * 1048577)
        self.assertEqual(self.run_scan('mac')[1],'partial')

    def test_truncation_preserves_desktop_priority(self):
        self.directory('home/alice/.config/Cursor')
        self.directory('home/alice/.vscode/extensions/github.copilot-1.0')
        names=['ChatGPT','Claude','Gemini','Perplexity','Copilot','Monica','Merlin','Sider','MaxAI','Grammarly AI']
        for i,name in enumerate(names):
            self.file(f'home/alice/.config/google-chrome/Default/Extensions/id{i}/1/manifest.json',json.dumps({'name':name}))
        result=self.run_scan('lin',100)
        self.assertGreater(result[3],0)
        self.assertIn('cu.u',result[2])

    def test_ollama_python_is_not_app(self):
        self.directory('home/alice/.local/lib/python3.12/site-packages/ollama')
        self.assertNotIn('ol.u',self.run_scan('lin')[2])

    def test_fixture_adapters_disabled(self):
        p=subprocess.run(['sh',str(HERE/'detect-shadow-ai-linux.sh')],env={**os.environ,'SAI_ROOT':str(self.root),'RMM':'ninjaone'},capture_output=True,timeout=10)
        self.assertNotEqual(p.returncode,0)
        self.assertEqual(p.stdout,b'')

    def test_powershell_sanity(self):
        pwsh=shutil.which('pwsh') or '/home/box/.local/bin/pwsh'
        if not Path(pwsh).exists():self.skipTest('pwsh unavailable')
        self.directory('Users/alice/AppData/Local/Programs/Cursor')
        self.directory('Users/bob/.vscode/extensions/github.copilot-1.0')
        p=subprocess.run([pwsh,'-NoProfile','-File',str(HERE/'Detect-ShadowAI.ps1')],env={**os.environ,'SAI_ROOT':str(self.root)},capture_output=True,text=True,timeout=45,check=True)
        result=parse(p.stdout.strip())
        self.assertEqual(result[0],'win')
        self.assertEqual(result[1],'partial')
        self.assertTrue({'cu.u','ve.u'} <= result[2],result)

if __name__=='__main__':unittest.main(verbosity=2)
