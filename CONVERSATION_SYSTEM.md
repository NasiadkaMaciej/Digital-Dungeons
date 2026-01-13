# System Konwersacji - Przykład Użycia

## Jak Działają Rozmowy

System konwersacji w Digital Dungeons wykorzystuje interaktywne drzewka dialogowe, gdzie:
- **NPC** wypowiadają się automatycznie
- **Gracz** wybiera odpowiedzi wpisując numery
- **Dialogi** prowadzą przez questą i dostarczają wskazówek

## Przykład Rozmowy z Village Elder

### Krok 1: Rozpoczęcie Rozmowy
```
> TALK VILLAGE ELDER

Village Elder says:
"Greetings, traveler! A vicious goblin has taken residence in the old armory to the east."

You can respond:
  1. Tell me more about the goblin.
  2. What should I do?

(Type the number of your response, or just continue exploring)
```

### Krok 2: Wybór Opcji - Dowiedz Się Więcej
```
> 1

You say: "Tell me more about the goblin."

Village Elder says:
"The creature guards a precious treasure chest. No one has been able to defeat it."

(End of conversation)
```

### Krok 3: Ponowna Rozmowa (jeśli wybierzesz inną opcję)
```
> TALK VILLAGE ELDER

Village Elder says:
"Greetings, traveler! A vicious goblin has taken residence in the old armory to the east."

You can respond:
  1. Tell me more about the goblin.
  2. What should I do?

> 2

You say: "What should I do?"

Village Elder says:
"Find a weapon and defeat the beast! The blacksmith to the north may help."

(End of conversation)
```

## Przykład z Blacksmith (Wielopoziomowy Dialog)

```
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
```

## Struktura Drzewka Dialogowego

Dialogi są zorganizowane w hierarchiczną strukturę:

```
Root Node (0,0) - "Greetings, traveler! ..."
    ├─ Child 1 (1,0) - "Tell me more about the goblin."
    │   └─ Response (2,0) - "The creature guards..."
    │
    └─ Child 2 (1,1) - "What should I do?"
        └─ Response (2,1) - "Find a weapon..."
```

## Komendy Związane z Rozmowami

### TALK / SPEAK <npc>
Rozpoczyna rozmowę z wybraną postacią:
```
TALK ELDER
TALK BLACKSMITH
SPEAK GUARD
TALK GOBLIN  (jeśli ma dialogi)
```

### Liczby (1, 2, 3...)
Wybiera opcję dialogową:
```
1  - wybiera pierwszą opcję
2  - wybiera drugą opcję
3  - wybiera trzecią opcję
```

### EXAMINE <npc>
Pokazuje podstawowe informacje o postaci:
```
> EXAMINE ELDER

Village Elder (person):
  A person standing before you.
```

## Właściwości NPC w Strukturze Gry

```json
{
  "entities": [
    {
      "id": "village_elder",
      "type": "person",
      "name": "Village Elder",
      "hostile": false
    }
  ]
}
```

## Struktura Konwersacji w Pokoju

```json
{
  "meta": {
    "conversationId": "elder_intro",
    "conversationRepeatable": false,
    "conversationState": {
      "nodes": [
        {
          "id": "0,0",
          "gx": 0,
          "gy": 0,
          "parentId": null,
          "meta": {
            "label": "Greetings, traveler! ..."
          }
        },
        {
          "id": "1,0",
          "gx": 1,
          "gy": 0,
          "parentId": "0,0",
          "meta": {
            "label": "Tell me more about the goblin."
          }
        }
      ],
      "selected": "0,0"
    }
  }
}
```

## Wskazówki dla Graczy

1. **Rozmawiaj ze wszystkimi** - każdy NPC ma coś ważnego do powiedzenia
2. **Eksploruj wszystkie opcje** - różne odpowiedzi mogą dawać różne wskazówki
3. **Notuj informacje** - dialogi zawierają kluczowe wskazówki do questów
4. **Możesz przerwać** - nie musisz kończyć rozmowy, możesz wrócić później
5. **Niektóre rozmowy są jednorazowe** - niektóre dialogi można przeprowadzić tylko raz

## Wskazówki dla Twórców Gier

### Jak Stworzyć Dobry Dialog

1. **Root node** - wprowadzenie, co NPC ma do powiedzenia
2. **Opcje gracza** - pytania lub odpowiedzi (dzieci root node)
3. **Odpowiedzi NPC** - reakcje na wybory gracza (dzieci opcji)
4. **Koniec lub kontynuacja** - zakończ lub dodaj więcej opcji

### Repeatable vs Non-Repeatable

- **`conversationRepeatable: true`** - można rozmawiać wiele razy
- **`conversationRepeatable: false`** - rozmowa tylko raz (quest-critical)

### Przykład Linearnego Dialogu

```json
{
  "nodes": [
    {"id":"0,0", "parentId":null, "meta":{"label":"Hello!"}},
    {"id":"1,0", "parentId":"0,0", "meta":{"label":"Hi there!"}},
    {"id":"2,0", "parentId":"1,0", "meta":{"label":"Have a nice day!"}}
  ]
}
```

### Przykład Rozgałęzionego Dialogu

```json
{
  "nodes": [
    {"id":"0,0", "parentId":null, "meta":{"label":"What do you need?"}},
    {"id":"1,0", "parentId":"0,0", "meta":{"label":"Information"}},
    {"id":"1,1", "parentId":"0,0", "meta":{"label":"Help"}},
    {"id":"2,0", "parentId":"1,0", "meta":{"label":"Here's what I know..."}},
    {"id":"2,1", "parentId":"1,1", "meta":{"label":"I can assist you with..."}}
  ]
}
```

## Rozwiązywanie Problemów

### "This NPC has dialogue available" (stary komunikat)
Jeśli widzisz ten komunikat, oznacza to że:
- Dialog nie został poprawnie załadowany
- Struktura `conversationState` jest nieprawidłowa
- Brakuje pola `nodes` lub `selected`

### "They don't seem to have anything to say right now"
- Brak węzłów w dialogu
- `selected` wskazuje na nieistniejący węzeł

### Dialogi nie pojawiają się
- Sprawdź czy pokój ma `conversationId`
- Sprawdź czy pokój ma `conversationState`
- Sprawdź czy struktura węzłów jest prawidłowa

## Podsumowanie

System konwersacji w Digital Dungeons pozwala na:
- ✅ Interaktywne dialogi z wyborem opcji
- ✅ Wielopoziomowe drzewka rozmów
- ✅ Dostarczanie wskazówek questowych
- ✅ Budowanie atmosfery i historii świata
- ✅ Naturalne prowadzenie gracza przez grę

**Teraz rozmowy działają w pełni! Możesz tworzyć złożone interakcje z NPC!** 🎉
