import env from '@/env';
import { Client, Account, Users } from 'node-appwrite';

// Admin client with API key for server-side operations (creating users, etc.)
const adminClient = new Client();
adminClient
  .setEndpoint(env.appwrite.endpoint)
  .setProject(env.appwrite.projectId)
  .setKey(env.appwrite.apikey);

// Session client for user-specific operations
const sessionClient = new Client();
sessionClient
  .setEndpoint(env.appwrite.endpoint)
  .setProject(env.appwrite.projectId);

export const adminAccount = new Account(adminClient);
export const users = new Users(adminClient);
export const sessionAccount = new Account(sessionClient);
export { adminClient, sessionClient };