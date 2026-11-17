(() => {
  const visible = element => element.getClientRects().length && !element.closest('[hidden]') && getComputedStyle(element).visibility !== 'hidden';
  const rgb = value => (value.match(/[\d.]+/g) || []).map(Number);
  const luminance = color => color.slice(0,3).map(value => {
    const s = value / 255;
    return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
  }).reduce((sum,value,i) => sum + value * [.2126,.7152,.0722][i], 0);
  const background = element => {
    let current = element;
    while (current) {
      const style = getComputedStyle(current);
      const color = rgb(style.backgroundColor);
      if (color.length === 3 || color[3] === 1) return color;
      if (style.backgroundImage !== 'none') return [242,245,250]; // fond le plus sombre du hero
      current = current.parentElement;
    }
    return [255,255,255];
  };
  const contrast = [];
  const clipped = [];
  for (const element of document.querySelectorAll('body *')) {
    if (!visible(element) || element.closest('.sr-only') || element.matches('script,style,noscript') || element.closest('[aria-hidden="true"]')) continue;
    if (element.closest('thead') && getComputedStyle(element.closest('thead')).clip !== 'auto') continue;
    const rect = element.getBoundingClientRect();
    if (!element.matches('.skip-link') && (rect.left < -1 || rect.right > innerWidth + 1)) clipped.push(element.tagName + '.' + element.className);
    const text = [...element.childNodes].filter(node => node.nodeType === 3).map(node => node.textContent.trim()).join('');
    if (!text) continue;
    const style = getComputedStyle(element);
    const fg = luminance(rgb(style.color)), bg = luminance(background(element));
    const ratio = (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);
    const size = parseFloat(style.fontSize);
    const large = size >= 24 || size >= 18.66 && Number(style.fontWeight) >= 700;
    if (ratio < (large ? 3 : 4.5)) contrast.push({text:text.slice(0,90),ratio:Number(ratio.toFixed(2)),fontSize:size,required:large?3:4.5,element:element.tagName+'.'+element.className});
  }
  const brokenAnchors = [...document.querySelectorAll('a')].filter(link => !link.getAttribute('href') || link.getAttribute('href') === '#' || link.hash && !document.getElementById(link.hash.slice(1))).map(link=>link.outerHTML);
  const smallTargets = [...document.querySelectorAll('a,button')].filter(visible).filter(e=>!e.matches('.skip-link')).map(e=>({text:e.textContent.trim(),rect:e.getBoundingClientRect()})).filter(({rect})=>rect.width<44||rect.height<44).map(({text,rect})=>({text,width:Math.round(rect.width),height:Math.round(rect.height)}));
  return JSON.stringify({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth,clipped,contrastFailures:contrast,brokenAnchors,smallTargets,h1Count:document.querySelectorAll('h1').length,lang:document.documentElement.lang,title:document.title,description:document.querySelector('meta[name=description]')?.content,favicon:document.querySelector('link[rel=icon]')?.getAttribute('href'),forms:document.forms.length,visiblePanel:document.querySelector('[role=tabpanel]:not([hidden])')?.id,sections:[...document.querySelectorAll('main>section')].map(s=>s.id)});
})()
