# Struktura Kodu - Refaktoryzacja GameConsole

## 📁 Nowa Organizacja Plików

```
frontend/src/
├── components/
│   └── GameConsole.jsx          (446 linii - zredukowane z 854!)
├── lib/
│   └── game/
│       ├── commandParser.js      (istniejący)
│       ├── roomHelpers.js        (NOWY - 108 linii)
│       ├── gameActions.js        (NOWY - 254 linie)
│       └── conversationSystem.js (NOWY - 175 linii)
```

## 🎯 Podział Odpowiedzialności

### 1. **roomHelpers.js** - Zarządzanie Pokojami
**Odpowiedzialność:** Nawigacja, opis pokoi, inicjalizacja stanów

**Eksportowane funkcje:**
- `directionVectors` - Mapowanie kierunków (N/S/E/W) na wektory
- `findRoomById(rooms, id)` - Znajdź pokój po ID
- `findRoomByCoords(rooms, gx, gy)` - Znajdź pokój po współrzędnych
- `describeRoom(room, roomState, globalMeta)` - Generuj pełny opis pokoju
- `initializeRoomStates(rooms)` - Inicjalizuj stany wszystkich pokoi

**Przykład użycia:**
```javascript
import { findRoomById, describeRoom } from '@/lib/game/roomHelpers';

const room = findRoomById(rooms, currentRoomId);
const description = describeRoom(room, roomStates[currentRoomId], globalMeta);
```

### 2. **gameActions.js** - Akcje Gracza
**Odpowiedzialność:** Obsługa interakcji z przedmiotami i wrogami

**Eksportowane funkcje:**
- `handleTakeItem(itemName, currentRoomId, roomStates, inventory, globalMeta)`
  - Zwraca: `{ success, message, newRoomItems, newInventory, itemId }`
  
- `handleDropItem(itemName, currentRoomId, roomStates, inventory, globalMeta)`
  - Zwraca: `{ success, message, newRoomItems, newInventory, itemId }`
  
- `handleUseItem(itemName, inventory, globalMeta)`
  - Zwraca: `{ success, message, consumed, newInventory, itemId }`
  
- `handleOpenChestAction(room, roomState, inventory, globalMeta)`
  - Zwraca: `{ success, message/messages, contents }`
  
- `handleAttackEntity(targetName, room, roomState, inventory, globalMeta)`
  - Zwraca: `{ success, message/messages, targetId, drops, newRoomItems }`

**Przykład użycia:**
```javascript
import { handleTakeItem } from '@/lib/game/gameActions';

const result = handleTakeItem('SWORD', currentRoomId, roomStates, inventory, globalMeta);
if (result.success) {
  setInventory(result.newInventory);
  setRoomStates(prev => ({
    ...prev,
    [currentRoomId]: { ...prev[currentRoomId], items: result.newRoomItems }
  }));
}
```

### 3. **conversationSystem.js** - System Dialogów
**Odpowiedzialność:** Zarządzanie rozmowami z NPC i drzewkami dialogowymi

**Eksportowane funkcje:**
- `handleConversation(npcName, room, roomState, globalMeta)`
  - Zwraca: `{ success, messages, npcId, currentNode, childNodes }`
  
- `handleConversationChoice(choiceNumber, room, roomState, globalMeta)`
  - Zwraca: `{ success, message/messages, newSelectedNode }`

**Przykład użycia:**
```javascript
import { handleConversation, handleConversationChoice } from '@/lib/game/conversationSystem';

// Rozpocznij rozmowę
const result = handleConversation('ELDER', room, roomState, globalMeta);
appendToLog(result.messages);

// Wybierz opcję dialogową
const choice = handleConversationChoice(1, room, roomState, globalMeta);
appendToLog(choice.messages);
```

### 4. **GameConsole.jsx** - Główny Komponent
**Odpowiedzialność:** Zarządzanie stanem, UI, routing komend

**Kluczowe sekcje:**
```javascript
// ===== GAME DATA =====
// Dane gry z props

// ===== STATE =====
// React state: currentRoomId, inventory, roomStates, log, input

// ===== REFS =====
// Referencje do elementów DOM

// ===== UTILITY FUNCTIONS =====
// appendToLog, focusInput

// ===== INITIALIZATION =====
// useEffect hooks dla inicjalizacji

// ===== COMMAND HANDLERS =====
// handleMove, handleHelp, handleTake, etc.

// ===== EVENT HANDLERS =====
// handleSubmit, handleInputChange, etc.

// ===== RENDER =====
// JSX komponenta
```

## ✅ Korzyści z Refaktoryzacji

### 1. **Czytelność** 📖
- Każdy plik ma jasno określoną odpowiedzialność
- Funkcje są małe i robią jedną rzecz dobrze
- Kod jest łatwiejszy do zrozumienia dla nowych programistów

### 2. **Testowanie** 🧪
- Funkcje pomocnicze są czyste (pure functions)
- Łatwe do testowania jednostkowego bez mocków React
- Przykład testu:
```javascript
import { handleTakeItem } from '@/lib/game/gameActions';

test('should take item from room', () => {
  const result = handleTakeItem('SWORD', roomId, roomStates, [], globalMeta);
  expect(result.success).toBe(true);
  expect(result.newInventory).toContain('iron_sword');
});
```

### 3. **Utrzymanie** 🔧
- Zmiany w logice przedmiotów → edytuj tylko `gameActions.js`
- Zmiany w systemie dialogów → edytuj tylko `conversationSystem.js`
- Zmiany w opisach pokoi → edytuj tylko `roomHelpers.js`
- Bug w komponencie UI → edytuj tylko `GameConsole.jsx`

### 4. **Reużywalność** ♻️
- Funkcje mogą być użyte w innych częściach aplikacji
- Łatwe do przeniesienia do innego projektu
- Możliwość utworzenia biblioteki game engine

### 5. **Rozszerzalność** 🚀
- Łatwo dodać nowe akcje do `gameActions.js`
- Łatwo rozszerzyć system dialogów
- Można dodać nowe typy interakcji bez przebudowy całego kodu

## 🔄 Porównanie Przed/Po

### Przed Refaktoryzacją:
```
GameConsole.jsx: 854 linie
- Wszystko w jednym pliku
- Trudne do przetestowania
- Trudne do utrzymania
- Funkcje mocno związane z React state
```

### Po Refaktoryzacji:
```
GameConsole.jsx:      446 linii (-48%)
roomHelpers.js:       108 linii (NOWY)
gameActions.js:       254 linie (NOWY)
conversationSystem.js: 175 linii (NOWY)
-------------------------
RAZEM:                983 linie (+15%)
```

**Wzrost liczby linii o 15%, ale:**
- ✅ Kod jest bardziej czytelny
- ✅ Każdy moduł ma jasną odpowiedzialność
- ✅ Funkcje są testowalne
- ✅ Łatwiejsze utrzymanie i rozwój
- ✅ Lepsza dokumentacja (komentarze JSDoc)

## 📝 Konwencje Kodu

### Nazewnictwo:
- **Pliki:** camelCase.js (`roomHelpers.js`)
- **Funkcje:** camelCase (`handleTakeItem`)
- **Stałe:** UPPER_SNAKE_CASE (`directionVectors`)
- **Komponenty React:** PascalCase (`GameConsole`)

### Struktura zwracanych wartości:
Wszystkie funkcje akcji zwracają obiekt z:
- `success: boolean` - czy akcja się powiodła
- `message` lub `messages` - komunikaty dla gracza
- Dodatkowe pola specyficzne dla akcji

### Dokumentacja:
- Każdy plik ma komentarz opisujący jego przeznaczenie
- Każda funkcja ma komentarz JSDoc
- Przykłady użycia w komentarzach

## 🎮 Jak Dodać Nową Funkcjonalność?

### Przykład: Dodanie systemu crafting

1. **Utwórz nowy moduł:** `craftingSystem.js`
```javascript
export function handleCraft(recipe, inventory, globalMeta) {
  // Logika craftingu
  return { success, message, newInventory, craftedItem };
}
```

2. **Zaimportuj w GameConsole.jsx:**
```javascript
import { handleCraft } from '@/lib/game/craftingSystem';
```

3. **Dodaj handler:**
```javascript
const handleCraftCommand = useCallback((recipeName) => {
  const result = handleCraft(recipeName, inventory, globalMeta);
  if (result.success) {
    setInventory(result.newInventory);
  }
  appendToLog([result.message]);
}, [inventory, globalMeta, appendToLog]);
```

4. **Dodaj do handleCommand:**
```javascript
case 'CRAFT':
  handleCraftCommand(cmd.args);
  return;
```

## 🐛 Debugowanie

### Gdzie szukać problemów:

**Problem z przedmiotami?**
→ Sprawdź `gameActions.js`

**Problem z dialogami?**
→ Sprawdź `conversationSystem.js`

**Problem z nawigacją?**
→ Sprawdź `roomHelpers.js`

**Problem z UI/renderowaniem?**
→ Sprawdź `GameConsole.jsx`

**Problem z parsowaniem komend?**
→ Sprawdź `commandParser.js`

## ✨ Podsumowanie

Refaktoryzacja GameConsole przynosi:
- ✅ Lepszą organizację kodu
- ✅ Łatwiejsze testowanie
- ✅ Prostsze utrzymanie
- ✅ Szybszy rozwój nowych funkcji
- ✅ Mniejsze ryzyko wprowadzenia bugów
- ✅ Lepszą czytelność dla zespołu

**Kod jest teraz profesjonalny, modularny i gotowy do dalszego rozwoju!** 🚀
