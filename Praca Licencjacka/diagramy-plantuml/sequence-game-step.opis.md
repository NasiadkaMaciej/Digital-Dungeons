# Opis diagramu sekwencji: krok rozgrywki

Diagram pokazuje jeden cykl wykonania komendy przez gracza.

Uzytkownik wpisuje komende w komponencie GameConsole. Tekst trafia do parsera `commandParser.js`, ktory zamienia go na strukture zrozumiala dla logiki gry. Nastepnie `gameActions.js` aktualizuje stan i zwraca odpowiedz tekstowa do interfejsu.

Po stronie serwera klient wysyla `PUT /api/playthroughs/:id` z aktualnym `game_state` oraz tokenem JWT. Middleware uwierzytelniajacy sprawdza token i przekazuje zadanie do trasy `playthroughs.js`. Model `Playthrough` aktualizuje rekord w bazie MySQL, a po pomyslnym zapisie system odsyla `200 OK`. Komponent GameConsole wyswietla odpowiedz i prezentuje graczowi nowy stan rozgrywki.
