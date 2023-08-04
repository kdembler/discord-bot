import {
  CommandInteraction,
  Client,
  ApplicationCommandOptionType,
} from "discord.js";
import { Command } from "../Command";
import { setUserIdChallenge } from "../database/control";
import { encodeAddress } from "../hook/formatAddress";
export const Claim: Command = {
  name: "claim",
  description:
    "Claim Discord roles by linking your discord account to Joystream on-chain membership",

  run: async (client: Client, interaction: CommandInteraction) => {
    const { options, user } = interaction;

    let content: string = "claim";

    const guild = client.guilds.cache.get(String(process.env.SERVER_ID));

    if (!guild) {
      console.log("Interaction is not happening within a guild.");
      return;
    }
    let res = await guild.members.fetch();
    const members = guild.members.cache.filter((member) => !member.user.bot);
    const userNames = members.map((member) => member.user.tag);
    console.log(userNames);

    await interaction.followUp({
      content,
      ephemeral: true,
    });
  },
};
