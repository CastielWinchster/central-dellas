#!/usr/bin/env bash
#
# Ajusta o Info.plist do projeto iOS gerado pelo Capacitor com as permissoes
# (usage descriptions) e background modes que o app Dellas Driver precisa.
#
# Roda APENAS em macOS (usa o /usr/libexec/PlistBuddy), tipicamente dentro do
# pipeline de build na nuvem (Codemagic), depois de `npx cap add ios` / `cap sync`.
#
set -euo pipefail

PLIST="ios/App/App/Info.plist"

if [ ! -f "$PLIST" ]; then
  echo "ERRO: $PLIST nao encontrado. Rode 'npx cap add ios' antes deste script."
  exit 1
fi

PB="/usr/libexec/PlistBuddy"

# Define uma chave (cria se nao existir, atualiza se ja existir).
set_string() {
  local key="$1"
  local value="$2"
  if $PB -c "Print :$key" "$PLIST" >/dev/null 2>&1; then
    $PB -c "Set :$key $value" "$PLIST"
  else
    $PB -c "Add :$key string $value" "$PLIST"
  fi
}

echo "Configurando permissoes em $PLIST ..."

set_string "NSLocationWhenInUseUsageDescription" \
  "Usamos sua localizacao para mostrar o mapa, calcular rotas e acompanhar suas corridas e entregas em tempo real."
set_string "NSLocationAlwaysAndWhenInUseUsageDescription" \
  "Usamos sua localizacao em segundo plano para acompanhar corridas e entregas ativas mesmo com o app minimizado."
set_string "NSLocationAlwaysUsageDescription" \
  "Usamos sua localizacao em segundo plano para acompanhar corridas e entregas ativas mesmo com o app minimizado."
set_string "NSCameraUsageDescription" \
  "A camera e usada para verificacao facial e para fotografar documentos durante o cadastro."
set_string "NSMicrophoneUsageDescription" \
  "O microfone e usado para enviar mensagens de audio no chat da corrida."
set_string "NSPhotoLibraryUsageDescription" \
  "Acessamos suas fotos para enviar documentos e atualizar sua foto de perfil."
set_string "NSPhotoLibraryAddUsageDescription" \
  "Permite salvar comprovantes e recibos das suas corridas na galeria."

# Background modes: localizacao (tracking de motorista) + notificacoes remotas (push).
$PB -c "Delete :UIBackgroundModes" "$PLIST" >/dev/null 2>&1 || true
$PB -c "Add :UIBackgroundModes array" "$PLIST"
$PB -c "Add :UIBackgroundModes: string location" "$PLIST"
$PB -c "Add :UIBackgroundModes: string remote-notification" "$PLIST"

echo "Info.plist configurado com sucesso."
