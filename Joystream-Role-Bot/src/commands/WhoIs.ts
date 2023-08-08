import {
  CommandInteraction,
  Client,
  ApplicationCommandOptionType,
} from "discord.js";
import { Command } from "../Command";

export const WhoIs: Command = {
  name: "who_is",
  description: "List member id and on-chain roles of the given discord account",
  options: [
    {
      name: "discord_handle",
      description:
        "The discord Username of which you wish to display information",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  run: async (client: Client, interaction: CommandInteraction) => {
    let content: string = `who is`;
    const { options } = interaction;

    const discordHandle: string = String(options.get("discord_handle")?.value);
    const userId = discordHandle.replace(/[<@!>]/g, "");

    const guild = client.guilds.cache.get(String(process.env.SERVER_ID));

    if (!guild) {
      content = "Guild not found.";
    } else {
      await guild.members.fetch();
      const member = guild.members.cache.get(userId);
      if (!member) {
        content = "Member not found.";
      } else {
        const roleNames = member.roles.cache
          .filter((role) => role.name !== "@everyone")
          .map((role) => role.id);
        content = `<@${userId}>: <@&${roleNames.join(">, <@&")}>`;
      }
    }

    await interaction.followUp({
      ephemeral: true,
      content,
    });
  },
};
