import env from "@/env";
import { Client, Account, OAuthProvider } from "appwrite";

// Client-side Appwrite configuration
const client = new Client();

client.setEndpoint(env.appwrite.endpoint).setProject(env.appwrite.projectId);

export const account = new Account(client);
export { OAuthProvider };
export default client;
