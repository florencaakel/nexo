from inspect import browser, evaluate, capture, ROOT
import json, urllib.request, datetime
AUDIT = (ROOT/'qa/audit.js').read_text()
report = {'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'viewports':[],'assets':[]}
browser('goto', url='http://localhost:4173/')
browser('wait', load='networkidle')
for width,height in [(360,800),(390,844),(768,1024),(1440,960)]:
    browser('exec',command=f'set viewport {width} {height}')
    evaluate("document.documentElement.style.scrollBehavior='auto'; scrollTo(0,0); true")
    for example in ['trabalho','consumo','moradia']:
        evaluate("document.getElementById('tab-"+example+"').click(); true")
        data=json.loads(evaluate(AUDIT)['result'])
        data['example']=example
        report['viewports'].append(data)
        print(json.dumps({'width':width,'example':example,'overflow':data['overflow'],'clipped':data['clipped'],'contrastFailures':data['contrastFailures'],'smallTargets':data['smallTargets'],'brokenAnchors':data['brokenAnchors']},ensure_ascii=False))
    evaluate("document.getElementById('tab-trabalho').click(); scrollTo(0,0); true")
    if width in [390,1440]:
        report['full_'+str(width)] = str(ROOT/'qa'/f'full-{width}.png')
        report['viewport_'+str(width)] = capture('viewport-'+str(width))
    if width == 768: report['tablet_screenshot'] = capture('tablet-768')
for asset in ['','styles.css','sections.css','app.js','cases.js','favicon.svg']:
    with urllib.request.urlopen('http://localhost:4173/'+asset) as response:
        report['assets'].append({'asset':asset or 'index.html','status':response.status,'bytes':len(response.read())})
report['console'] = browser('console',limit=50)['messages']
report['network'] = [{'url':r['url'],'status':r.get('status')} for r in browser('network',limit=100)['requests']]
browser('exec',command='set viewport 390 844')
evaluate("document.documentElement.style.fontSize='200%'; scrollTo(0,0); true")
report['text_200'] = json.loads(evaluate(AUDIT)['result'])
report['text_200_screenshot'] = capture('text-200-mobile')
evaluate("document.documentElement.style.fontSize=''; true")
(ROOT/'qa/final-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
for result in report['viewports']+[report['text_200']]:
    assert not result['overflow'] and not result['clipped'] and not result['contrastFailures'] and not result['smallTargets'] and not result['brokenAnchors'],result
    assert result['h1Count']==1 and result['forms']==0,result
print(json.dumps({'assets':report['assets'],'console':report['console'],'text200':{k:report['text_200'][k] for k in ['overflow','clipped','contrastFailures','smallTargets']},'report':'qa/final-results.json'},ensure_ascii=False))
