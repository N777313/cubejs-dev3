<h1>CUBE JS Сервер анализа данных</h1>
Для запуска требуется:
 
 - .env файл со следующими переменными

```
CUBEJS_DB_HOST=
CUBEJS_DB_NAME=
CUBEJS_DB_USER=
CUBEJS_DB_PASS=
CUBEJS_WEB_SOCKETS=
CUBEJS_DB_TYPE=
CUBEJS_API_SECRET=
CUBEJS_PORT=
CUBEJS_PLAYGROUND_PORT=

AUTH_SERVICE_URL=
AUTH_COOKIE_NAME=

CUBEJS_DB_SSL=
CUBEJS_DB_SSL_REJECT_UNAUTHORIZED=

CUBEJS_DB_EVENTS_HOST=
CUBEJS_DB_EVENTS_PORT=
CUBEJS_DB_EVENTS_NAME=
CUBEJS_DB_EVENTS_USER=
CUBEJS_DB_EVENTS_PASS=
```

<H2>Запуск</h2>
<h3>Docker</h3>

`docker-compose up`

<h3>Без докера</h3>
Установить cubejs-cli
`node run dev`

<H2>CODE STYLE</h2>

Все джоины должны писаться в формате

`${CUBE.id} = ${JOINED_CUBE.id}`

Все поля в sql должны быть явно указаны

`SELECT * from table_name` - неправильно

`SELECT column_1, column_2` - правильно