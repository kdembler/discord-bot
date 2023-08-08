import { Client, CommandInteraction } from "discord.js";
import {
  MemberFieldFragment,
  getMembers,
} from "../query/generator/members_generate";
import { RoleAddress } from "../RoleConfig";
import { WsProvider } from "@polkadot/rpc-provider";
import { ApiPromise } from "@polkadot/api";
import { upDateBlockNumber } from "../hook/blockCalc";

export let qn_recive_data: MemberFieldFragment[];
export let blockNumber: string;

const provider = new WsProvider(process.env.RPC_URL);

type RoleMap = {
  [key: string]: [string, string];
};

const roleMap: RoleMap = {
  contentWorkingGroup: [
    RoleAddress.contentWorkingGroupLead,
    RoleAddress.contentWorkingGroup,
  ],
  forumWorkingGroup: [
    RoleAddress.forumWorkingGroupLead,
    RoleAddress.forumWorkingGroup,
  ],
  appWorkingGroup: [
    RoleAddress.appWorkingGroupLead,
    RoleAddress.appWorkingGroup,
  ],
  membershipWorkingGroup: [
    RoleAddress.membershipWorkingGroupLead,
    RoleAddress.membershipWorkingGroup,
  ],
  distributionWorkingGroup: [
    RoleAddress.distributionWorkingGroupLead,
    RoleAddress.distributionWorkingGroup,
  ],
  storageWorkingGroup: [
    RoleAddress.storageWorkingGroupLead,
    RoleAddress.storageWorkingGroup,
  ],
  operationsWorkingGroupAlpha: [
    RoleAddress.operationsWorkingGroupAlphaLead,
    RoleAddress.operationsWorkingGroupAlpha,
  ],
  operationsWorkingGroupBeta: [
    RoleAddress.operationsWorkingGroupBetaLead,
    RoleAddress.operationsWorkingGroupBeta,
  ],
  operationsWorkingGroupGamma: [
    RoleAddress.operationsWorkingGroupGammaLead,
    RoleAddress.operationsWorkingGroupGamma,
  ],
};

export const setMemberRole = async (
  client: Client,
  interaction: CommandInteraction
): Promise<void> => {
  qn_recive_data = await getMembers();

  const api = await ApiPromise.create({ provider });

  const guild = client.guilds.cache.get(String(process.env.SERVER_ID));
  if (!guild) {
    console.log("Guild not found.");
    return;
  }

  await guild.members.fetch();
  const members = guild.members.cache.filter((member) => !member.user.bot);

  const data = qn_recive_data.map((d) => {
    d.externalResources
      .filter((d) => d.type === "DISCORD")
      .map((r) => {
        const data = members.filter((k) => k.user.username === r.value);
        if (data) {
          data.map((member) => {
            const filterQn = d.externalResources
              .filter((dis) => dis.value === member.user.username)
              .map((k) => d);

            filterQn.map((u) => {
              u.roles.map(async (groupID) => {
                if (roleMap[groupID.groupId]) {
                  const [leadAddress, workerAddress] = roleMap[groupID.groupId];

                  const address = groupID.isLead ? leadAddress : workerAddress;

                  const role = await guild.roles.fetch(address);

                  if (role) {
                    groupID.status.__typename === "WorkerStatusActive"
                      ? await member.roles.add(role)
                      : await member.roles.remove(role);
                  } else {
                    console.log(`<@&${address}> Role not found`);
                  }
                }
              });
              const qnRoleData = [
                {
                  roleAddress: RoleAddress.foundingMember,
                  isState: d.isFoundingMember,
                },
                {
                  roleAddress: RoleAddress.councilMember,
                  isState: d.isCouncilMember,
                },
                {
                  roleAddress: RoleAddress.creator,
                  isState: false, // update part //      ----------?
                },
              ];

              qnRoleData.map(async (qn) => {
                const role = await guild.roles.fetch(qn.roleAddress);
                if (role) {
                  qn.isState
                    ? await member.roles.add(role)
                    : await member.roles.remove(role);
                } else {
                  console.log(`<@&${qn.roleAddress}> Role not found`);
                }
              });
            });
          });
        }
      });
  });

  if (api) {
    await api?.rpc.chain.subscribeNewHeads((header) => {
      upDateBlockNumber(header.number.toString());
    });
  } else {
    upDateBlockNumber("RPC endpoint disconnected");
  }

  console.log("Discord server update finish!");
};
