# Configuração do Firestore para Chat em Tempo Real

## Regras de Segurança (Firestore Rules)

Cole as seguintes regras no Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função auxiliar para verificar se usuário é participante
    function isParticipant(chatData, userId) {
      return userId in chatData.participants;
    }
    
    // Regras para coleção 'chats'
    match /chats/{rideId} {
      // Permitir leitura se usuário for participante
      allow read: if isParticipant(resource.data, request.auth.uid);
      
      // Permitir criação se usuário estiver nos participants
      allow create: if request.auth.uid in request.resource.data.participants
                    && request.resource.data.participants.size() == 2;
      
      // Permitir update apenas para campos lastMessage e lastMessageAt
      allow update: if isParticipant(resource.data, request.auth.uid)
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['lastMessage', 'lastMessageAt']);
      
      // Subcoleção de mensagens
      match /messages/{messageId} {
        // Permitir leitura se usuário for participante do chat
        allow read: if isParticipant(get(/databases/$(database)/documents/chats/$(rideId)).data, request.auth.uid);
        
        // Permitir criação se:
        // 1. Usuário for participante
        // 2. senderId == auth.uid
        // 3. text tem no máximo 500 caracteres
        // 4. expireAt está no futuro
        allow create: if isParticipant(get(/databases/$(database)/documents/chats/$(rideId)).data, request.auth.uid)
                      && request.resource.data.senderId == request.auth.uid
                      && request.resource.data.text.size() <= 500
                      && request.resource.data.expireAt > request.time;
        
        // Não permitir update ou delete
        allow update, delete: if false;
      }
    }
  }
}
```

## Configuração de TTL (Time To Live)

Para configurar a expiração automática de mensagens após 24 horas:

### Via Firebase Console (Recomendado)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Firestore Database** no menu lateral
4. Clique na aba **Time-to-live (TTL)** no topo
5. Clique em **Create TTL policy**
6. Configure:
   - **Collection group**: `messages`
   - **Timestamp field**: `expireAt`
7. Clique em **Create**

### Via gcloud CLI (Alternativo)

```bash
gcloud firestore fields ttls update expireAt \
  --collection-group=messages \
  --enable-ttl
```

## Verificação

Após configurar as regras e o TTL:

1. **Teste as regras**: Use o Firebase Console > Rules > Simulator para validar
2. **Verifique TTL**: Mensagens com `expireAt` no passado devem ser automaticamente removidas
3. **Teste o chat**: Envie mensagens e verifique se aparecem em tempo real

## Estrutura de Dados

### Documento do Chat (`chats/{rideId}`)

```json
{
  "participants": ["uid_motorista", "uid_passageira"],
  "createdAt": Timestamp,
  "lastMessage": "Última mensagem enviada...",
  "lastMessageAt": Timestamp
}
```

### Mensagem (`chats/{rideId}/messages/{messageId}`)

```json
{
  "senderId": "uid_remetente",
  "text": "Texto da mensagem",
  "createdAt": Timestamp,
  "expireAt": Timestamp  // createdAt + 24 horas
}
```

## Índices Necessários

O Firestore pode solicitar a criação de índices compostos. Se receber erros de índice:

1. Clique no link do erro no console
2. Será direcionado para criar o índice automaticamente
3. Aguarde alguns minutos para o índice ser criado

Ou crie manualmente via Console > Firestore > Indexes.

## Troubleshooting

### Erro: "Missing or insufficient permissions"
- Verifique se as regras de segurança foram aplicadas corretamente
- Confirme que o usuário está autenticado
- Verifique se o usuário está na lista de participants

### Mensagens não expiram
- Confirme que o TTL foi configurado corretamente
- Verifique se o campo `expireAt` está sendo criado nas mensagens
- O TTL pode levar até 72h para começar a funcionar

### Performance lenta
- Considere adicionar limit() nas queries
- Implemente paginação para conversas com muitas mensagens
- Use índices compostos para queries complexas