# Digital Dungeons - Gameplay Features

## Zaimplementowane funkcje rozgrywki

### 1. System Poruszania się
- **Komendy:** `N`, `S`, `E`, `W`, `NORTH`, `SOUTH`, `EAST`, `WEST`, `GO <kierunek>`
- Gracz może się poruszać między pokojami używając skrótów kierunkowych
- System automatycznie sprawdza czy ruch w danym kierunku jest możliwy

### 2. System Inwentarza
- **Komenda:** `INVENTORY`, `INV`, `I`
- Gracz posiada inwentarz, w którym może przechowywać przedmioty
- Wyświetlane są nazwy i opisy wszystkich przedmiotów w posiadaniu

### 3. Podnoszenie Przedmiotów
- **Komendy:** `TAKE <przedmiot>`, `GET <przedmiot>`, `PICKUP <przedmiot>`
- Przedmioty można podnosić z pokoi używając ich nazwy
- Po podniesieniu przedmiot zostaje przeniesiony do inwentarza gracza

### 4. Upuszczanie Przedmiotów
- **Komenda:** `DROP <przedmiot>`
- Przedmioty z inwentarza można upuścić w bieżącym pokoju
- Upuszczone przedmioty stają się dostępne do podniesienia w danym pokoju

### 5. Używanie Przedmiotów
- **Komenda:** `USE <przedmiot>`
- Różne przedmioty mają różne efekty:
  - **Mikstury (potions):** Zostaną wypite i znikną z inwentarza
  - **Klucze (keys):** Mogą być trzymane do otwierania zamków
  - **Pochodnie (torch):** Rozjaśniają obszar
  - Inne przedmioty mają swoje unikalne zachowania

### 6. System Skrzyń
- **Komenda:** `OPEN CHEST`
- Niektóre pokoje zawierają skrzynie z losową zawartością
- Po otwarciu skrzyni przedmioty trafiają do pokoju (można je podnieść)
- Każda skrzynia może być otwarta tylko raz

### 7. Interakcje z NPC
- **Komenda:** `TALK <npc>`, `SPEAK <npc>`
- Gracze mogą rozmawiać z postaciami znajdującymi się w pokoju
- NPC są widoczne w opisie pokoju
- System obsługuje podstawowe dialogi (zaawansowany system dialogów do implementacji)

### 8. Badanie Otoczenia
- **Komenda:** `EXAMINE <cel>`, `INSPECT <cel>`, `X <cel>`
- Gracz może zbadać przedmioty (w pokoju lub w inwentarzu)
- Można też zbadać NPC, aby uzyskać więcej informacji
- Wyświetlane są szczegółowe opisy badanych obiektów

### 9. Przeglądanie Lokacji
- **Komenda:** `LOOK`, `L`
- Wyświetla pełny opis bieżącego pokoju
- Pokazuje:
  - Opis lokacji
  - Obecne NPC/potwory
  - Dostępne przedmioty
  - Informacje o skrzyniach

### 10. Pomoc
- **Komenda:** `HELP`, `H`
- Wyświetla listę wszystkich dostępnych komend
- Pomocne dla nowych graczy

## Struktura Danych Gry

### Pokoje (Rooms)
```javascript
{
  id: "0,0",
  gx: 0,
  gy: 0,
  meta: {
    description: "Opis pokoju",
    entities: ["npc_id", "monster_id"],
    hasChest: true,
    conversationId: "dialog_id"
  }
}
```

### Przedmioty (Items)
```javascript
{
  id: "health_potion",
  name: "Health Potion",
  description: "Restores 50 HP"
}
```

### Postacie (Entities/NPCs)
```javascript
{
  id: "guard",
  type: "person",
  name: "Town Guard"
}
```

## Stan Gry

System śledzi:
- **Bieżący pokój gracza** - gdzie znajduje się gracz
- **Inwentarz** - lista ID przedmiotów w posiadaniu gracza
- **Stany pokoi** - przedmioty w każdym pokoju, otwarte skrzynie
- **Log konwersacji** - historia wszystkich akcji i opisów

## Przykładowe Scenariusze Rozgrywki

### Scenariusz 1: Zbieranie przedmiotów
```
> LOOK
You are in the town square...
Items here: Health Potion, Rusty Sword

> TAKE HEALTH POTION
You take the Health Potion.

> INVENTORY
INVENTORY:
  Health Potion - Restores 50 HP
```

### Scenariusz 2: Otwieranie skrzyni
```
> LOOK
Supply cache under the stairs.
You notice a chest here.

> OPEN CHEST
You open the chest and find:
  - Gold Coin
  - Silver Key

> TAKE SILVER KEY
You take the Silver Key.
```

### Scenariusz 3: Rozmowa z NPC
```
> LOOK
Town square with a helpful Guide.
You see: Town Guide

> TALK GUIDE
You approach Town Guide.
[Conversation system not fully implemented yet]
This NPC has dialogue available.

> EXAMINE GUIDE
Town Guide (person):
  A person standing before you.
```

## Planowane Usprawnienia

1. **System walki** - możliwość atakowania wrogów
2. **Zaawansowane dialogi** - pełny system konwersacji z NPC
3. **System questów** - śledzenie zadań i celów
4. **Zapisywanie stanu gry** - zapis postępu w bazie danych
5. **System statystyk gracza** - HP, poziom, doświadczenie
6. **Bardziej złożone mechaniki przedmiotów** - kombinowanie, crafting
7. **System magii** - zaklęcia i umiejętności

## Testowanie

Aby przetestować system:

1. Uruchom backend: `cd backend && npm start`
2. Uruchom frontend: `cd frontend && npm run dev`
3. Przejdź do marketplace i wybierz grę
4. Kliknij "Play" aby rozpocząć rozgrywkę
5. Wypróbuj wszystkie komendy wymienione powyżej

## Uwagi Techniczne

- Wszystkie komendy są case-insensitive (wielkość liter nie ma znaczenia)
- Komendy są automatycznie konwertowane na wielkie litery
- System wspiera aliasy komend (np. `I` zamiast `INVENTORY`)
- Wszystkie akcje są logowane do historii gry
- Stan gry jest przechowywany w stanie React (docelowo w bazie danych)
