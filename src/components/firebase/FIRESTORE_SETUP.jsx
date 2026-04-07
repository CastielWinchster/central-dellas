# Configuração do Firestore para Chat em Tempo Real

## Regras de Segurança (Firestore Rules)

Cole as seguintes regras no Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isParticipant(chatData, userId) {
      return userId in chatData.participants;
    }
    
    match /chats/{rideId} {
      allow read: if isParticipant(resource.data, request.auth.uid);
      allow create: if request.auth.uid in request.resource.data.participants
                    && request.resource.data.participants.size() == 2;
      allow update: if isParticipant(resource.data, request.auth.uid)
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['lastMessage', 'lastMessageAt']);
      
      match /messages/{messageId} {
        allow read: if isParticipant(get(/databases/$(database)/documents/chats/$(rideId)).data, request.auth.uid);
        allow create: if isParticipant(get(/databases/$(database)/documents/chats/$(rideId)).data, request.auth.uid)
                      && request.resource.data.senderId == request.auth.uid
                      && request.resource.data.text.size() <= 500
                      && request.resource.data.expireAt > request.time;
        allow update, delete: if false;
      }
    }
  }
}
``