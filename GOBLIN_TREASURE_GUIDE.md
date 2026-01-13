# The Goblin's Treasure - Przewodnik Rozgrywki

## Opis Gry
"The Goblin's Treasure" to kompletna przygoda tekstowa, w której musisz:
1. Porozmawiać z mieszkańcami wioski
2. Znaleźć miecz
3. Pokonać goblina
4. Zdobyć klucz z ciała goblina
5. Otworzyć skrzynię ze skarbem

## Mapa Gry
```
         [Wioska (0,0)]
              |
              S
              |
    [Kowalnia (0,1)] --E-- [Magazyn (1,1)]
                                |
                                N
                                |
    [Posterunek (2,0)] --W-- [Zbrojownia (1,0)]
```

**Kierunki nawigacji:**
- Z Wioski (0,0): SOUTH → Kowalnia
- Z Kowalnia (0,1): SOUTH wraca do Wioski, EAST → Magazyn
- Z Magazynu (1,1): WEST → Kowalnia, NORTH → Zbrojownia
- Ze Zbrojowni (1,0): SOUTH → Magazyn, EAST → Posterunek, WEST → Wioska
- Z Posterunku (2,0): WEST → Zbrojownia

## Krok po Kroku - Jak Przejść Grę

### 1. Start w Wiosce (0,0)
```
> LOOK
Village square. The elder stands near the fountain.
You see: Village Elder

> TALK ELDER
Village Elder says:
"Greetings, traveler! A vicious goblin has taken residence in the old armory to the east."

You can respond:
  1. Tell me more about the goblin.
  2. What should I do?

(Type the number of your response, or just continue exploring)

> 2
You say: "What should I do?"

Village Elder says:
"Find a weapon and defeat the beast! The blacksmith to the south may help."

(End of conversation)

> HELP
[Zobacz dostępne komendy]
```

### 2. Idź do Kowalnia (0,1)
```
> SOUTH
Blacksmith workshop. Tools hang on the walls.
You see: Blacksmith
Items here: Iron Sword

> TALK BLACKSMITH
Blacksmith says:
"Welcome to my workshop! I hear you are going after that goblin."

You can respond:
  1. I need a weapon.
  2. Any advice?

> 1
You say: "I need a weapon."

Blacksmith says:
"Take that iron sword on the bench. It should serve you well!"

(End of conversation)

> TAKE IRON SWORD
You take the Iron Sword.

> INVENTORY
INVENTORY:
  Iron Sword - A sturdy blade perfect for fighting goblins
```

### 3. Idź do Zbrojowni przez Magazyn
```
> EAST
Empty storage room. Cobwebs cover the corners.

> NORTH
Old armory. A fearsome goblin guards a locked chest!
You see: Treasure Goblin
You notice a chest here. It appears to be guarded by Treasure Goblin.

> ATTACK GOBLIN
You attack Treasure Goblin with your weapon!
After a brief fight, Treasure Goblin is defeated!
Treasure Goblin drops: Goblin Key

> TAKE GOBLIN KEY
You take the Goblin Key.
```

### 4. Opcjonalnie: Idź do Posterunku dla dodatkowych informacji
```
> EAST
Guard post. A friendly guard stands watch.
You see: Village Guard

> TALK GUARD
Village Guard says:
"That goblin has been causing trouble for weeks!"

You can respond:
  1. What do you know about it?

> 1
You say: "What do you know about it?"

Village Guard says:
"I saw it carrying a key around its neck. Defeat it and the treasure is yours!"

(End of conversation)
```

### 5. Wróć do Zbrojowni i Otwórz Skrzynię
```
> WEST
Old armory. A fearsome goblin guards a locked chest!
Defeated: Treasure Goblin
You notice a chest here.

> OPEN CHEST
You open the chest and find:
  - Golden Chalice
  - Ruby Gem
  - Ancient Coin

> TAKE GOLDEN CHALICE
You take the Golden Chalice.

> TAKE RUBY GEM
You take the Ruby Gem.

> TAKE ANCIENT COIN
You take the Ancient Coin.

> INVENTORY
INVENTORY:
  Iron Sword - A sturdy blade perfect for fighting goblins
  Goblin Key - A rusty key taken from the defeated goblin
  Golden Chalice - An ornate golden cup worth a fortune
  Ruby Gem - A large red gemstone that sparkles brilliantly
  Ancient Coin - A rare coin from a forgotten era
```

### 6. Gratulacje! 🎉
Ukończyłeś grę! Pokonałeś goblina i zdobyłeś wszystkie skarby!

## Możliwe Problemy i Rozwiązania

### "You need a weapon to attack Treasure Goblin!"
**Rozwiązanie:** Idź do kowalnia (SOUTH z wioski) i weź Iron Sword.

### "The chest is locked. You need a Goblin Key to open it."
**Rozwiązanie:** Musisz najpierw pokonać goblina, aby zdobyć klucz.

### "You cannot go that way."
**Rozwiązanie:** Sprawdź mapę - poprawne kierunki to:
- Z Wioski: tylko SOUTH (do Kowalnia)
- Z Kowalnia: SOUTH (wróć do Wioski) lub EAST (do Magazynu)
- Z Magazynu: WEST (do Kowalnia) lub NORTH (do Zbrojowni)
- Ze Zbrojowni: SOUTH (do Magazynu), EAST (do Posterunku), lub WEST (do Wioski)

### "Treasure Goblin blocks your path to the chest!"
**Rozwiązanie:** Użyj komendy `ATTACK GOBLIN` aby go pokonać.

## Wszystkie Dostępne Komendy

### Poruszanie się
- `N`, `NORTH` - idź na północ
- `S`, `SOUTH` - idź na południe
- `E`, `EAST` - idź na wschód
- `W`, `WEST` - idź na zachód
- `LOOK`, `L` - opisz obecną lokację

### Inwentarz i Przedmioty
- `INVENTORY`, `INV`, `I` - pokaż inwentarz
- `TAKE <przedmiot>` - podnieś przedmiot
- `DROP <przedmiot>` - upuść przedmiot
- `USE <przedmiot>` - użyj przedmiot
- `EXAMINE <cel>`, `X <cel>` - zbadaj coś dokładniej

### Interakcje
- `TALK <npc>` - porozmawiaj z postacią
- `ATTACK <wróg>`, `KILL <wróg>`, `FIGHT <wróg>` - zaatakuj wroga
- `OPEN CHEST` - otwórz skrzynię

### Pomoc
- `HELP`, `H` - pokaż wszystkie komendy

## Mechaniki Gry

### System Walki
- Potrzebujesz **broni** (miecz) aby atakować wrogów
- Wrogowie mogą **dropować przedmioty** po pokonaniu
- Niektóre postacie są **przyjazne** i nie można ich atakować

### System Skrzyń
- Skrzynie mogą być **zamknięte** i wymagać klucza
- Skrzynie mogą być **strzeżone** przez wrogie stworzenia
- Musisz najpierw **pokonać strażnika** zanim otworzysz skrzynię
- Po otwarciu skrzyni przedmioty **pojawiają się w pokoju**

### Rozmowy z NPC
- Każda postać ma **własne dialogi**
- Rozmowy dostarczają **wskazówek** jak przejść grę
- Rozmawiaj z **wszystkimi** aby poznać pełną historię
- **Wybieraj opcje** wpisując numer (1, 2, 3, itd.)
- Możesz **przerwać rozmowę** w dowolnym momencie i wrócić do eksploracji

## Wskazówki dla Graczy

1. **Rozmawiaj ze wszystkimi** - NPC dają cenne informacje
2. **Zbadaj wszystko** - użyj EXAMINE aby dowiedzieć się więcej
3. **Zawsze patrz** - LOOK pokazuje co jest w pokoju
4. **Sprawdzaj inwentarz** - upewnij się że masz potrzebne przedmioty
5. **Czytaj dokładnie** - komunikaty gry zawierają ważne informacje

## Kolejność Rozgrywki (Szybkie Przejście)

Dla doświadczonych graczy, najszybsza ścieżka:
```
SOUTH              (idź do kowalnia)
TAKE IRON SWORD    (weź miecz)
EAST               (idź do magazynu)
NORTH              (idź do zbrojowni)
ATTACK GOBLIN      (pokonaj goblina)
TAKE GOBLIN KEY    (weź klucz)
OPEN CHEST         (otwórz skrzynię)
TAKE GOLDEN CHALICE
TAKE RUBY GEM
TAKE ANCIENT COIN
INVENTORY          (sprawdź skarby)
```

Gratulacje, ukończyłeś grę!
