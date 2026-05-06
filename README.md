# Digital Dungeons

**Platforma do tworzenia i grania w tekstowe gry RPG**

Digital Dungeons to interaktywna aplikacja webowa umożliwiająca tworzenie, publikowanie i granie w tekstowe gry RPG w stylu klasycznych przygodówek konsolowych. Twórcy projektują światy w wizualnym edytorze, a gracze eksplorują je poprzez interfejs tekstowy.

---

## Spis treści

- [Funkcjonalności](#funkcjonalności)
- [Stack technologiczny](#stack-technologiczny)
- [Uruchomienie projektu](#uruchomienie-projektu)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Architektura](#architektura)
- [API Reference](#api-reference)
- [Format danych gry](#format-danych-gry)
- [Komendy gry](#komendy-gry)
- [Schemat bazy danych](#schemat-bazy-danych)
- [Zespół](#zespół)

---

## Funkcjonalności

### Edytor gier

- **Wizualny edytor mapy** — płótno (p5.js) z gridem pokojów; dodawanie pokojów przez klikanie przycisków `+` przy krawędziach, usuwanie przez badge `×` na zaznaczonym pokoju
- **Kamera i nawigacja** — zoom kółkiem myszy (proporcjonalny do prędkości scrollowania, obsługa trackpadów), panning prawym/środkowym przyciskiem myszy z pointer capture
- **Panel pokoju** (sidebar) — edycja nazwy, opisu, encji, przedmiotów, konfiguracja skrzyni (strażnik, klucz, zawartość), system konwersacji
- **Panel globalny** — nazwa i opis gry, tagi, rejestr encji (potwory, bossowie, NPC) z atrybutami (typ, hostile, upuszczane przedmioty), rejestr przedmiotów
- **Edytor konwersacji** — osobny canvas do tworzenia drzew dialogowych z węzłów, powiązany z pokojem przez `conversationId`
- **Zapis i wczytywanie** — pełna integracja z API; inline feedback (bez natywnych `alert()`); tryb ciemny wymuszony dla całego edytora

### Gameplay

- **Interfejs konsolowy** — retro terminal (fixed fullscreen, czarne tło, monospacer)
- **System pokojów** — nawigacja N/S/E/W po gridzie połączonych pokojów
- **System przedmiotów** — zbieranie, upuszczanie, używanie przedmiotów; `EXAMINE` dla szczegółów
- **System walki** — atakowanie wrogich encji, upuszczanie przedmiotów po pokonaniu
- **System konwersacji** — rozgałęzione drzewa dialogowe, numerowany wybór opcji, opcja jednorazowych i powtarzalnych rozmów
- **System skrzyni** — opcjonalny strażnik, wymagany klucz, konfigurowana zawartość
- **Zapis postępu** — automatyczny autosave stanu rozgrywki (currentRoom, inventory, roomStates) do backendu

### Marketplace

- Przeglądanie i wyszukiwanie opublikowanych gier
- Filtrowanie po tagach (multi-select), sortowanie (data, tytuł, liczba gier/polubień)
- Paginacja (12 gier per stronę, „Load more")
- System polubień (like/unlike)

### System użytkowników

- Rejestracja i logowanie (JWT, hasła hashowane bcryptjs)
- Profil użytkownika: bio, lista własnych gier, polubione gry
- Publikowanie/cofanie publikacji gier
- Historia rozgrywek per gra (`playthroughs`)
- Komentarze do gier z możliwością edycji

---

## Stack technologiczny

### Frontend

| Technologia | Wersja | Zastosowanie |
|---|---|---|
| Next.js | 15.5.4 | Framework React (App Router) |
| React | 19.1.0 | UI |
| Tailwind CSS | 4 | Stylizacja |
| p5.js | 2.1.1 | Canvas edytora i edytora konwersacji |

### Backend

| Technologia | Wersja | Zastosowanie |
|---|---|---|
| Node.js + Express | 4.18.2 | REST API, port 3001 |
| MySQL / MariaDB | — | Baza danych |
| mysql2 | 3.6.5 | Klient DB |
| bcryptjs | 2.4.3 | Hashowanie haseł |
| jsonwebtoken | 9.0.2 | Autentykacja JWT |
| express-validator | 7.0.1 | Walidacja inputów |
| cors | 2.8.5 | CORS middleware |

---

## Uruchomienie projektu

### Backend

Szczegółowe instrukcje w [backend/howToStart.md](backend/howToStart.md).

#### Opcja A — Docker (zalecane)

**Wymagania:** Node.js, Docker, docker-compose

```bash
# Uruchom bazę danych (z głównego katalogu projektu)
docker-compose up -d

cd backend
npm install
npm run dev
```

#### Opcja B — lokalna instalacja MariaDB

**Wymagania:** Node.js, MariaDB/MySQL

```bash
sudo mariadb-install-db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
sudo systemctl start mariadb
sudo mariadb-secure-installation
```

```sql
CREATE DATABASE digital_dungeons;
CREATE USER 'ddungeons'@'localhost' IDENTIFIED BY 'twoje_haslo';
GRANT ALL PRIVILEGES ON digital_dungeons.* TO 'ddungeons'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
cd backend
mysql -u ddungeons -p digital_dungeons < init-db.sql
npm install
npm run dev
```

#### Zmienne środowiskowe

Utwórz plik `backend/.env`:

```env
PORT=3001
DB_HOST=localhost
DB_USER=ddungeons
DB_PASSWORD=twoje_haslo
DB_NAME=digital_dungeons
JWT_SECRET=twoj_tajny_klucz
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

#### 5. Uruchomienie

```bash
cd backend
npm install
npm start          # produkcja
npm run dev        # development (nodemon)
```

---

### Frontend

**Wymagania:** Node.js

```bash
cd frontend
npm install
npm run dev        # development (http://localhost:3000)
npm run build      # build produkcyjny
npm start          # uruchomienie builda
```

---

## Architektura

```
Digital-Dungeons/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express app, CORS, middleware, route mounting
│   │   ├── config/
│   │   │   └── database.js    # Połączenie z MySQL
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT verify (auth, optionalAuth)
│   │   │   └── errorHandler.js
│   │   ├── models/            # Klasy z zapytaniami SQL
│   │   │   ├── User.js
│   │   │   ├── Game.js
│   │   │   ├── Playthrough.js
│   │   │   ├── Like.js
│   │   │   └── Comment.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── users.js
│   │       ├── games.js
│   │       ├── playthroughs.js
│   │       ├── likes.js
│   │       └── comments.js
│   ├── init-db.sql            # Schemat + przykładowe gry
│   └── reset-db.js            # Skrypt resetu bazy
│
└── frontend/
    ├── src/
    │   ├── app/               # Next.js App Router
    │   │   ├── page.js            # Strona główna
    │   │   ├── login/
    │   │   ├── register/
    │   │   ├── editor/            # Edytor gier (wymusza dark mode)
    │   │   ├── play/              # Gameplay z autosavem
    │   │   ├── marketplace/
    │   │   ├── profile/
    │   │   └── game/[id]/         # Szczegóły gry + komentarze
    │   ├── components/
    │   │   ├── RPGEditorCanvas.jsx          # p5.js canvas edytora
    │   │   ├── EditorSidebar.jsx            # Panel właściwości
    │   │   ├── ConversationCanvas.jsx       # Edytor drzew dialogowych
    │   │   ├── EditConversationNodeModal.jsx
    │   │   ├── GameConsole.jsx              # Interfejs gry (terminal)
    │   │   ├── Nav.jsx / Header.jsx / Footer.jsx
    │   │   ├── LoginForm.js / RegisterForm.js
    │   │   ├── EditProfileModal.js
    │   │   └── ThemeToggle.jsx
    │   ├── lib/
    │   │   ├── api.js             # Wrapper do backendu (fetch)
    │   │   ├── AuthContext.js     # Context JWT + user state
    │   │   └── game/
    │   │       ├── commandParser.js    # Parsowanie komend tekstowych
    │   │       ├── gameActions.js      # Logika akcji (move, take, attack…)
    │   │       ├── conversationSystem.js
    │   │       └── roomHelpers.js
    │   ├── p5/
    │   │   ├── sketchFactory.js          # Sketch edytora mapy
    │   │   └── conversationSketchFactory.js  # Sketch edytora konwersacji
    │   └── providers/
    │       ├── BridgeProvider.jsx           # Bridge edytor ↔ React
    │       ├── ConversationBridgeProvider.jsx
    │       └── NoScroll.jsx
    └── public/
        ├── icon.svg
        ├── rpg-editor-bridge.js         # Globalny bridge dla p5 → React
        └── conversation-editor-bridge.js
```

### Komunikacja edytor ↔ React

Canvas p5.js działa poza drzewem React. Komunikacja odbywa się przez globalny obiekt `window.RPGEditorBridge` (wstrzykiwany przez `BridgeProvider`) oraz zdarzenia DOM:

- `editor-selection-change` — zmiana zaznaczonego pokoju
- `editor-state-snapshot` — aktualizacja stanu całego edytora
- `window.__editorSetRoomMeta(roomId, updater)` — zapis metadanych pokoju
- `window.__editorSetGlobalMeta(meta)` — zapis globalnych metadanych gry
- `window.__editorSetStartingRoom(roomId)` — ustawienie pokoju startowego
- `window.__editorResetToInitial()` — reset edytora do załadowanych danych
- `window.__editorCleanMetadata()` — czyszczenie wszystkich metadanych

---

## API Reference

Wszystkie endpointy zaczynają się od `http://localhost:3001/api`.  
Endpointy oznaczone 🔒 wymagają nagłówka `Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Metoda | Ścieżka | Opis | Body |
|---|---|---|---|
| POST | `/register` | Rejestracja | `{ username, email, password }` |
| POST | `/login` | Logowanie | `{ email, password }` |
| GET | `/me` | Dane zalogowanego użytkownika 🔒 | — |

### Users — `/api/users`

| Metoda | Ścieżka | Opis |
|---|---|---|
| GET | `/:userId` | Profil użytkownika |
| PUT | `/profile` | Aktualizacja profilu 🔒 |
| GET | `/:userId/games` | Gry użytkownika |
| GET | `/:userId/likes` | Polubione gry (query: `limit`, `offset`) |
| GET | `/:userId/playthroughs` | Rozgrywki użytkownika 🔒 |
| GET | `/:userId/stats` | Statystyki aktywności |

### Games — `/api/games`

| Metoda | Ścieżka | Opis | Uwagi |
|---|---|---|---|
| GET | `/` | Lista opublikowanych gier | query: `limit`, `offset`, `tags` |
| GET | `/:id` | Szczegóły gry | |
| POST | `/` | Utwórz grę 🔒 | body: `{ title, description, gameContent }` |
| PUT | `/:id` | Aktualizuj grę 🔒 | |
| DELETE | `/:id` | Usuń grę 🔒 | |
| GET | `/user/:userId` | Gry autora | drafty widoczne tylko dla właściciela 🔒 |

### Playthroughs — `/api/playthroughs`

| Metoda | Ścieżka | Opis |
|---|---|---|
| GET | `/user` | Rozgrywki zalogowanego użytkownika 🔒 |
| GET | `/by-game/:gameId` | Rozgrywka dla konkretnej gry 🔒 |
| GET | `/:id` | Szczegóły rozgrywki (tylko właściciel) 🔒 |
| PUT | `/:id` | Aktualizuj stan gry 🔒 — body: `{ gameState, status }` |
| DELETE | `/:id` | Usuń rozgrywkę 🔒 |
| POST | `/continue/:gameId` | Pobierz lub utwórz rozgrywkę; inkrementuje `plays_count` 🔒 |
| POST | `/reset/:gameId` | Reset stanu rozgrywki (zachowuje play count) 🔒 |

### Likes — `/api/likes`

| Metoda | Ścieżka | Opis |
|---|---|---|
| POST | `/:gameId` | Polub grę 🔒 |
| DELETE | `/:gameId` | Usuń polubienie 🔒 |
| GET | `/user/:userId` | Polubione gry użytkownika (query: `limit`, `offset`) |
| GET | `/check/:gameId` | Czy gra jest polubiona przez zalogowanego 🔒 |

### Comments — `/api/comments`

| Metoda | Ścieżka | Opis |
|---|---|---|
| GET | `/game/:gameId` | Komentarze do gry (query: `limit`, `offset`) |
| POST | `/:gameId` | Dodaj komentarz 🔒 — body: `{ content }` (max 1000 znaków) |
| PUT | `/:commentId` | Edytuj komentarz 🔒 |
| DELETE | `/:commentId` | Usuń komentarz 🔒 |

### Health

| Metoda | Ścieżka | Opis |
|---|---|---|
| GET | `/health` | Status serwera |

---

## Format danych gry

Pole `game_content` gry oraz `game_state` rozgrywki przechowywane są jako JSON.

### Struktura `game_content`

```json
{
  "rooms": [
    {
      "id": "0,0",
      "gx": 0,
      "gy": 0,
      "meta": {
        "name": "Mroczna komnata",
        "description": "Wilgotna kamienna komnata...",
        "isStart": true,
        "entities": ["goblin_scout"],
        "items": ["torch"],
        "conversationId": "goblin_greeting",
        "conversationRepeatable": false,
        "conversationState": { "nodes": [...] },
        "hasChest": true,
        "chestGuardian": "goblin_chief",
        "chestRequiresKey": "rusty_key",
        "chestContents": ["gold_coin", "health_potion"]
      }
    }
  ],
  "selected": "0,0",
  "globalMeta": {
    "gameName": "Goblin Caves",
    "gameDescription": "Eksploruj jaskinie pełne goblinów...",
    "tags": ["cave", "goblins", "loot"],
    "entities": [
      {
        "id": "goblin_scout",
        "name": "Goblin Zwiadowca",
        "type": "monster",
        "description": "Mały, zwinny goblin.",
        "hostile": true,
        "drops": ["rusty_key"]
      },
      {
        "id": "village_elder",
        "name": "Starszyzna Wioski",
        "type": "person",
        "description": "Mądry starzec.",
        "hostile": false,
        "drops": []
      }
    ],
    "items": [
      {
        "id": "torch",
        "name": "Pochodnia",
        "description": "Oświetla ciemne korytarze."
      }
    ]
  }
}
```

### Struktura `game_state` (playthrough)

```json
{
  "currentRoomId": "1,0",
  "inventory": ["torch", "rusty_key"],
  "roomStates": {
    "0,0": {
      "items": ["health_potion"],
      "defeatedEntities": ["goblin_scout"],
      "chestOpened": false,
      "conversationSelected": "node_2"
    }
  }
}
```

### Typy encji

| Typ | Opis |
|---|---|
| `monster` | Potwór, może być wrogi |
| `boss` | Boss, może być wrogi |
| `person` | NPC, zazwyczaj niewrogi |

---

## Komendy gry

Wpisywane w polu tekstowym konsoli (wielkość liter nieistotna).

### Ruch

| Komenda | Opis |
|---|---|
| `N` / `GO NORTH` | Idź na północ |
| `S` / `GO SOUTH` | Idź na południe |
| `E` / `GO EAST` | Idź na wschód |
| `W` / `GO WEST` | Idź na zachód |

### Informacje

| Komenda | Opis |
|---|---|
| `HELP` / `H` | Lista dostępnych komend |
| `LOOK` / `L` | Ponowny opis aktualnej lokacji |
| `INVENTORY` / `INV` / `I` | Zawartość ekwipunku |

### Przedmioty

| Komenda | Opis |
|---|---|
| `TAKE <przedmiot>` / `GET` / `PICKUP` | Podnieś przedmiot |
| `DROP <przedmiot>` | Upuść przedmiot |
| `USE <przedmiot>` | Użyj przedmiotu |
| `EXAMINE <cel>` / `INSPECT` / `X` | Zbadaj przedmiot lub NPC |

### Interakcja

| Komenda | Opis |
|---|---|
| `TALK <npc>` / `SPEAK <npc>` | Rozpocznij rozmowę z NPC |
| `ATTACK <wróg>` / `KILL` / `FIGHT` | Zaatakuj wroga |
| `OPEN CHEST` | Otwórz skrzynię w pokoju |
| `<cyfra>` | Wybierz opcję dialogową (np. `1`, `2`, `3`) |
| `QUIT` / `EXIT` | Zapisz i wyjdź z gry |

---

## Schemat bazy danych

### `users`

| Kolumna | Typ | Opis |
|---|---|---|
| `user_id` | INT PK AUTO_INCREMENT | |
| `username` | VARCHAR(50) UNIQUE | |
| `email` | VARCHAR(100) UNIQUE | |
| `password` | VARCHAR(255) | Hash bcrypt |
| `join_date` | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| `last_login` | DATETIME | |
| `profile_bio` | TEXT | |
| `is_active` | BOOLEAN | DEFAULT TRUE |

### `games`

| Kolumna | Typ | Opis |
|---|---|---|
| `game_id` | INT PK AUTO_INCREMENT | |
| `title` | VARCHAR(100) | |
| `description` | TEXT | |
| `author_id` | INT FK → users | ON DELETE CASCADE |
| `create_date` | DATETIME | |
| `update_date` | DATETIME | Auto-updated |
| `game_content` | JSON | Pełna struktura gry |
| `is_published` | BOOLEAN | DEFAULT FALSE |
| `likes_count` | INT | DEFAULT 0 |
| `plays_count` | INT | DEFAULT 0 |

### `playthroughs`

| Kolumna | Typ | Opis |
|---|---|---|
| `playthrough_id` | INT PK AUTO_INCREMENT | |
| `game_id` | INT FK → games | ON DELETE CASCADE |
| `user_id` | INT FK → users | ON DELETE CASCADE |
| `start_date` | DATETIME | |
| `last_active` | DATETIME | Auto-updated |
| `game_state` | JSON | Stan rozgrywki |
| `status` | ENUM | `in_progress`, `completed`, `abandoned` |

### `likes`

| Kolumna | Typ | Opis |
|---|---|---|
| `like_id` | INT PK AUTO_INCREMENT | |
| `user_id` | INT FK → users | UNIQUE z game_id |
| `game_id` | INT FK → games | |
| `date_liked` | DATETIME | |

### `comments`

| Kolumna | Typ | Opis |
|---|---|---|
| `comment_id` | INT PK AUTO_INCREMENT | |
| `game_id` | INT FK → games | ON DELETE CASCADE |
| `user_id` | INT FK → users | ON DELETE CASCADE |
| `content` | TEXT | Max 1000 znaków |
| `date_posted` | DATETIME | |
| `is_edited` | BOOLEAN | DEFAULT FALSE |

---

## Zespół

Projekt rozwijany w ramach pracy licencjackiej:

- **Maciej Nasiadka**
- **Maciej Wojciechowski**
- **Michał Ryduchowski**

---

**Rozpoczęto:** Październik 2025 · **Status:** W rozwoju
