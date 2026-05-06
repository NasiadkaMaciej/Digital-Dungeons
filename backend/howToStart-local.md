# Uruchomienie z lokalną instalacją MariaDB

## 1. Zainstaluj MariaDB

```bash
sudo mariadb-install-db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
sudo systemctl start mariadb
sudo mariadb-secure-installation
```

## 2. Utwórz bazę danych i użytkownika

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE digital_dungeons;
CREATE USER 'ddungeons'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON digital_dungeons.* TO 'ddungeons'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 3. Załaduj schemat

```bash
cd backend
mysql -u ddungeons -p digital_dungeons < init-db.sql
```

Na Windows (PowerShell):

```powershell
Get-Content .\init-db.sql | mysql -u ddungeons -p digital_dungeons
```

## 4. Uruchom backend

```bash
npm install
npm run dev
```

Serwer działa na `http://localhost:3001`.
