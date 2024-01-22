import { CommandInteraction, Client } from "discord.js";
import { Command } from "../Command";
import { lastUpdateTime, qn_recive_data } from "../controls/control";
import pkgDir from "pkg-dir";
import fs from "node:fs";

const getPkgVersion = () => {
  const packageJsonPath = `${pkgDir.sync()}/package.json`;
  const data = fs.readFileSync(packageJsonPath, "utf8");
  const packageJson = JSON.parse(data);
  return packageJson.version;
};

const pkgVersion = getPkgVersion();

export const Status: Command = {
  name: "status",
  description: "status",

  run: async (client: Client, interaction: CommandInteraction) => {
    let emptyRole: string = "status";

    const guild = client.guilds.cache.get(String(process.env.SERVER_ID));
    let status: string = "";

    if (!guild) {
      emptyRole = "Discord Server not found.";
    } else {
      await guild.roles.fetch();

      const roles = guild.roles.cache.filter((role) => role.members.size === 0);
      const roleNames = roles.map((role) => role.id);

      if (!qn_recive_data || qn_recive_data.length === 0) {
        status = ` - Cannot connect to ${process.env.QUERY_NODE}`;
      } else {
        status = " - QN is Active";
      }

      if (roleNames.length === 0) {
        emptyRole = `All roles have been filled`;
      } else {
        emptyRole = `Empty Roles : <@&${roleNames.join(">, <@&")}>`;
      }
    }

    const content: string = `${emptyRole}

QN status ${status}

Last update time: ${lastUpdateTime}

Version: ${pkgVersion}`;

    await interaction.followUp({
      content,
      ephemeral: true,
    });
  },
};
