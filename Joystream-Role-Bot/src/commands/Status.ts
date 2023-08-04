import { CommandInteraction, Client } from "discord.js";
import { Command } from "../Command";
import { blockNumber } from "../hook/blockCalc";

export const Status: Command = {
  name: "status",
  description: "status",

  run: async (client: Client, interaction: CommandInteraction) => {
    let emptyRole: string = "status";

    const guild = client.guilds.cache.get(String(process.env.SERVER_ID));

    if (!guild) {
      emptyRole = "Discord Server not found.";
    } else {
      await guild.roles.fetch();

      const roles = guild.roles.cache.filter((role) => role.members.size === 0);
      const roleNames = roles.map((role) => role.id);

      emptyRole = `<@&${roleNames.join(">, <@&")}>`;
    }

    const content: string = `

    Empty Roles : ${emptyRole}

    Version :${process.env.VERSION}

    Block : ${blockNumber}`;

    await interaction.followUp({
      content,
      ephemeral: true,
    });
  },
};
