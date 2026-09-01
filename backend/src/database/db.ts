import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: DatabaseSync | null = null;
let dbFailed = false;

export function getDb(): DatabaseSync | null {
  if (db) return db;
  if (dbFailed) return null;

  try {
    let dbDir = path.join(__dirname, '..', '..', 'data');
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    } catch {
      // Fallback to OS tmp dir for Vercel serverless environment
      dbDir = path.join(os.tmpdir(), 'ai-orchestra-data');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    }

    const dbPath = path.join(dbDir, 'database.sqlite');
    db = new DatabaseSync(dbPath);

    db.exec(`
      PRAGMA foreign_keys = ON;
      
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        models_used TEXT,
        step_logs TEXT,
        cost REAL NOT NULL DEFAULT 0.0,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
      );
    `);

    return db;
  } catch (err) {
    console.warn('[Database] SQLite initialization skipped (read-only filesystem or serverless context):', err);
    dbFailed = true;
    return null;
  }
}

export interface Conversation {
  id: string;
  title: string;
  created_at: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  models_used?: string;
  step_logs?: string;
  cost: number;
  timestamp: number;
}

export async function createConversation(id: string, title: string): Promise<Conversation> {
  const created_at = Date.now();
  try {
    const database = getDb();
    if (database) {
      const stmt = database.prepare('INSERT INTO conversations (id, title, created_at) VALUES (?, ?, ?)');
      stmt.run(id, title, created_at);
    }
  } catch (err) {
    console.warn('[Database] Failed to create conversation:', err);
  }
  return { id, title, created_at };
}

export async function listConversations(): Promise<Conversation[]> {
  try {
    const database = getDb();
    if (database) {
      const stmt = database.prepare('SELECT * FROM conversations ORDER BY created_at DESC');
      return stmt.all() as unknown as Conversation[];
    }
  } catch (err) {
    console.warn('[Database] Failed to list conversations:', err);
  }
  return [];
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  try {
    const database = getDb();
    if (database) {
      const stmt = database.prepare('SELECT * FROM conversations WHERE id = ?');
      return stmt.get(id) as Conversation | undefined;
    }
  } catch (err) {
    console.warn('[Database] Failed to get conversation:', err);
  }
  return undefined;
}

export async function deleteConversation(id: string): Promise<void> {
  try {
    const database = getDb();
    if (database) {
      const stmt = database.prepare('DELETE FROM conversations WHERE id = ?');
      stmt.run(id);
    }
  } catch (err) {
    console.warn('[Database] Failed to delete conversation:', err);
  }
}

export async function saveMessage(msg: Omit<Message, 'timestamp'>): Promise<Message> {
  const timestamp = Date.now();
  try {
    const database = getDb();
    if (database) {
      const stmt = database.prepare(`
        INSERT INTO messages (id, conversation_id, role, content, models_used, step_logs, cost, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        msg.id,
        msg.conversation_id,
        msg.role,
        msg.content,
        msg.models_used || null,
        msg.step_logs || null,
        msg.cost,
        timestamp
      );
    }
  } catch (err) {
    console.warn('[Database] Failed to save message:', err);
  }
  return { ...msg, timestamp };
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
    const database = getDb();
    if (database) {
      const stmt = database.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC');
      return stmt.all(conversationId) as unknown as Message[];
    }
  } catch (err) {
    console.warn('[Database] Failed to get messages:', err);
  }
  return [];
}
