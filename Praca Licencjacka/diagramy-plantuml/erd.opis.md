# Opis diagramu ER

Diagram przedstawia strukture bazy danych aplikacji Digital Dungeons i podstawowe relacje miedzy tabelami.

Tabela `users` przechowuje dane kont uzytkownikow. Tabela `games` opisuje gry tworzone przez autorow i zawiera klucz obcy `author_id` wskazujacy na uzytkownika. Tabela `playthroughs` zapisuje przebieg rozgrywek, laczac gre z graczem poprzez `game_id` i `user_id`.

Tabela `comments` przechowuje komentarze przypisane zarowno do gry, jak i autora komentarza. Tabela `likes` zapisuje informacje o polubieniach, rowniez powiazane z uzytkownikiem i gra.

Relacje typu jeden-do-wielu pokazuja, ze jeden uzytkownik moze tworzyc wiele gier, brac udzial w wielu rozgrywkach, dodawac wiele komentarzy i wiele razy polubic rozne gry. Jedna gra moze miec wiele rozgrywek, komentarzy i polubien.
