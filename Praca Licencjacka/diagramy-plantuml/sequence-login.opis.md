# Opis diagramu sekwencji: logowanie uzytkownika

Diagram pokazuje przebieg logowania do aplikacji.

Proces rozpoczyna sie w przegladarce, ktora wysyla zadanie `POST /api/auth/login` z adresem e-mail i haslem. Middleware Express przekazuje zadanie do trasy `auth.js`, a ta pobiera dane uzytkownika z modelu `User` na podstawie adresu e-mail. Po odebraniu rekordu aplikacja weryfikuje haslo za pomoca `bcrypt`.

Jesli dane sa poprawne, system generuje token JWT i odsyla odpowiedz `200 OK` wraz z tokenem. Klient zapisuje token w `localStorage`, aby wykorzystywac go przy kolejnych operacjach wymagajacych autoryzacji.
