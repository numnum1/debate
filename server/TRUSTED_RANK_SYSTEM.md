# Trusted Rank System

## Übersicht

Das **Trusted Rank System** ermöglicht es, Benutzer der Debate-App nach Vertrauensstufen zu kategorisieren. Dies ist nützlich für die Moderation und Qualitätssicherung in öffentlichen Debatten.

## Vertrauensstufen

Das System kennt zwei Stufen:

| Rank | Bezeichnung | Beschreibung |
|------|-------------|--------------|
| `unknown` | Unbekannter | Neue oder nicht verifizierte Benutzer (Standard) |
| `trusted` | Vertraut | Verifizierte und vertrauenswürdige Benutzer |

## Datenmodell

### MongoDB User Collection

```java
@Document(collection = "users")
public class User {
    @Id
    private String id;              // Keycloak User-ID
    private String name;
    private String email;
    private String avatar;
    
    @Builder.Default
    private String trustedRank = "unknown";  // "unknown" oder "trusted"
}
```

### TypeScript Frontend Type

```typescript
export interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  trustedRank?: 'unknown' | 'trusted';
}
```

## API Endpoints

### 1. Vertrauens-Rang setzen

**PUT** `/api/users/{userId}/trusted-rank?trustedRank={rank}`

Setzt den Vertrauens-Rang eines Benutzers.

**Request:**
```bash
curl -X PUT "http://localhost:1933/api/users/abc-123-xyz/trusted-rank?trustedRank=trusted" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "abc-123-xyz",
    "name": "Max Mustermann",
    "email": "max@example.com",
    "trustedRank": "trusted"
  },
  "message": "Vertrauens-Rang auf 'trusted' aktualisiert"
}
```

**Error Response (ungültiger Rank):**
```json
{
  "success": false,
  "error": "Invalid trusted rank. Must be 'unknown' or 'trusted'"
}
```

### 2. Benutzer nach Rang filtern

**GET** `/api/users/by-rank/{trustedRank}`

Gibt alle Benutzer mit einem bestimmten Vertrauens-Rang zurück.

**Request:**
```bash
curl "http://localhost:1933/api/users/by-rank/trusted" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc-123-xyz",
      "name": "Max Mustermann",
      "email": "max@example.com",
      "trustedRank": "trusted"
    }
  ]
}
```

### 3. Aktuellen Benutzer abrufen (mit Rank)

**GET** `/api/users/me`

Gibt die Informationen des aktuell eingeloggten Benutzers inkl. `trustedRank` zurück.

**Request:**
```bash
curl "http://localhost:1933/api/users/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "abc-123-xyz",
    "name": "Max Mustermann",
    "email": "max@example.com",
    "trustedRank": "unknown"
  }
}
```

## Verhalten

### Neue Benutzer

Wenn ein neuer Benutzer sich anmeldet:
1. User wird beim Login automatisch in MongoDB gecacht
2. Default `trustedRank` wird auf `"unknown"` gesetzt
3. User kann normal an Debatten teilnehmen

### Synchronisation aus Keycloak

Beim Synchronisieren von Benutzern aus Keycloak:
- **Neue User**: Erhalten automatisch `trustedRank = "unknown"`
- **Existierende User**: Der vorhandene `trustedRank` bleibt **erhalten**

```java
// In UserService.syncUsersFromKeycloak()
Optional<User> existingUser = userRepository.findById(user.getId());
if (existingUser.isPresent()) {
    // Preserve existing trustedRank
    user.setTrustedRank(existingUser.get().getTrustedRank());
} else {
    // Set default for new users
    user.setTrustedRank("unknown");
}
```

### Login-Caching

Beim Login wird der User automatisch gecacht:
- **Name und Email** werden aus dem JWT Token aktualisiert
- **trustedRank** bleibt **erhalten** und wird nicht überschrieben

```java
// In UserService.cacheUser()
if (existingUser.isPresent()) {
    // Preserve trustedRank when updating from JWT
    user.setTrustedRank(existing.getTrustedRank());
}
```

## Anwendungsfälle

### 1. Moderatoren-Dashboard

Moderatoren können User-Profile aufrufen und den Trust-Status ändern:

```typescript
// Frontend
const promoteTrusted = async (userId: string) => {
  const response = await fetch(
    `${API_URL}/users/${userId}/trusted-rank?trustedRank=trusted`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  // ...
};
```

### 2. Filterung in Einladungen

Bei der Einladung zu Debatten nur verifizierte User anzeigen:

```typescript
// Frontend
const fetchTrustedUsers = async () => {
  const response = await fetch(
    `${API_URL}/users/by-rank/trusted`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  // ...
};
```

### 3. Badge/Badge-Anzeige

User mit `trustedRank: "vertraut"` können ein Verifizierungs-Badge erhalten:

```tsx
// UserAvatar.tsx
{user.trustedRank === 'trusted' && (
  <View style={styles.verifiedBadge}>
    <Text>✓</Text>
  </View>
)}
```

### 4. Öffentliche Debatten

Optional: Nur `vertraut`-User dürfen öffentliche Debatten erstellen:

```java
// DebateService.createDebate()
if (debate.isPublic() && !user.getTrustedRank().equals("trusted")) {
    throw new UnauthorizedException("Only trusted users can create public debates");
}
```

## Sicherheit

### Berechtigungen

Aktuell kann **jeder authentifizierte Benutzer** den Trust-Rank ändern. Für Produktions-Umgebungen sollten Sie eine Rolle einführen:

```java
@PutMapping("/{userId}/trusted-rank")
@PreAuthorize("hasRole('MODERATOR') or hasRole('ADMIN')")
public ResponseEntity<ApiResponse<User>> updateTrustedRank(...) {
    // ...
}
```

### Keycloak Rollen-Setup

1. In Keycloak Admin Console:
   - **Realm Roles** → Create Role: `MODERATOR`
   - **Users** → User auswählen → **Role Mappings** → Assign `MODERATOR`

2. Im SecurityConfig ist die Rollen-Extraktion bereits implementiert:
   ```java
   // SecurityConfig.jwtAuthenticationConverter()
   Collection<GrantedAuthority> realmRoles = extractRealmRoles(jwt.getClaims());
   ```

## Migration

### Bestehende User

Wenn Sie das System auf eine bestehende Installation anwenden:

1. **Alle User erhalten automatisch `"unknown"`** beim nächsten Login
2. **Optional**: Einmalige Migration aller User:

```bash
# MongoDB Shell
use debate
db.users.updateMany(
  { trustedRank: { $exists: false } },
  { $set: { trustedRank: "unknown" } }
)
```

3. **Admin-User manuell zu "trusted" setzen**:

```bash
curl -X PUT "http://localhost:1933/api/users/{ADMIN_USER_ID}/trusted-rank?trustedRank=trusted" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Testing

### Postman Collection

Fügen Sie diese Requests zu Ihrer Collection hinzu:

```json
{
  "name": "Set User Trusted Rank",
  "request": {
    "method": "PUT",
    "url": "{{BASE_URL}}/users/{{USER_ID}}/trusted-rank",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{ACCESS_TOKEN}}"
      }
    ],
    "url": {
      "query": [
        {
          "key": "trustedRank",
          "value": "trusted"
        }
      ]
    }
  }
}
```

### Unit Tests

```java
@Test
void shouldUpdateTrustedRank() {
    User user = userService.updateTrustedRank("user-123", "trusted");
    assertEquals("trusted", user.getTrustedRank());
}

@Test
void shouldThrowExceptionForInvalidRank() {
    assertThrows(IllegalArgumentException.class, 
        () -> userService.updateTrustedRank("user-123", "invalid"));
}
```

## Zusammenfassung

✅ **Default-Wert**: Neue User sind `"unknown"`  
✅ **Persistenz**: Rank wird in MongoDB gespeichert  
✅ **Schutz**: Rank bleibt bei Login/Sync erhalten  
✅ **API**: Einfache Endpoints zum Setzen/Filtern  
✅ **Frontend-Ready**: TypeScript Types aktualisiert  

Das System ist bereit für die Verwendung in der Debate-App! 🎉

