import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { createTestDb } from './d1.ts';

test('D1 helper persists to a real file readable by another SQLite connection', async t => {
  const { db, close } = await createTestDb();
  t.after(close);
  const databases = await db.prepare('PRAGMA database_list').all<{ name: string; file: string }>();
  const filename = databases.results.find(item => item.name === 'main')?.file;
  assert.ok(filename && existsSync(filename));
  assert.equal(await db.prepare('PRAGMA foreign_keys').first<number>('foreign_keys'), 1);
  const migrated = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all();
  assert.ok(migrated.results.length > 0, 'SQL migrations must create the application schema');
  await db.exec('CREATE TABLE qa_persistence (id TEXT PRIMARY KEY, value TEXT NOT NULL)');
  await db.prepare('INSERT INTO qa_persistence (id,value) VALUES (?,?)').bind('one', 'persisted').run();
  const reopened = new DatabaseSync(filename);
  try {
    assert.equal(reopened.prepare('SELECT value FROM qa_persistence WHERE id = ?').get('one')?.value, 'persisted');
  } finally { reopened.close(); }
  close();
  assert.equal(existsSync(filename), false);
  close();
});

test('D1 helper binds values without interpolation and supports first, all and raw', async t => {
  const { db, close } = await createTestDb();
  t.after(close);
  await db.exec('CREATE TABLE qa_bindings (id INTEGER PRIMARY KEY, value TEXT, optional TEXT)');
  const input = "'; DROP TABLE qa_bindings; --";
  const insert = db.prepare('INSERT INTO qa_bindings (id,value,optional) VALUES (?,?,?)');
  const mutation = await insert.bind(1, input, null).run();
  assert.equal(mutation.success, true);
  assert.equal(mutation.meta.changes, 1);
  const query = db.prepare('SELECT id,value,optional FROM qa_bindings WHERE id = ?').bind(1);
  assert.deepEqual(await query.first(), { id: 1, value: input, optional: null });
  assert.equal(await query.first<string>('value'), input);
  const all = await query.all();
  assert.deepEqual(all.results, [{ id: 1, value: input, optional: null }]);
  assert.equal(all.meta.changes, 0);
  assert.deepEqual(await query.raw(), [[1, input, null]]);
  assert.deepEqual(await query.raw({ columnNames: true }), [['id', 'value', 'optional'], [1, input, null]]);
  assert.deepEqual(await db.prepare('SELECT 1 AS duplicate, 2 AS duplicate').raw(), [[1, 2]]);
  assert.equal(await db.prepare('SELECT id FROM qa_bindings WHERE id = ?').bind(2).first(), null);
  await assert.rejects(query.first('absent'), /D1_COLUMN_NOTFOUND/);
  assert.throws(() => query.bind(undefined), /binding/);
});

test('D1 helper batch commits in order and rolls back every write if one statement fails', async t => {
  const { db, close } = await createTestDb();
  t.after(close);
  await db.exec('CREATE TABLE qa_atomic (id TEXT PRIMARY KEY, value INTEGER NOT NULL)');
  const insert = db.prepare('INSERT INTO qa_atomic (id,value) VALUES (?,?)');
  await assert.rejects(db.batch([insert.bind('duplicate', 1), insert.bind('duplicate', 2)]), /UNIQUE/);
  assert.equal(await db.prepare('SELECT count(*) AS count FROM qa_atomic').first<number>('count'), 0);
  const result = await db.batch<{ value: number }>([
    insert.bind('one', 1),
    db.prepare('UPDATE qa_atomic SET value = value + 1 WHERE id = ?').bind('one'),
    db.prepare('SELECT value FROM qa_atomic WHERE id = ?').bind('one'),
  ]);
  assert.deepEqual(result[2].results, [{ value: 2 }]);
  assert.equal(await db.prepare('SELECT count(*) AS count FROM qa_atomic').first<number>('count'), 1);
});
