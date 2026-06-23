# Guia de build iOS / geração do `.IPA` — Dellas Driver

Este documento explica como gerar o app iOS (`.IPA`) do **Dellas Driver** e como
publicá-lo na App Store / TestFlight. Foi escrito tanto para o dono do projeto
quanto para o **terceiro responsável pelo lançamento** (que possui a conta Apple Developer).

---

## 1. Como o app foi montado (visão geral)

O Dellas Driver é um app **web** (React + Vite) que conversa com o backend **base44**.
Para virar um app iOS, ele foi empacotado com o **[Capacitor](https://capacitorjs.com/)**
na **"Opção A"**: o app nativo **carrega a URL pública publicada na base44**
(definida em `capacitor.config.json` → `server.url`), em vez de empacotar os
arquivos offline.

Motivo: o código faz chamadas de rede por caminhos **relativos** (`/api/...`), que
só funcionam quando servidas pelo domínio da base44. Carregar a URL publicada faz
tudo (login, corridas, pagamentos) funcionar sem reescrever o app.

Vantagens:
- O `.IPA` não precisa ser refeito a cada mudança — basta **publicar na base44**.
- Recursos nativos (GPS, câmera, microfone, push) funcionam via plugins do Capacitor.

> ⚠️ **App Store — diretriz 4.2:** apps que são "apenas um site" podem ser
> questionados pela Apple. Como este app usa GPS, câmera e push nativos, as chances
> de aprovação são boas, mas o publicador deve estar ciente desse risco.

---

## 2. Pré-requisito de configuração: a URL publicada

Antes de qualquer build, confirme em `capacitor.config.json` que o `server.url`
aponta para a **URL pública do app já publicado na base44**:

```json
"server": {
  "url": "https://SEU-APP.base44.app"
}
```

Troque `https://SEU-APP.base44.app` pela URL real (você a encontra clicando em
**Publish** no painel da base44). **Sem isso, o app abre em branco.**

---

## 3. Caminho recomendado: build na nuvem (sem Mac) com Codemagic

O arquivo [`codemagic.yaml`](./codemagic.yaml) já está configurado com dois fluxos.

### Passo a passo
1. Crie uma conta em **https://codemagic.io** (tem plano gratuito).
2. Conecte o repositório do GitHub (`CastielWinchster/central-dellas`).
3. O Codemagic detecta o `codemagic.yaml` automaticamente.
4. Escolha um dos workflows abaixo.

### Workflow `ios-unsigned` — gera um `.IPA` **NÃO assinado**
- **Não precisa de conta Apple.**
- Use quando quiser **entregar o arquivo `.IPA`** para o terceiro re-assinar e publicar.
- O `.IPA` sai como artefato do build (`DellasDriver-unsigned.ipa`) e pode ser
  enviado por e-mail (edite o endereço no final do `codemagic.yaml`).

### Workflow `ios-signed` — gera um `.IPA` **assinado** + envia ao TestFlight
- **Requer a conta Apple Developer do publicador.** Veja a seção 4.

---

## 4. Para o terceiro que vai PUBLICAR (assinatura)

Um `.IPA` para TestFlight/App Store precisa estar **assinado** com a conta Apple
**de quem publica**, e o **Bundle ID** precisa pertencer a essa conta.

O Bundle ID padrão deste projeto é **`com.dellasdriver.app`**. Se você usar outro,
altere nos dois lugares:
- `capacitor.config.json` → `appId`
- `codemagic.yaml` → `bundle_identifier` (workflow `ios-signed`)

### Opção 4a — Build assinado direto no Codemagic (recomendado)
1. No Codemagic, configure a integração **App Store Connect** (chave de API) com o
   nome `codemagic_app_store_connect` (ou ajuste o nome no `codemagic.yaml`).
2. Cadastre o Bundle ID no seu **Apple Developer** e crie o app no **App Store Connect**.
3. Rode o workflow **`ios-signed`**. Ele compila, assina e envia ao **TestFlight**.

Guia oficial: https://docs.codemagic.io/yaml-code-signing/signing-ios/

### Opção 4b — Re-assinar o `.IPA` não assinado
Possível, porém mais trabalhoso e propenso a erro (o Bundle ID precisa bater com a
conta). Em geral, a Opção 4a é mais simples e confiável.

### Opção 4c — Build local em um Mac com Xcode
```bash
npm install
npm run build
npx cap add ios
npx cap sync ios
bash scripts/configure-ios.sh   # aplica as permissões no Info.plist
npx cap open ios                # abre no Xcode → Product > Archive
```
No Xcode, selecione o time de desenvolvimento, faça **Archive** e
**Distribute App → App Store Connect**.

---

## 5. Permissões iOS (já configuradas)

O script [`scripts/configure-ios.sh`](./scripts/configure-ios.sh) injeta no
`Info.plist`, durante o build, as descrições de uso exigidas pela Apple:

| Permissão | Uso no app |
|---|---|
| Localização (em uso e em segundo plano) | Mapa, rotas e acompanhamento de corridas/entregas |
| Câmera | Verificação facial e fotos de documentos no cadastro |
| Microfone | Mensagens de áudio no chat |
| Fotos (ler/salvar) | Enviar documentos, foto de perfil e salvar recibos |
| Background modes | `location` e `remote-notification` (push) |

Se algum texto precisar de ajuste, edite o script.

---

## 6. Ícone do app (opcional, mas recomendado)

Para um ícone próprio (a App Store exige um ícone de qualidade):
1. Coloque um PNG **1024×1024** em `resources/icon.png` (e, opcionalmente,
   `resources/splash.png` 2732×2732).
2. O pipeline roda `npx @capacitor/assets generate --ios` automaticamente e gera
   todos os tamanhos. Sem esse arquivo, é usado o ícone padrão do Capacitor.

---

## 7. Resumo rápido

| Quero... | Faça |
|---|---|
| Um `.IPA` sem ter conta Apple | Workflow **`ios-unsigned`** no Codemagic |
| Publicar no TestFlight/App Store | Workflow **`ios-signed`** (conta Apple do publicador) |
| Mudar a URL do app | `capacitor.config.json` → `server.url` |
| Mudar o Bundle ID | `capacitor.config.json` → `appId` **e** `codemagic.yaml` |
| Mudar permissões | `scripts/configure-ios.sh` |
