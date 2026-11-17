"""QA de renderização pelo navegador Orca; sem dependências Python externas."""
import base64, json, pathlib, subprocess, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = 'c902642a-9d6c-47d4-9ef5-f305738c9ee3'
def browser(action, **flags):
    args = ['orca', action, '--page', PAGE, '--json']
    for key, value in flags.items(): args += ['--' + key.replace('_', '-'), str(value)]
    proc = subprocess.run(args, capture_output=True, text=True)
    data = json.loads(proc.stdout)
    if not data.get('ok'): raise RuntimeError(data)
    return data['result']
def evaluate(expression): return browser('eval', expression=expression)
def capture(name, full=False):
    data = browser('full-screenshot' if full else 'screenshot')
    target = ROOT / 'qa' / (name + '.png')
    target.write_bytes(base64.b64decode(data['data']))
    return str(target)
if __name__ == '__main__':
    section = sys.argv[1]
    browser('reload')
    browser('wait', load='networkidle')
    for width, height, suffix in [(1440,1100,'desktop'), (390,844,'mobile')]:
        browser('exec', command=f'set viewport {width} {height}')
        evaluate("document.documentElement.style.scrollBehavior='auto'; document.querySelector(" + json.dumps(section) + ").scrollIntoView(); true")
        metrics = evaluate("JSON.stringify((()=>{const s=document.querySelector(" + json.dumps(section) + "); return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,section:s.id,height:Math.round(s.getBoundingClientRect().height),text:s.innerText,clipped:[...s.querySelectorAll('*')].filter(e=>{if(e.closest('.sr-only')||e.closest('thead')&&getComputedStyle(e.closest('thead')).clip!=='auto')return false;const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)}).map(e=>e.tagName+'.'+e.className)}})())")
        details = json.loads(metrics['result'])
        details.pop('text', None)
        record = {'viewport':width,'metrics':details,'screenshot':capture(section.lstrip('#')+'-'+suffix)}
        if details['height'] > height - 120:
            evaluate("document.querySelector(" + json.dumps(section) + ").scrollIntoView({block:'end'}); true")
            record['tail'] = capture(section.lstrip('#')+'-'+suffix+'-end')
        with (ROOT/'qa/sections.jsonl').open('a') as f: f.write(json.dumps(record,ensure_ascii=False)+'\n')
        print(json.dumps(record, ensure_ascii=False))
