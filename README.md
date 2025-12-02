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

### Gameplay Engine [MVP]
- **Widok konsolowy** - Klasyczny interfejs tekstowy przypominający stare gry RPG
- **System pokojów** - Gry zbudowane na gridzie połączonych pokojów z przejściami
- **Interaktywne wybory** - Gracze podejmują decyzje wpływające na rozwój fabuły
- **Obsługa klawiatury i przycisków** - Elastyczne opcje sterowania

### Edytor Gier [MVP]
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
- [ ] Wyszukiwarka gier w marketplace i profile <15.12.25>
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
- **POST /api/login**: Authenticate a user with email and password.
- **POST /api/register**: Register a new user with username, email, and password.

### Games
- **GET /api/games**: Fetch a list of all published games.