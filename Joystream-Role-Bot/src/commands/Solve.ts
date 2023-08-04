import {
  CommandInteraction,
  Client,
  ApplicationCommandOptionType,
} from "discord.js";
import { Command } from "../Command";
import {
  Challenge,
  getChallengeData,
  setChallengeVerify,
} from "../database/control";
import { ClaimVerify, transferChallenge } from "../utils/signAndVerify";

export const Solve: Command = {
  name: "solve",
  description:
    "confirm you are the owner of the claimed membership by providing the signature",
  options: [
    {
      name: "signature",
      description: "signature of the membership root account",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  run: async (client: Client, interaction: CommandInteraction) => {
    const { user, options } = interaction;

    const decChallenge: string = String(options.get("signature")?.value);

    let content: string = "";

    const claimm = await getChallengeData(user.id);

    if (!claimm) {
      content = "You must run claim first";
    } else {
      const { challenge, wallet } = claimm as Challenge;

      if (challenge && wallet) {
        const verify: ClaimVerify = {
          challenge: challenge,
          decodeChallenge: decChallenge,
          wallet: wallet,
        };

        const confirm = await transferChallenge(verify);
        if (confirm) {
          const verify = await setChallengeVerify(user.id);
          if (verify) {
            content = `Success! Your discord roles will be updated after ${process.env.SYNCH_TIME} minutes.`;
          } else {
            content = "Database input error!";
          }
        } else {
          content = "Your signature is incorrect";
        }
      }
    }

    await interaction.followUp({
      content,
      ephemeral: true,
    });
  },
};
