import { Client, ClientOptions } from "discord.js";
import ready from "./listeners/ready";
import interactionCreate from "./listeners/interactionCreate";
import * as dotenv from "dotenv";
import { connectDatabase } from "./database/connectDatabase";
import { validateEnv } from "./utils/validateEnv";
import { setMemberDB } from "./database/control";

dotenv.config();

const options: ClientOptions = {
  intents: [
    "GuildMembers", // Specify the GUILDS intent
    "Guilds",
  ],
};

const token = process.env.SERVER_TOKEN; // add your token here

console.log("Bot is starting...");

(async () => {
  if (!validateEnv()) return;

  const client = new Client(options);

  client.login(token);
  ready(client);
  interactionCreate(client);
  setInterval(setMemberDB, Number(process.env.SYNCH_TIME) * 60000, client);
})();
