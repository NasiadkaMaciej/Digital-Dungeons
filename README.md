# Digital Dungeons

**Platforma do tworzenia i grania w tekstowe gry RPG**

Digital Dungeons to interaktywna platforma webowa umożliwiająca tworzenie i udostępnianie tekstowych gier RPG w stylu klasycznych przygodówek konsolowych. Gracze mogą tworzyć własne dungeony, eksplorować światy stworzone przez społeczność oraz dzielić się swoimi przygodami.

## O Projekcie

Digital Dungeons łączy nostalgię klasycznych tekstowych gier RPG z nowoczesnymi narzędziami do tworzenia treści. Nasza platforma oferuje:

- **Intuicyjny edytor gier** - Twórz złożone przygody za pomocą wizualnego edytora z systemem drag & drop
- **Marketplace społeczności** - Odkrywaj, oceniaj i pobieraj gry stworzone przez innych graczy
- **Klasyczny gameplay** - Tekstowe przygody z wyborem akcji, znanym z klasycznych gier RPG
- **Współdzielenie treści** - Publikuj swoje kreacje i buduj społeczność wokół swoich gier

## Główne Funkcjonalności

### Gameplay Engine ✅
- **Widok konsolowy** - Klasyczny interfejs tekstowy przypominający stare gry RPG
- **System pokojów** - Gry zbudowane na gridzie połączonych pokoi z przejściami
- **System inwentarza** - Zbieraj, używaj i zarządzaj przedmiotami
- **System walki** - Walcz z wrogami używając broni
- **System dialogów** - Interaktywne rozmowy z NPC z drzewkami dialogowymi
- **System questów** - Skrzynie ze skarbami, strażnicy, klucze
- **Obsługa komend** - Ponad 20 różnych komend do interakcji ze światem gry

### Edytor Gier ✅
- **Wizualny projektant** - Drag & drop interface do tworzenia mapy gry na canvasie
- **Panel konfiguracji pokojów** - Szczegółowe ustawienia dla każdego pomieszczenia:
  - Zarządzanie przedmiotami
  - Konfiguracja NPC i entities
  - Edycja konwersacji i dialogów
- **Panel metadanych** - Globalne ustawienia gry:
  - Konfiguracja gracza i jego statystyk
  - Definicje przedmiotów i ich właściwości
  - Warunki wygranej i przegranej
- **Edytor konwersacji** - Tworzenie rozgałęzionych dialogów z wizualnym grafem

### Marketplace
- **Przeglądanie gier** - Intuicyjny system browsowania i wyszukiwania
- **System ocen** - Ulubione gry i statystyki popularności
- **Upload własnych kreacji** - Łatwe publikowanie swoich gier
- **Statystyki** - Śledzenie liczby pobrań i opinii graczy

### System Użytkowników
- **Rejestracja i logowanie** - Bezpieczny system kont użytkowników
- **Profile graczy** - Personalizowane profile z historią gier
- **Zarządzanie treścią** - Panel twórcy do zarządzania własnymi grami

## Opis Interfejsu Użytkownika

Interfejs użytkownika Digital Dungeons został zaprojektowany z myślą o prostocie i intuicyjności. Obejmuje on:

- **Strona główna** - Opis projektu, informacje o zespole, oraz linki do najważniejszych sekcji platformy.
- **Nawigacja** - Górne menu z dostępem do edytora, marketplace, profilu użytkownika i ustawień.
- **Edytor gier** - Główne okno edytora podzielone na różne sekcje do tworzenia i konfiguracji gry.
  - Panel boczny - Narzędzia do dodawania elementów gry, takich jak pokoje, przedmioty i NPC.
  - Panel właściwości - Szczegółowe ustawienia dla wybranego elementu, umożliwiające dostosowanie jego zachowania i atrybutów.
  - Canvas gry - Centralne miejsce do wizualnego projektowania mapy gry.
- **Marketplace** - Przejrzysty układ z listą gier, filtrami i opcjami sortowania.
  - Wyszukiwarka - Szybkie znajdowanie gier według różnych kryteriów.
  - Karty gier - Każda gra prezentowana jest na karcie z podstawowymi informacjami, ocenami i przyciskiem do pobrania.
  - Ulubione - Sekcja z grami pobranymi i polubionymi przez użytkownika.
- **Interfejs gry** - Okno gry pozwalające na interakcje z grami stworzonymi na platformie.
  - Widok tekstowy - Główne okno z opisem sytuacji, w której znajduje się gracz.
  - Przyciski wyboru akcji - Interaktywne elementy umożliwiające podejmowanie decyzji.
  - Pasek stanu - Informacje o stanie gracza, takie jak zdrowie, ekwipunek i statystyki.
  - Opis gry - Sekcja z dodatkowymi informacjami o aktualnej lokacji, kontekście fabularnym i celu gry.
  - Minimapa - Opcjonalna mapa pokazująca aktualną lokalizację gracza w świecie gry.
- **Profil użytkownika** - Strona z informacjami o użytkowniku, jego grach i statystykach.
  - Ustawienia konta - Opcje zarządzania danymi osobowymi i preferencjami.
  - Historia gier - Lista wszystkich gier stworzonych lub pobranych przez użytkownika.
  - Statystyki - Dane dotyczące aktywności użytkownika na platformie.

## Roadmapa Rozwoju

### Faza 1: MVP
- [x] Podstawowa struktura projektu <10.10.25>
- [x] Funkcjonalny edytor gier z podstawowymi funkcjami (bez konwersacji) <4.12.25>
- [-] Gameplay engine z podstawowymi mechanikami <4.12.25>
- [x] Podstawowy system użytkowników <4.12.25>
- [x] Proste publikowanie i przeglądanie gier <4.12.25>
- [x] Przygotowanie systemu kont

### Faza 2: Rozszerzenia
- [x] Marketplace <15.12.25>
- [x] System ocen i komentarzy <15.12.25>
- [-] Wyszukiwarka gier w marketplace i profile <15.12.25>
- [ ] System tagów i kategorii gier <27.12.25>
- [-] Zaawansowane funkcje edytora (np. konwersacje) <1.01.26>
- [x] Strona główna z informacjami o projekcie <1.01.26>
- [-] Ulepszone UI/UX <1.01.26>
- [ ] Optymalizacja wydajności <1.01.26>

### Faza 3: Przyszłe Możliwości <Lato 2026>
- [ ] System osiągnięć i progresji
- [ ] Zaawansowane narzędzia analityczne dla twórców

## Stack Technologiczny

### Frontend [MVP]
- **Next.js** - React framework do budowy aplikacji webowych
- **p5.js** - Biblioteka do tworzenia interaktywnych wizualizacji (edytor canvas)
- **Tailwind CSS** - Utility-first CSS framework do stylizacji

### Backend [MVP]
- **Next.js API Routes** - Backend API zintegrowane z frontendem
- **MySQL** - Relacyjna baza danych do przechowywania gier i użytkowników

### Przyszłe Rozszerzenia
- **Redis** - Cache dla lepszej wydajności
- **WebSocket** - Real-time features dla współpracy

## Design Philosophy

Digital Dungeons czerpie inspirację z:
- **Klasycznych text adventures** (Zork, Adventure)
- **Nowoczesnych narzędzi no-code** (dla prostoty tworzenia)
- **Platform społecznościowych** (dla budowania społeczności)
- **RPG Maker** (jako punkt odniesienia dla edytorów gier)

## Zespół

Projekt jest rozwijany przez zespół studentów w ramach projektu grupowego.
Autorzy projektu: Maciej Nasiadka, Maciej Wojciechowski i Michał Ryduchowski

## Licencja

Projekt jest rozwijany na potrzeby edukacyjne. Szczegóły licencji będą dodane w przyszłości.

---

**Rozpoczęto:** Październik 2025  
**Deadline:** Styczeń 2026  
**Status:** W rozwoju

## API Endpoints

### User Authentication
- `POST /api/login` — logowanie użytkownika (email, hasło)
- `POST /api/register` — rejestracja nowego użytkownika (username, email, hasło)

### Games
- `GET /api/games` — pobierz listę wszystkich opublikowanych gier
- `GET /api/games/:id` — pobierz szczegóły gry
- `POST /api/games` — utwórz nową grę (wymaga autoryzacji)
- `PUT /api/games/:id` — edytuj grę (wymaga autoryzacji)
- `DELETE /api/games/:id` — usuń grę (wymaga autoryzacji)

### Comments
- `GET /api/comments/game/:gameId` — pobierz komentarze do gry
- `POST /api/comments/:gameId` — dodaj komentarz do gry
- `PUT /api/comments/:commentId` — edytuj komentarz
- `DELETE /api/comments/:commentId` — usuń komentarz

### Likes
- `POST /api/likes/:gameId` — polub grę
- `DELETE /api/likes/:gameId` — usuń polubienie
- `GET /api/likes/user/:userId` — pobierz polubione gry użytkownika
- `GET /api/likes/check/:gameId` — sprawdź, czy użytkownik polubił grę

### Users
- `GET /api/users/:userId` — pobierz profil użytkownika
- `PUT /api/users/profile` — edytuj profil użytkownika
- `GET /api/users/:userId/games` — pobierz gry utworzone przez użytkownika


### Playthroughs (Rozgrywki)
- `GET /api/playthroughs/user` — pobierz rozgrywki zalogowanego użytkownika
- `GET /api/playthroughs/:id` — pobierz szczegóły rozgrywki (tylko właściciel)
- `POST /api/playthroughs` — rozpocznij nową rozgrywkę (wymaga `gameId`, opcjonalnie `gameState`)
- `PUT /api/playthroughs/:id` — aktualizuj stan rozgrywki (`gameState` jako JSON, `status`)
- `DELETE /api/playthroughs/:id` — usuń rozgrywkę
- `POST /api/playthroughs/continue/:gameId` — pobierz lub utwórz rozgrywkę dla gry

---

## Dokumentacja: Zapis stanu gry w JSON

### Format `game_state` (Playthroughs)

Stan gry jest zapisywany w bazie w polu `game_state` jako obiekt JSON. Backend oczekuje, że będzie to elastyczna struktura, którą można rozszerzać o dowolne pola opisujące postęp gracza.

#### Przykładowy zapis:
```json
{
  "currentRoom": 1,
  "inventory": ["sword", "key"],
  "playerStats": {
    "health": 100,
    "mana": 50
  },
  "questProgress": {
    "mainQuest": "started",
    "sideQuests": ["find_goblin", "open_chest"]
  }
}
```

#### Typowe pola:
- `currentRoom` — identyfikator lub nazwa aktualnego pokoju
- `inventory` — tablica przedmiotów posiadanych przez gracza
- `playerStats` — obiekt ze statystykami gracza (np. zdrowie, mana)
- `questProgress` — obiekt opisujący postęp w zadaniach

#### Flow zapisu i odczytu:
- Rozpoczęcie rozgrywki: Tworzony jest nowy rekord z początkowym stanem gry
- Aktualizacja: Stan gry jest nadpisywany przez endpoint `PUT`, przyjmując nowy obiekt JSON
- Odczyt: Stan gry jest zwracany w odpowiedzi na zapytania o rozgrywkę

#### Wskazówki dla deweloperów:
- Backend nie narzuca sztywnego schematu — możesz rozszerzać strukturę o własne pola
- Zaleca się trzymanie kluczowych informacji (lokacja, ekwipunek, statystyki, postęp) w głównych polach

#### Wskazówki dla użytkowników:
- Stan gry jest automatycznie zapisywany podczas rozgrywki i można go wznowić w dowolnym momencie

---