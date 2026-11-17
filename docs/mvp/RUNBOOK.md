# Nexo — operação e retomada

Estado: rascunho T00. Hoje existe somente a apresentação estática; instruções do futuro aplicativo serão completadas após implementação e teste.

## Estado a preservar

- Projeto: `appgprj_6ac5417ab1088191936830568f12e4a8`.
- Site: https://nexo-triagem-juridica.insper-1495.chatgpt.site.
- Publicação atual: versão 2, commit `6e1e3486dfac3d4efb8c8ba7dabfa047f85926d6`.
- Base do código auditado: `4e49b32625526103f228ffd51b1fecf44835280f`, com robots/sitemap ainda não publicados.
- Registros desta pasta são auditoria/planejamento, não uma nova versão publicada.

Para retomar, consultar Site, versão e código atuais; ler APPROVALS e TASKS. Não criar outro Site nem seguir a instrução legada de recriação presente no pacote original. Não descartar alterações locais ou reescrever histórico para obter árvore limpa.

## Verificações atuais reproduzíveis

No checkout autorizado, com as dependências existentes:

```sh
npm run check
npm run build
git diff --exit-code -- dist
```

O build recria `dist/`; verificar o estado antes de executar. Não usar a antiga suite visual como aceite da página atual. A prévia deve seguir o mecanismo suportado pelo ambiente; não iniciar servidores paralelos para contornar uma limitação da prévia.

## Próxima etapa

Aguardar A1. Depois: concluir contratos, preparar estrutura Worker separadamente, portar a apresentação e adicionar os módulos sem perder o endereço, o público institucional e a marca.

Após preparar o adaptador, solicitar A2 com modelo, limites e orçamento. Não pedir chave no chat. Credencial de API somente em configuração protegida; não gravar valor no repositório, relatório, frontend ou manifesto. Não conceder acesso administrativo pelo primeiro login. A conta da usuária só será associada após verificação de identidade do Site.

## Operação pretendida da demonstração

- Usar exclusivamente casos fictícios e aviso permanente de demonstração.
- Definir antes da abertura hospedada: lista de acesso, prazo de retenção dos testes e ação de apagar/reiniciar casos sintéticos.
- Interromper novas entrevistas/chamadas pelo controle administrativo; manter leitura autorizada dos registros.
- Em falha da IA, preservar o relato e mostrar estado de falha/pendência; retomar com trava e orçamento disponível.
- Nunca executar automaticamente decisão jurídica ou envio externo.

Esses controles ainda não existem. Os comandos e telas efetivos serão registrados quando implementados.

## Publicação e recuperação

Antes de A3, apresentar candidato, testes, eventuais limites, custo observado e exato público de cada rota. Incluir as pendências de robots/sitemap explicitamente. Publicar somente o artefato correspondente ao código validado.

Planejar migrações aditivas e versionadas. Reversão de código não desfaz migração; confirmar estado de dados antes de qualquer recuperação. Definir cópia/exportação e restauração conforme os recursos realmente disponíveis. Até essa validação, não afirmar que há backup ou plano de restauração executado.

Se for necessário hospedar para validar identidade/IA antes da publicação final, pedir autorização limitada de teste no mesmo Site, com escopo e acesso definidos. Não criar ambiente público adicional sem autorização.

Não executar T13 nem solicitar A4 nesta entrega: a usuária definiu finalidade exclusivamente demonstrativa.
