# Projekt Bazy Danych dla Platformy z Grami RPG

## Spis Treści
- Opis projektu
- Diagram ER
- Szczegółowy opis tabel
- Relacje
- Indeksy

## Opis projektu

Baza danych obsługuje platformę internetową z grami RPG, gdzie użytkownicy mogą:
- Zakładać konta
- Przeglądać i grać w gry tekstowe
- Oznaczać gry jako polubione
- Tworzyć własne gry
- Przeglądać historię swoich rozgrywek
- Dodawać komentarze do gier

## Diagram ER

```
+-------------+       +---------------+       +----------------+
|   USERS     |       |    GAMES      |       |  PLAYTHROUGHS  |
+-------------+       +---------------+       +----------------+
| PK user_id  |------>| PK game_id    |------>| PK playthrough_id |
|  username   |       |  title        |       |  FK game_id    |
|  email      |       |  description  |       |  FK user_id    |
|  password   |       |  FK author_id |       |  start_date    |
|  join_date  |       |  create_date  |       |  last_active   |
|  last_login |       |  update_date  |       |  game_state    |
|  profile    |       |  game_content |       |  status        |
+-------------+       +---------------+       +----------------+
       |                     |
       |                     |
       v                     v
+-------------+       +---------------+
|    LIKES    |       |   COMMENTS    |
+-------------+       +---------------+
| PK like_id  |       | PK comment_id |
| FK user_id  |       | FK game_id    |
| FK game_id  |       | FK user_id    |
| date_liked  |       | content       |
+-------------+       | date_posted   |
                      +---------------+
```

## Szczegółowy opis tabel

### Users

| Kolumna      | Typ danych     | Opis                          |
|--------------|----------------|-------------------------------|
| user_id      | INT            | Klucz główny, auto increment  |
| username     | VARCHAR(50)    | Unikalna nazwa użytkownika    |
| email        | VARCHAR(100)   | Unikalny adres email          |
| password     | VARCHAR(255)   | Zahaszowane hasło             |
| join_date    | DATETIME       | Data rejestracji              |
| last_login   | DATETIME       | Data ostatniego logowania     |
| profile      | TEXT           | Dodatkowe informacje o użytkowniku |

### Games

| Kolumna      | Typ danych     | Opis                           |
|--------------|----------------|---------------------------------|
| game_id      | INT            | Klucz główny, auto increment    |
| title        | VARCHAR(100)   | Tytuł gry                       |
| description  | TEXT           | Opis gry                        |
| author_id    | INT            | Klucz obcy - twórca gry (Users) |
| create_date  | DATETIME       | Data utworzenia gry             |
| update_date  | DATETIME       | Data ostatniej aktualizacji     |
| game_content | JSON           | Zawartość gry w formacie JSON   |
| likes_count  | INT            | Licznik polubień (opcjonalnie)  |
| plays_count  | INT            | Licznik rozegrań (opcjonalnie)  |

### Playthroughs (Rozgrywki)

| Kolumna         | Typ danych     | Opis                                    |
|-----------------|----------------|----------------------------------------|
| playthrough_id  | INT            | Klucz główny, auto increment           |
| game_id         | INT            | Klucz obcy - gra (Games)               |
| user_id         | INT            | Klucz obcy - gracz (Users)             |
| start_date      | DATETIME       | Data rozpoczęcia rozgrywki             |
| last_active     | DATETIME       | Data ostatniej aktywności              |
| game_state      | JSON           | Stan gry zapisany w formacie JSON      |
| status          | ENUM           | Status: 'in_progress', 'completed'     |

### Likes (Polubienia)

| Kolumna      | Typ danych     | Opis                                  |
|--------------|----------------|---------------------------------------|
| like_id      | INT            | Klucz główny, auto increment          |
| user_id      | INT            | Klucz obcy - użytkownik (Users)       |
| game_id      | INT            | Klucz obcy - gra (Games)              |
| date_liked   | DATETIME       | Data polubienia                       |

### Comments (Komentarze)

| Kolumna      | Typ danych     | Opis                                  |
|--------------|----------------|---------------------------------------|
| comment_id   | INT            | Klucz główny, auto increment          |
| game_id      | INT            | Klucz obcy - gra (Games)              |
| user_id      | INT            | Klucz obcy - autor komentarza (Users) |
| content      | TEXT           | Treść komentarza                      |
| date_posted  | DATETIME       | Data dodania komentarza               |

## Relacje

1. **Users - Games**:
   - Jeden użytkownik może utworzyć wiele gier
   - Relacja one-to-many (1:N)

2. **Users - Playthroughs**:
   - Jeden użytkownik może mieć wiele rozgrywek
   - Relacja one-to-many (1:N)

3. **Games - Playthroughs**:
   - Jedna gra może mieć wiele rozgrywek
   - Relacja one-to-many (1:N)

4. **Users - Likes - Games**:
   - Użytkownicy mogą polubić wiele gier
   - Gry mogą być polubione przez wielu użytkowników
   - Relacja many-to-many (M:N) z tabelą Likes jako łącznikiem

5. **Users - Comments - Games**:
   - Użytkownicy mogą dodawać wiele komentarzy do gier
   - Gry mogą mieć wiele komentarzy od różnych użytkowników
   - Relacja many-to-many (M:N) z tabelą Comments jako łącznikiem

## Indeksy

1. **Users**:
   - PRIMARY KEY na `user_id`
   - UNIQUE INDEX na `username`
   - UNIQUE INDEX na `email`
   - INDEX na `join_date`

2. **Games**:
   - PRIMARY KEY na `game_id`
   - INDEX na `author_id`
   - INDEX na `create_date`
   - INDEX na `title` (dla wyszukiwania)

3. **Playthroughs**:
   - PRIMARY KEY na `playthrough_id`
   - INDEX na `game_id`
   - INDEX na `user_id`
   - COMPOSITE INDEX na `(user_id, game_id)`

4. **Likes**:
   - PRIMARY KEY na `like_id`
   - UNIQUE INDEX na `(user_id, game_id)` (użytkownik może polubić grę tylko raz)
   - INDEX na `game_id`

5. **Comments**:
   - PRIMARY KEY na `comment_id`
   - INDEX na `game_id`
   - INDEX na `user_id`
   - INDEX na `date_posted`