import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export class FileCache {
  constructor(directory, ttlSeconds = 86400) {
    this.directory = directory;
    this.ttlMs = ttlSeconds * 1000;
  }

  key(endpoint, payload) {
    return createHash("sha256").update(JSON.stringify({ endpoint, payload })).digest("hex");
  }

  get(endpoint, payload, now = Date.now()) {
    const file = path.join(this.directory, `${this.key(endpoint, payload)}.json`);
    try {
      const cached = JSON.parse(fs.readFileSync(file, "utf8"));
      if (now - cached.cached_at > this.ttlMs) return null;
      return cached.value;
    } catch (error) {
      if (error.code === "ENOENT" || error instanceof SyntaxError) return null;
      throw error;
    }
  }

  set(endpoint, payload, value, now = Date.now()) {
    fs.mkdirSync(this.directory, { recursive: true });
    const file = path.join(this.directory, `${this.key(endpoint, payload)}.json`);
    const temporary = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify({ cached_at: now, value }));
    fs.renameSync(temporary, file);
  }
}
