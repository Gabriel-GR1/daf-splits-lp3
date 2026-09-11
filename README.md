# LP3 - DAF Splits | E-mail + PDF

Landing page independente para captação e qualificação de leads.

Esta versão não usa Google Sheets nem Google Cloud. Cada submissão é processada por uma função serverless da Vercel, que gera uma ficha em PDF e envia automaticamente um e-mail para a DAF através do Resend.

## Fluxo

`Lead -> LP3 -> /api/lead (Vercel) -> PDF -> Resend -> e-mail da DAF`

## Estrutura

- `index.html` - landing page e formulário em 3 etapas
- `styles.css` - visual responsivo
- `script.js` - formulário, validação, UTMs, ID da submissão e evento Meta `Lead`
- `api/lead.js` - valida, monta o PDF e envia o e-mail
- `assets/hero-temp.jpg` - imagem temporária
- `assets/logo.png` - logo DAF
- `RESEND-SETUP.txt` - configuração passo a passo

## Variáveis de ambiente na Vercel

Obrigatórias:

- `RESEND_API_KEY` - API key do Resend
- `LEADS_EMAIL` - destinatário. Aceita vários endereços separados por vírgula.

Opcional:

- `RESEND_FROM` - remetente do e-mail. Padrão: `DAF Splits <onboarding@resend.dev>`

Para produção, verifique o domínio da DAF no Resend e configure `RESEND_FROM` com um endereço do domínio verificado.

## O e-mail recebido

Assunto:

`Novo lead - Nome | Perfume`

O corpo do e-mail mostra imediatamente as principais respostas e inclui um botão para abrir o WhatsApp do lead.

A ficha PDF anexa os dados do formulário e, em uma segunda página, os dados de atribuição da campanha (UTMs, FBCLID e página de origem).

## PDF

O PDF é gerado apenas no servidor, sem dependências externas de PDF. Nenhuma informação do lead precisa ser armazenada em um banco para o envio funcionar.

## Anti-duplicação

Cada carregamento da LP recebe um `submission_id`. Esse ID é enviado ao Resend como chave de idempotência para reduzir o risco de e-mails duplicados em tentativas repetidas da mesma submissão.

## Meta Ads

Após a API confirmar o envio do e-mail, o front-end executa:

`fbq('track', 'Lead')`

quando o Meta Pixel estiver instalado.

## Desenvolvimento local

Instale as dependências:

`npm install`

Como o projeto possui `/api/lead`, use `vercel dev` para testar o fluxo completo.
