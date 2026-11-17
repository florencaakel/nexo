# Nexo — projeto completo para continuar

Cópia independente da versão 13, publicada em 6 de outubro de 2026.

## Continuar pelo ChatGPT

1. Anexe Nexo-Projeto-Completo.zip em um novo chat com Sites disponível.
2. Envie o texto de PROMPT-PARA-O-CHAT.txt (também abaixo).
3. Peça as alterações desejadas. Ao publicar, será necessário criar um novo Site na conta de quem recebeu a cópia.

Não é preciso instalar nada no computador para enviar o ZIP ao chat. A capacidade de editar e publicar depende dos recursos disponíveis na conta da pessoa.

Esta cópia não atualiza o site original. A configuração de hospedagem original e o histórico Git não foram incluídos para evitar vínculo com o projeto de outra conta. URLs canonical e og:url foram removidas apenas da cópia e deverão ser definidas quando houver novo endereço.

## O que o site faz

Landing page em português para a Nexo, proposta de triagem jurídica assistida por IA. Explica coleta do relato, organização de informações, critérios de atendimento e revisão humana. Não possui backend, IA operacional, banco de dados nem formulário de coleta.

Estrutura aprovada: Hero; Como funciona; O que sua equipe recebe; Diferenciais; Para quem; Contato; FAQ; Rodapé.

Identidade: fundo branco, azul como cor principal e detalhes em laranja, títulos grandes, tipografia serifada de destaque na abertura e animação do processo na hero. Conteúdo direto, sem metáforas vagas nem explicações que dependam de cliques.

Pendência: o proprietário ainda não informou e-mail ou WhatsApp. A seção de contato está sinalizada como “Contato em breve”. Não inventar um canal nem simular envio.

## Arquivos principais

- src/index.html: página, textos, FAQ e navegação.
- src/narrative.css: layout das seções e ajustes responsivos mais recentes.
- src/styles.css e src/sections.css: estilos de base.
- src/hero-lab.js e src/hero-lab.css: animação da abertura e CTA.
- src/motion.js e src/motion.css: movimento e acessibilidade.
- src/app.js: inicialização e menu móvel.
- src/experience.js e src/cases.js: código histórico da demonstração anterior; não inicializado pela versão atual.
- dist/: site compilado e pronto para hospedagem estática, incluindo licenças.
- scripts/: compilação e servidor local.
- package.json e package-lock.json: dependências e versões reproduzíveis.
- qa/, AI_BUILD_LOG.md e QA_ACCEPTANCE.md: histórico de testes e construção; alguns testes se referem a layouts anteriores e ambientes específicos. Não representam validação atual da nova narrativa.

## Trabalhar no computador

Requer Node.js e npm. Na pasta extraída:

    npm ci
    npm run check
    npm run build
    npm run dev

Abra http://localhost:4173. Para visualizar apenas o site já compilado, basta Node.js e `npm run dev`, sem instalar dependências. Pare o servidor com Ctrl+C.

Edite src/ e execute npm run build para atualizar dist/. O build utiliza esbuild e Framer Motion. Não precisa de chaves de API.

## Publicar em outra conta

Use um novo projeto Sites. Registre a nova identidade de hospedagem na conta da pessoa, mantendo static.directory como dist. Não tente reutilizar o identificador, credenciais ou endereço do Site original. Configure os metadados canonical e og:url com a URL da nova publicação.

## Verificação desta cópia

O código original passou em npm run check e npm run build. Links internos e IDs da página foram verificados. Esta entrega não inclui uma nova auditoria visual em navegador. A integridade dos arquivos copiados foi comparada com o código exportado, exceto os ajustes de portabilidade documentados acima.
