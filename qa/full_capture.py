from inspect import browser,evaluate,capture,ROOT
import json,subprocess
for width,height in [(1440,960),(390,844)]:
    browser('exec',command=f'set viewport {width} {height}')
    evaluate("document.documentElement.style.scrollBehavior='auto'; document.querySelector('#tab-trabalho').click(); scrollTo(0,0); true")
    data=json.loads(evaluate("JSON.stringify({height:document.documentElement.scrollHeight,nav:document.querySelector('header').offsetHeight})")['result'])
    total=data['height']; step=height-data['nav']; end=0; pieces=[]; index=0
    while end<total:
        target=0 if index==0 else end-data['nav']
        actual=int(evaluate(f'scrollTo(0,{target}); Math.round(scrollY)')['result'])
        # A captura segue a posição DOM efetiva; a última página pode ter scroll limitado.
        offset=max(0,end-actual)
        file=capture(f'piece-{width}-{index}')
        pieces.append({'path':file,'crop':offset,'dest':end})
        end=min(total,actual+height)
        index+=1
        print(json.dumps({'width':width,'piece':index,'scrollY':actual,'end':end,'total':total}),flush=True)
        if index>40: raise RuntimeError('Captura não progrediu.')
    manifest={'width':width,'height':total,'pieces':pieces,'output':str(ROOT/'qa'/f'full-{width}.png')}
    manifest_file=ROOT/'qa'/f'capture-{width}.json'
    manifest_file.write_text(json.dumps(manifest))
    subprocess.run(['swift',str(ROOT/'qa/stitch.swift'),str(manifest_file)],check=True)
    evaluate('scrollTo(0,0); true')
