## 1.4. Struktura pracy

Praca składa się z siedmiu rozdziałów merytorycznych.

Rozdział pierwszy stanowi wprowadzenie, w którym opisano cel i zakres pracy, motywację
powstania systemu Digital Dungeons oraz charakterystykę gier typu text-based RPG.

Rozdział drugi zawiera analizę problemu i istniejących rozwiązań. Omówiono w nim narzędzia
do tworzenia gier RPG, platformy dystrybucji gier tworzonych przez użytkowników, a także
wyciągnięto wnioski stanowiące podstawę dla założeń projektowych.

Rozdział trzeci poświęcony jest analizie systemu. Zdefiniowano wymagania funkcjonalne
i niefunkcjonalne, opisano aktorów systemu, opracowano diagram przypadków użycia wraz
z ich scenariuszami, diagramy sekwencji dla kluczowych operacji oraz model danych systemu.

Rozdział czwarty opisuje projekt systemu: architekturę klient-serwer, projekt bazy
danych, interfejsu użytkownika i poszczególnych modułów funkcjonalnych oraz API.

Rozdział piąty omawia implementację systemu: zastosowane technologie oraz realizację
poszczególnych modułów, tj. edytora gier, silnika rozgrywki, marketplace'u i systemu
użytkowników.

Rozdział szósty zawiera opis strategii testowania oraz wyniki testów frontendowych,
backendowych i funkcjonalnych.

Praca kończy się rozdziałem siódmym, zawierającym podsumowanie realizacji projektu,
omówienie ograniczeń systemu oraz wskazanie możliwych kierunków jego dalszego rozwoju.

---

## 3. Analiza systemu

### 3.1. Wymagania funkcjonalne

Na podstawie założeń projektowych sformułowanych w rozdziale 2 opracowano wymagania
funkcjonalne systemu. Opisują one zestaw operacji, które system powinien udostępniać
swoim użytkownikom.

- WF-01: System umożliwia rejestrację nowego konta użytkownika na podstawie podanego loginu, adresu e-mail i hasła.
- WF-02: System umożliwia logowanie do istniejącego konta użytkownika.
- WF-03: System umożliwia tworzenie nowych gier tekstowych przy użyciu graficznego edytora, bez konieczności znajomości programowania.
- WF-04: System umożliwia definiowanie pomieszczeń gry wraz z ich nazwą i opisem tekstowym.
- WF-05: System umożliwia dodawanie przedmiotów do pomieszczeń oraz definiowanie ich właściwości (możliwość podniesienia, użycia, blokowania przejść).
- WF-06: System umożliwia tworzenie postaci niezależnych (NPC) i przypisywanie im drzew konwersacji.
- WF-07: System umożliwia definiowanie połączeń pomiędzy pomieszczeniami (przejść kierunkowych).
- WF-08: System umożliwia publikację ukończonej gry w serwisie marketplace.
- WF-09: System umożliwia przeglądanie opublikowanych gier w marketplace z możliwością wyszukiwania i filtrowania.
- WF-10: System umożliwia rozgrywkę za pomocą wpisywanych komend tekstowych.
- WF-11: System umożliwia zapis stanu rozgrywki oraz jej późniejsze wznowienie.
- WF-12: System umożliwia dodawanie komentarzy do gier oraz ich polubienie.
- WF-13: System umożliwia zarządzanie profilem użytkownika, w tym zmianę danych konta.
- WF-14: System umożliwia edytowanie i usuwanie własnych gier przez ich twórców.

### 3.2. Wymagania niefunkcjonalne

Wymagania niefunkcjonalne opisują ograniczenia i cechy jakościowe systemu, niezwiązane
bezpośrednio z jego funkcjonalnością.

- WNF-01 (Dostępność): System działa w całości w przeglądarce internetowej, bez konieczności instalowania dodatkowego oprogramowania. Jest kompatybilny ze współczesnymi przeglądarkami obsługującymi standard ECMAScript 2020.
- WNF-02 (Bezpieczeństwo): Uwierzytelnianie opiera się na tokenach JWT (ang. JSON Web Token) przekazywanych w nagłówkach żądań HTTP. Hasła przechowywane są w formie zahaszowanej z użyciem algorytmu bcrypt. Dostęp do chronionych zasobów jest weryfikowany po stronie serwera API.
- WNF-03 (Ograniczenie mediów): System nie obsługuje elementów graficznych, dźwiękowych ani wideo. Narracja i interakcja opierają się wyłącznie na tekście.
- WNF-04 (Wydajność): Serwer API powinien odpowiadać na żądania w czasie nieprzekraczającym 2 sekund. Rozmiar danych gry przesyłanych przez API jest ograniczony do 10 MB.
- WNF-05 (Niezawodność zapisu): Stan rozgrywki jest automatycznie zapisywany po każdej akcji użytkownika, dzięki czemu nieoczekiwane zamknięcie przeglądarki nie powoduje utraty postępów.
- WNF-06 (Intuicyjność): Edytor gier jest zaprojektowany w modelu no-code, umożliwiając tworzenie gier osobom bez doświadczenia programistycznego.

### 3.3. Aktorzy systemu

W systemie Digital Dungeons zidentyfikowano trzech aktorów.

Pierwszym z nich jest **Gość**, czyli użytkownik niezalogowany. Ma on dostęp wyłącznie
do przeglądania opublikowanych gier w marketplace. Funkcje wymagające konta są dla niego
niedostępne.

Kolejnym aktorem jest **Zalogowany użytkownik**, dysponujący pełną funkcjonalnością
systemu: może grać, tworzyć i publikować gry, dodawać komentarze i polubienia oraz
zarządzać swoim profilem.

**Twórca gry** to rola przysługująca zalogowanemu użytkownikowi względem jego własnych
gier. Jako jedyny może je edytować i usuwać. Każdy użytkownik staje się twórcą
w momencie utworzenia gry.

### 3.4. Diagram przypadków użycia

Diagram przypadków użycia został przygotowany w PlantUML:

- `Praca Licencjacka/diagramy-plantuml/use-case.puml`

### 3.5. Opis scenariuszy przypadków użycia

Poniżej opisano szczegółowe scenariusze dla wybranych przypadków użycia systemu.

---

**UC-01: Rejestracja użytkownika**

| Pole | Opis |
|------|------|
| Identyfikator | UC-01 |
| Nazwa | Rejestracja użytkownika |
| Aktorzy | Gość |
| Warunek wstępny | Użytkownik nie posiada konta lub nie jest zalogowany |
| Główny przepływ | 1. Użytkownik przechodzi do formularza rejestracji. 2. Użytkownik wprowadza login, adres e-mail i hasło. 3. System weryfikuje poprawność i unikalność danych. 4. System tworzy nowe konto i automatycznie loguje użytkownika. 5. Użytkownik zostaje przekierowany na stronę główną. |
| Przepływ alternatywny | 3a. Podany adres e-mail lub login jest już zajęty. System wyświetla komunikat błędu i prosi o podanie innych danych. |
| Warunek końcowy | W systemie zostało utworzone nowe konto użytkownika. |

---

**UC-02: Logowanie**

| Pole | Opis |
|------|------|
| Identyfikator | UC-02 |
| Nazwa | Logowanie |
| Aktorzy | Gość |
| Warunek wstępny | Użytkownik posiada konto w systemie |
| Główny przepływ | 1. Użytkownik przechodzi do formularza logowania. 2. Użytkownik wprowadza adres e-mail i hasło. 3. System weryfikuje zgodność danych z zapisem w bazie. 4. System generuje token JWT i zapisuje go po stronie klienta. 5. Użytkownik zostaje przekierowany na stronę główną jako zalogowany. |
| Przepływ alternatywny | 3a. Dane logowania są nieprawidłowe. System wyświetla komunikat błędu, użytkownik pozostaje niezalogowany. |
| Warunek końcowy | Użytkownik jest zalogowany i posiada aktywną sesję. |

---

**UC-03: Tworzenie gry**

| Pole | Opis |
|------|------|
| Identyfikator | UC-03 |
| Nazwa | Tworzenie nowej gry |
| Aktorzy | Zalogowany użytkownik |
| Warunek wstępny | Użytkownik jest zalogowany |
| Główny przepływ | 1. Użytkownik przechodzi do edytora gier. 2. Użytkownik wprowadza tytuł i opis gry. 3. Użytkownik dodaje pomieszczenia na kanwie graficznej edytora. 4. Użytkownik definiuje właściwości pomieszczeń, przedmiotów i NPC. 5. Użytkownik określa połączenia między pomieszczeniami. 6. Użytkownik zapisuje grę. 7. System zapisuje definicję gry w bazie danych w formacie JSON. |
| Przepływ alternatywny | 6a. Gra nie zawiera pomieszczenia startowego. System informuje użytkownika o brakujących elementach i wstrzymuje zapis. |
| Warunek końcowy | Gra jest zapisana w systemie jako nieopublikowana i widoczna tylko dla jej twórcy. |

---

**UC-04: Rozgrywka**

| Pole | Opis |
|------|------|
| Identyfikator | UC-04 |
| Nazwa | Prowadzenie rozgrywki |
| Aktorzy | Zalogowany użytkownik |
| Warunek wstępny | Użytkownik jest zalogowany; wybrana gra jest opublikowana lub należy do użytkownika |
| Główny przepływ | 1. Użytkownik wybiera grę z marketplace lub własnej listy. 2. System wczytuje definicję gry i poprzedni stan rozgrywki (jeśli istnieje). 3. Silnik rozgrywki inicjalizuje stan gry. 4. System wyświetla opis pomieszczenia startowego. 5. Użytkownik wprowadza komendę tekstową. 6. Silnik interpretuje komendę i aktualizuje stan gry. 7. System wyświetla odpowiedź tekstową. 8. Kroki 5–7 są powtarzane aż do zakończenia gry lub opuszczenia jej przez gracza. 9. System automatycznie zapisuje stan rozgrywki. |
| Przepływ alternatywny | 6a. Komenda jest nierozpoznana. System wyświetla komunikat o nieznanej komendzie, stan gry nie ulega zmianie. |
| Warunek końcowy | Stan rozgrywki jest zapisany w bazie danych i może być wznowiony w przyszłości. |

---

**UC-05: Publikacja gry**

| Pole | Opis |
|------|------|
| Identyfikator | UC-05 |
| Nazwa | Publikacja gry w marketplace |
| Aktorzy | Twórca gry |
| Warunek wstępny | Użytkownik jest zalogowany; gra jest zapisana w systemie |
| Główny przepływ | 1. Użytkownik przechodzi do zarządzania swoją grą. 2. Użytkownik wybiera opcję publikacji. 3. System zmienia status gry na opublikowany. 4. Gra staje się widoczna w serwisie marketplace dla wszystkich użytkowników. |
| Przepływ alternatywny | brak |
| Warunek końcowy | Gra jest opublikowana i dostępna publicznie w marketplace. |

---

**UC-06: Dodawanie komentarza**

| Pole | Opis |
|------|------|
| Identyfikator | UC-06 |
| Nazwa | Dodawanie komentarza do gry |
| Aktorzy | Zalogowany użytkownik |
| Warunek wstępny | Użytkownik jest zalogowany; wybrana gra jest opublikowana |
| Główny przepływ | 1. Użytkownik przechodzi na stronę gry w marketplace. 2. Użytkownik wpisuje treść komentarza w formularzu. 3. Użytkownik zatwierdza komentarz. 4. System zapisuje komentarz powiązany z grą i użytkownikiem. 5. Komentarz staje się widoczny na stronie gry dla innych użytkowników. |
| Przepływ alternatywny | 3a. Treść komentarza jest pusta. System nie zapisuje komentarza i wyświetla komunikat walidacji. |
| Warunek końcowy | Komentarz jest zapisany w bazie danych i widoczny publicznie. |

### 3.6. Diagramy sekwencji

Diagramy sekwencji zostały przygotowane w PlantUML:

- `Praca Licencjacka/diagramy-plantuml/sequence-login.puml` (logowanie użytkownika)
- `Praca Licencjacka/diagramy-plantuml/sequence-save-game.puml` (zapis gry przez edytor)
- `Praca Licencjacka/diagramy-plantuml/sequence-game-step.puml` (krok rozgrywki)

### 3.7. Model danych systemu

Model danych systemu Digital Dungeons opiera się na relacyjnej bazie danych MySQL.
Dane przechowywane są w pięciu tabelach obejmujących użytkowników, gry, sesje rozgrywki
oraz interakcje społecznościowe.

**Tabela users** przechowuje dane kont użytkowników: identyfikator (user_id), nazwę
użytkownika (username), adres e-mail, zahaszowane hasło (password_hash), opis profilu
oraz znaczniki czasu rejestracji (join_date) i ostatniego logowania (last_login).

**Tabela games** zawiera metadane gier oraz ich pełną definicję. Pole game_content
przechowuje strukturę gry w formacie JSON, zawierającą listę pomieszczeń z ich opisami,
przedmiotami, postaciami NPC, połączeniami kierunkowymi oraz identyfikatorem pomieszczenia
startowego. Pole is_published określa widoczność gry w marketplace. Klucz obcy author_id
odnosi się do tabeli users.

**Tabela playthroughs** rejestruje sesje rozgrywki. Pole game_state przechowuje bieżący
stan gry w formacie JSON, obejmującym aktualną lokalizację gracza, zawartość ekwipunku,
flagi postępu rozgrywki oraz listę odwiedzonych pomieszczeń. Pole status przyjmuje wartości active lub
completed. Klucze obce game_id i user_id wiążą sesję z konkretną grą i jej graczem.

**Tabela likes** przechowuje pary (user_id, game_id) ze znacznikiem czasu, realizując
funkcję polubień. Kombinacja obu kluczy obcych jest unikalna, co uniemożliwia
wielokrotne polubienie tej samej gry przez jednego użytkownika.

**Tabela comments** przechowuje komentarze użytkowników do gier. Każdy komentarz jest
powiązany z grą (game_id) i autorem (user_id) oraz zawiera treść tekstową i znacznik
czasu dodania.

Diagram ER modelu danych został przygotowany w PlantUML:

- `Praca Licencjacka/diagramy-plantuml/erd.puml`

Wspólny styl wizualny dla wszystkich diagramów:

- `Praca Licencjacka/diagramy-plantuml/style.iuml`

Strukturę danych JSON przechowywanych w polu game_content tabeli games ilustruje
poniższy przykład:

```json
{
  "startRoom": "room_1",
  "rooms": [
    {
      "id": "room_1",
      "name": "Wejście do jaskini",
      "description": "Stoisz u wejścia do mrocznej jaskini...",
      "items": [
        {
          "id": "item_1",
          "name": "pochodnia",
          "description": "Stara drewniana pochodnia.",
          "can_take": true,
          "can_use": true
        }
      ],
      "npcs": [],
      "connections": {
        "north": "room_2",
        "south": null,
        "east": null,
        "west": null
      }
    }
  ]
}
```

Pole game_state tabeli playthroughs przechowuje dynamiczny stan rozgrywki, aktualizowany
po każdej akcji gracza:

```json
{
  "currentRoom": "room_2",
  "inventory": ["item_1"],
  "visitedRooms": ["room_1", "room_2"],
  "gameFlags": {
    "chest_opened": true,
    "goblin_defeated": false
  }
}
```

