# Uruchomienie

## 🛠 Development

```bash
docker compose --env-file ./backend/.env up
```

---

## 🚀 Produkcja

```bash
docker compose -f docker-compose.prod.yml --env-file ./backend/.env up -d --build
```