# Opis diagramu przypadkow uzycia

Diagram przedstawia podstawowe role w systemie Digital Dungeons i ich mozliwosci.

Gość moze zarejestrowac konto, zalogowac sie oraz przegladac marketplace z dostepnymi grami. Zalogowany uzytkownik dziedziczy wszystkie mozliwosci goscia i dodatkowo moze tworzyc gry, uruchamiac rozgrywke, dodawac komentarze, polubic gre oraz edytowac profil. Tworca gry dziedziczy uprawnienia zalogowanego uzytkownika i moze dodatkowo edytowac, usuwac oraz publikowac wlasne gry.

Relacja `<<include>>` pomiedzy uruchomieniem rozgrywki a zapisem/odczytem stanu gry oznacza, ze podczas gry system korzysta z mechanizmu utrwalania postepu.
