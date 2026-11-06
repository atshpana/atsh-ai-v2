import { Injectable } from "@nestjs/common";
import { Client } from "pg";

@Injectable()
export class HealthService {
  async checkDatabase(): Promise<boolean> {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return false;

    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 2_000,
      query_timeout: 2_000,
      statement_timeout: 2_000,
      application_name: "atsh-api-readiness"
    });

    try {
      await client.connect();
      await client.query("SELECT 1");
      return true;
    } catch {
      return false;
    } finally {
      await client.end().catch(() => undefined);
    }
  }
}
