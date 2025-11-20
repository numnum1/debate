# Swagger API Dokumentation

## 🎯 Übersicht

Die Debate Server API ist jetzt mit **SpringDoc OpenAPI 3** und **Swagger UI** ausgestattet. Die API-Dokumentation wird automatisch generiert und ist über eine interaktive Web-Oberfläche zugänglich.

## 🚀 Zugriff auf Swagger UI

### Lokaler Development Server

Nach dem Start des Servers sind folgende URLs verfügbar:

- **Swagger UI (Interactive Docs)**: http://localhost:1933/api/swagger-ui.html
- **OpenAPI JSON**: http://localhost:1933/api/v3/api-docs
- **OpenAPI YAML**: http://localhost:1933/api/v3/api-docs.yaml

> **Hinweis**: Der Context-Path `/api` ist in der `application.yml` konfiguriert

## 🔐 Authentifizierung in Swagger UI

Die meisten Endpoints benötigen JWT-Authentifizierung. So authentifizieren Sie sich in Swagger UI:

### 1. Token von Keycloak abrufen

```bash
curl -X POST http://localhost:8180/realms/debate/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=YOUR_USERNAME" \
  -d "password=YOUR_PASSWORD" \
  -d "grant_type=password" \
  -d "client_id=debate-server"
```

### 2. Token in Swagger UI eingeben

1. Öffnen Sie Swagger UI: http://localhost:1933/api/swagger-ui.html
2. Klicken Sie auf den **"Authorize"** Button (🔓 oben rechts)
3. Fügen Sie Ihren JWT-Token ein (nur den Token-Wert, **ohne** "Bearer" Präfix)
4. Klicken Sie auf **"Authorize"**
5. Klicken Sie auf **"Close"**

Jetzt können Sie alle authentifizierten Endpoints direkt in Swagger UI testen!

## 📝 Features

### Automatisch generierte Dokumentation

- **Request/Response Schemas**: Alle Model-Klassen werden automatisch dokumentiert
- **Validierungen**: Jakarta Validation Annotations werden in der Dokumentation angezeigt
- **Security Requirements**: Endpoints mit Authentifizierung sind markiert
- **Try it out**: Alle Endpoints können direkt getestet werden

### Konfigurierte Features

✅ **Operation Sorting**: Alphabetisch sortiert  
✅ **Tag Sorting**: Alphabetisch sortiert  
✅ **Request Duration**: Zeigt Antwortzeiten an  
✅ **Filter**: Suchfunktion für Endpoints  
✅ **Try it out**: Direkt aktiviert

## 🛠️ Konfiguration

### application.yml

```yaml
springdoc:
  api-docs:
    path: /v3/api-docs
    enabled: true
  swagger-ui:
    path: /swagger-ui.html
    enabled: true
    operations-sorter: alpha
    tags-sorter: alpha
    display-request-duration: true
    doc-expansion: none
    try-it-out-enabled: true
    filter: true
```

### SecurityConfig.java

Die folgenden Endpoints sind öffentlich zugänglich (keine Authentifizierung erforderlich):

```java
.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
```

## 📚 Controller Annotationen

Ihre Controller verwenden jetzt OpenAPI-Annotationen für bessere Dokumentation:

```java
@Tag(name = "Debates", description = "Debate Management API")
@SecurityRequirement(name = "bearerAuth")
public class DebateController {
    
    @Operation(
        summary = "Alle Debatten abrufen",
        description = "Ruft eine Liste aller verfügbaren Debatten ab."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Erfolgreich"),
        @ApiResponse(responseCode = "401", description = "Nicht authentifiziert")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<List<Debate>>> getAllDebates() {
        // ...
    }
}
```

## 🎨 API Informationen

Die API-Metadaten werden in `OpenApiConfig.java` definiert:

- **Titel**: Debate Server API
- **Beschreibung**: REST API für die Debate-Plattform
- **Version**: 1.0.0
- **Security**: Bearer Token (JWT)
- **Server**: Automatisch konfiguriert für lokalen Development

## 🔧 Erweiterte Konfiguration

### Zusätzliche Annotationen

Sie können weitere Annotationen zu Ihren Controllern und Models hinzufügen:

#### @Schema (für Model-Klassen)
```java
@Schema(description = "Debate-Modell für Diskussionen")
public class Debate {
    
    @Schema(description = "Eindeutige ID der Debate", example = "60d5ec49f1b2c8b9e8c4a1b2")
    private String id;
    
    @Schema(description = "Titel der Debate", example = "Klimawandel Diskussion", required = true)
    private String title;
}
```

#### @Parameter (für Methoden-Parameter)
```java
@GetMapping("/{id}")
public ResponseEntity<Debate> getById(
    @Parameter(description = "ID der Debate", required = true)
    @PathVariable String id
) { ... }
```

### Swagger UI Anpassungen

Passen Sie `application.yml` an, um das Verhalten zu ändern:

```yaml
springdoc:
  swagger-ui:
    doc-expansion: list    # oder 'full' / 'none'
    default-models-expand-depth: 1
    default-model-expand-depth: 1
    disable-swagger-default-url: true
```

## 📖 Weitere Ressourcen

- [SpringDoc OpenAPI Dokumentation](https://springdoc.org/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

## 🐛 Troubleshooting

### Swagger UI lädt nicht

1. Überprüfen Sie, ob der Server läuft: http://localhost:1933/api/actuator/health
2. Überprüfen Sie die Logs auf Fehler
3. Stellen Sie sicher, dass Port 1933 nicht blockiert ist

### Endpoints nicht sichtbar

1. Überprüfen Sie, ob der Controller im Component Scan enthalten ist
2. Stellen Sie sicher, dass `@RestController` und `@RequestMapping` korrekt gesetzt sind
3. Prüfen Sie die SpringDoc-Konfiguration in `application.yml`

### Authentifizierung funktioniert nicht

1. Überprüfen Sie, ob Keycloak läuft: http://localhost:8180
2. Prüfen Sie, ob der JWT-Token gültig ist
3. Stellen Sie sicher, dass Sie nur den Token-Wert (ohne "Bearer") eingeben

---

**Viel Erfolg mit Ihrer API-Dokumentation! 🚀**

