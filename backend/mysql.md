# Backend Setup - Digital Dungeons

## Instalacja i Konfiguracja Bazy Danych

### 1. Instalacja MariaDB

Zainstaluj mariadb i skonfiguruj:
```bash
sudo mariadb-install-db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
sudo systemctl start mariadb
```

### 2. Zabezpieczenie instalacji

```bash
sudo mariadb-secure-installation
```
### 3. Utworzenie bazy danych

```bash
sudo mysql -u root -p
```

W konsoli MySQL:

```sql
CREATE DATABASE digital_dungeons;
CREATE USER 'ddungeons'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON digital_dungeons.* TO 'ddungeons'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Inicjalizacja schematu bazy

```bash
cd backend
mysql -u ddungeons -p digital_dungeons < init-db.sql
```

Wpisz hasło: `your_secure_password`
