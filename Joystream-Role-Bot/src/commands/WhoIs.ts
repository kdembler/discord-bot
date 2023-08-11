import {
  CommandInteraction,
  Client,
  ApplicationCommandOptionType,
} from "discord.js";
import { Command } from "../Command";
import { getUserId } from "../controls/control";

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
        const memberId = getUserId(member.user.username);
        const roleNames = member.roles.cache
          .filter((role) => role.name !== "@everyone")
          .map((role) => role.id);
        if (roleNames.length === 0) {
          content = `<@${userId}>: This user has no on-chain roles`;
        } else {
          if (memberId) {
            content = `The discord user <@${userId}> has the Joystream membership Id  ${
              memberId.id
            }  and has the following on-chain roles \n <@&${memberId.roles?.join(
              ">, <@&"
            )}>`;
          } else {
            content = `The discord user <@${userId}> has no Joystream membership. Please go to Pioneer Governance app and link your discord handle to your Joystream membership by editing your membership data. \n https://pioneerapp.xyz/#/profile/memberships`;
          }
        }
      }
    }

    await interaction.followUp({
      ephemeral: true,
      content,
    });
  },
};
