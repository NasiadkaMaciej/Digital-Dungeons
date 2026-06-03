# Diagramy PlantUML

Pliki zrodlowe:
- use-case.puml
- sequence-login.puml
- sequence-save-game.puml
- sequence-game-step.puml
- erd.puml

Wersje wektorowe do wykorzystania w pracy:
- use-case.svg
- sequence-login.svg
- sequence-save-game.svg
- sequence-game-step.svg
- erd.svg

Do kazdego diagramu dodano oddzielny plik z opisem tekstowym:
- use-case.opis.md
- sequence-login.opis.md
- sequence-save-game.opis.md
- sequence-game-step.opis.md
- erd.opis.md

## Szybki start (PowerShell)

1. Zainstaluj Java 17+.
2. Przejdz do katalogu z diagramami:

```powershell
Set-Location "Praca Licencjacka/diagramy-plantuml"
```

3. Pobierz PlantUML JAR (jednorazowo):

```powershell
Invoke-WebRequest -Uri "https://github.com/plantuml/plantuml/releases/latest/download/plantuml.jar" -OutFile ".\plantuml.jar"
```

## Render do SVG (zalecane do pracy)

```powershell
Get-ChildItem -Filter *.puml | ForEach-Object { java -jar .\plantuml.jar -tsvg $_.FullName }
```

## Uwagi do skladu

- Diagramy sa przygotowane bez tytulow wewnatrz grafiki.
- Czcionka bazowa jest ustawiona na Book Antiqua.
- W pracy nalezy uzywac wariantow SVG, a nie PNG.

## Render do PDF

```powershell
Get-ChildItem -Filter *.puml | ForEach-Object { java -jar .\plantuml.jar -tpdf $_.FullName }
```

## VS Code

Zainstaluj rozszerzenie PlantUML i otworz plik `.puml`, aby podejrzec diagram oraz wyeksportowac go do SVG/PDF.