# Opis diagramu sekwencji: zapis gry przez edytor

Diagram przedstawia zapis stanu gry tworzonej w edytorze.

Edytor oparty na React i p5.js zbiera aktualny stan kanwy i serializuje go do formatu JSON. Nastepnie wysyla zadanie `POST /api/games` razem z tokenem uwierzytelniajacym. Middleware JWT sprawdza poprawnosc tokenu i przekazuje zadanie do trasy `games.js`.

Warstwa tras tworzy nowy rekord za posrednictwem modelu `Game`, a model zapisuje dane do bazy MySQL poleceniem `INSERT INTO games`. Po utworzeniu rekordu baza zwraca identyfikator gry, ktory jest przekazywany z powrotem do edytora. Interfejs aktualizuje stan lokalny i moze traktowac gre jako zapisana.
