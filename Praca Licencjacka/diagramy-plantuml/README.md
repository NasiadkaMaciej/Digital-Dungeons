# Diagramy PlantUML

Pliki zrodlowe:
- use-case.puml
- sequence-login.puml
- sequence-save-game.puml
- sequence-game-step.puml
- erd.puml

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

## Render do PDF

```powershell
Get-ChildItem -Filter *.puml | ForEach-Object { java -jar .\plantuml.jar -tpdf $_.FullName }
```

## VS Code

Zainstaluj rozszerzenie PlantUML i otworz plik `.puml`, aby podejrzec diagram oraz wyeksportowac go do SVG/PDF.