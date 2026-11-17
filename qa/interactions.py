from inspect import browser, evaluate, capture, ROOT
import json
def value(expression): return json.loads(evaluate('JSON.stringify('+expression+')')['result'])
def ref(name, role=None):
    snap = browser('snapshot')
    matches = [key for key,item in snap['refs'].items() if item.get('name') == name and (not role or item.get('role') == role)]
    assert matches, (name, snap)
    return '@' + matches[0]
def check(condition, message):
    assert condition, 'FAIL: ' + message
    print('PASS: ' + message)
browser('reload')
evaluate("document.documentElement.style.scrollBehavior='auto'; true")
browser('exec', command='set viewport 390 844')
browser('click', element=ref('Menu','button'))
check(value("document.querySelector('.menu-toggle').getAttribute('aria-expanded')") == 'true', 'menu mobile abre por clique')
capture('menu-mobile')
browser('keypress', key='Escape')
check(value("document.querySelector('.menu-toggle').getAttribute('aria-expanded')") == 'false', 'Escape fecha menu')
check(value("document.activeElement.classList.contains('menu-toggle')"), 'Escape devolve foco ao botão')
browser('keypress', key='Enter')
check(value("document.querySelector('.menu-toggle').getAttribute('aria-expanded')") == 'true', 'Enter abre menu')
browser('click', element=ref('Demonstração','link'))
check(value('location.hash') == '#demonstracao', 'menu navega à âncora da demonstração')
check(value("document.querySelector('.menu-toggle').getAttribute('aria-expanded')") == 'false', 'navegação fecha menu')
for name, panel in [('Consumo','consumo'),('Moradia','moradia'),('Trabalho','trabalho')]:
    evaluate("document.querySelector('#tab-"+panel+"').scrollIntoView({block:'center'}); true")
    browser('click', element=ref(name,'tab'))
    check(value("document.querySelector('[role=tabpanel]:not([hidden])').id") == 'panel-'+panel, 'aba '+name+' revela o caso correspondente')
    check(value("document.querySelectorAll('[role=tab][aria-selected=true]').length") == 1, 'seleção ARIA única '+name)
    check(value("document.querySelectorAll('[role=tabpanel]:not([hidden])').length") == 1, 'apenas um painel visível '+name)
    capture('aba-'+panel+'-mobile')
browser('focus', element=ref('Trabalho','tab'))
for key, expected in [('ArrowRight','consumo'),('ArrowRight','moradia'),('ArrowRight','trabalho'),('ArrowLeft','moradia'),('Home','trabalho'),('End','moradia')]:
    browser('keypress', key=key)
    check(value('document.activeElement.id') == 'tab-'+expected, 'teclado '+key+' move foco para '+expected)
    check(value("document.querySelector('[role=tab][aria-selected=true]').id") == 'tab-'+expected, 'teclado '+key+' ativa '+expected)
browser('keypress', key='Tab')
check(value('document.activeElement.id') == 'panel-moradia', 'Tab segue para o painel ativo')
check(value("getComputedStyle(document.activeElement).outlineStyle") != 'none', 'foco do painel visível')
capture('foco-painel-mobile')
browser('click', element=ref('Trabalho','tab'))
print('PASS: interações mobile e teclado; eventos reais no navegador Orca.')
