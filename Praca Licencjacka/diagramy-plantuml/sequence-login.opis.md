# Opis diagramu sekwencji: logowanie uzytkownika

Diagram pokazuje przebieg logowania do aplikacji.

Proces rozpoczyna się w przeglądarce, która wysyła żądanie POST /api/auth/login z adresem e-mail i hasłem. Middleware Express przekazuje żądanie do trasy auth.js, a ta pobiera dane użytkownika z modelu User na podstawie adresu e-mail. Po odebraniu rekordu aplikacja weryfikuje hasło za pomocą bcrypt. 

Jeśli dane są poprawne, system generuje token JWT, ustawia go jako ciasteczko httpOnly i odsyła odpowiedz 200 OK z danymi użytkownika. Ciasteczko jest następnie automatycznie dołączane przez przeglądarkę do kolejnych żądań wymagających autoryzacji, bez konieczności jawnego zarządzania tokenem po stronie klienta. 