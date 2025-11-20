// MongoDB Initialisierungsskript
db = db.getSiblingDB('debate');

// Erstelle Collections
db.createCollection('debates');

// Erstelle Indizes für bessere Performance
db.debates.createIndex({ "creatorId": 1 });
db.debates.createIndex({ "status": 1 });
db.debates.createIndex({ "participantIds": 1 });
db.debates.createIndex({ "createdAt": -1 });
db.debates.createIndex({ "title": "text", "description": "text" });

print('MongoDB initialization completed successfully');

