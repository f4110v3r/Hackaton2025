import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('p2pchat.db');

// Создание таблицы сообщений
db.transaction(tx => {
  tx.executeSql(
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      peer TEXT,
      text TEXT
    );`,
    [],
    () => console.log('Table created or already exists'),
    (_, error) => { console.error(error); return true; }
  );
});

// Сохранение сообщения
export function saveMessage(peer, text) {
  db.transaction(tx => {
    tx.executeSql(
      'INSERT INTO messages (peer, text) VALUES (?, ?);',
      [peer, text],
      () => console.log('Message saved'),
      (_, error) => { console.error(error); return true; }
    );
  });
}

// Получение всех сообщений
export function getMessages(callback) {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM messages;',
      [],
      (_, { rows }) => callback(rows._array),
      (_, error) => { console.error(error); return true; }
    );
  });
}
