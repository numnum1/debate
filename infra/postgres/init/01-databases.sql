-- Läuft nur beim allerersten Start des Postgres-Containers (leeres Volume).

CREATE USER keycloak WITH PASSWORD 'keycloak';
CREATE DATABASE keycloak OWNER keycloak;

CREATE USER debate WITH PASSWORD 'debate';
CREATE DATABASE ledger OWNER debate;
