# Uruchomienie z Dockerem

Wymaga: Docker + Docker Compose

## 1. Uruchom bazę danych

Z głównego katalogu projektu:

```bash
docker-compose up -d
```

Baza startuje na `localhost:3306`. Schemat i przykładowe dane ładują się automatycznie z `init-db.sql`.

## 2. Uruchom backend

```bash
cd backend
npm install
npm run dev
```

Serwer działa na `http://localhost:3001`.

---

## Zarządzanie bazą

```bash
# Zatrzymanie (dane zachowane)
docker-compose down

# Zatrzymanie + usunięcie danych
docker-compose down -v

# Ponowne uruchomienie
docker-compose up -d
```
