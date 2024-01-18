import { Client, CommandInteraction } from "discord.js";
import {
  MemberFieldFragment,
  getMembers,
} from "../query/generator/members_generate";
import { RoleAddress } from "../RoleConfig";
import { WsProvider } from "@polkadot/rpc-provider";
import { ApiPromise } from "@polkadot/api";
import { upDateBlockNumber } from "../hook/blockCalc";

export let qn_recive_data: MemberFieldFragment[] = [];

type RoleMap = {
  [key: string]: [string, string];
};

type GetWorkingState = {
  lead: boolean,
  workingGroups: string,
  active: boolean,
}

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

const provider = new WsProvider("wss://rpc.joystream.org:9944");

export const setMemberRole = async (client: Client): Promise<void> => {
  const Qndata: MemberFieldFragment[] = await getMembers();

  const api = await ApiPromise.create({ provider });

  console.log("Discord server update finish!");

  if (!api) {
    upDateBlockNumber("RPC endpoint disconnected");
    return;
  }

  await api?.rpc.chain.subscribeNewHeads((header) => {
    upDateBlockNumber(header.number.toString());
  });

  const guild = client.guilds.cache.get(String(process.env.SERVER_ID));

  if (!guild) {
    console.log("Guild not found.");
    return;
  }

  await guild.members.fetch();

  const discordMembers = guild.members.cache.filter(
    (member) => !member.user.bot,
  );

  const qnMembers = Qndata.flatMap((qnMember) => {
    const hasDiscordHandle = qnMember.externalResources.some(
      (data) => data.type === "DISCORD",
    );

    if (!hasDiscordHandle) return [];

    return qnMember;
  });

  // TODO: refactor - this is currently used to share QN data with other commands
  qn_recive_data = qnMembers;

  if (qnMembers.length === 0) return;

  const daoRole = await guild.roles.fetch(RoleAddress.DAO);

  if (!daoRole) {
    console.log(`<@&${daoRole}> Role not found`);
    return;
  }

  const linkRole = await guild.roles.fetch(RoleAddress.membershipLinked);

  if (!linkRole) {
    console.log(`<@&${RoleAddress.membershipLinked}> Role not found`);
    return
  }


  const membersPromises = qnMembers.map(async (qnMember) => {
    const memberDiscordHandle = qnMember.externalResources.find(
      (data) => data.type === "DISCORD",
    )?.value;

    if (!memberDiscordHandle) {
      console.log("Discord handle not found");
      return;
    }

    const discordMember = discordMembers.find(
      (member) => member.user.username === memberDiscordHandle,
    );

    if (!discordMember) {
      return;
    }

    // const role = await guild.roles.fetch(RoleAddress.operationsWorkingGroupGammaLead);
    // if (role) {
    //   console.log((await member[0]).user.username);
    //   (await member[0]).roles.remove(role);
    // }

    // try {
    //   members.forEach(async (member) => {
    //     console.log(member.roles.cache.map(role => role.id))
    //     // await member.roles.remove(member.roles.cache);
    //     console.log(`Roles of member ${member.user.username} have been removed.`);
    //   });
    // } catch (error) {
    //   console.error("Error removing member roles:", error);
    // }


    const discordMemberAllRolesIds = discordMember.roles.cache.map((role) => role.id)
    const roleAddressArray: string[] = Object.values(RoleAddress);
    const discordMemberRolesIds = discordMemberAllRolesIds.filter((item) => roleAddressArray.includes(item))

    if (!discordMemberRolesIds.find((id: string) => id === RoleAddress.membershipLinked)) {
      await discordMember.roles.add(linkRole);
    }

    const qnMemberActiveRoles = qnMember.roles.filter(group => group.status.__typename === "WorkerStatusActive");

    let worker = false;

    let qnMemberRole: string[] = [];

    qnMemberActiveRoles.forEach(async (work) => {
      const mappedRoles = roleMap[work.groupId];

      if (!mappedRoles) {
        return;
      }
      const [leadRoleId, workerRoleId] = mappedRoles;

      const roleId = work.isLead ? leadRoleId : workerRoleId;

      const role = await guild.roles.fetch(roleId);

      if (!role) {
        console.log(`<@&${roleId}> Role not found`);
        return;
      }
      if (!discordMemberRolesIds.find((id: string) => id === roleId)) {
        discordMember.roles.add(role);
      }
      qnMemberRole.push(roleId);
      worker = true;
    })

    await Promise.all(qnMemberActiveRoles);

    const terminatedRoles = discordMemberRolesIds.filter(item => !qnMemberRole.includes(item))
    const terminatedRolesPromises = terminatedRoles.map(id => discordMember.roles.remove(id));
    await Promise.all(terminatedRolesPromises);

    if ((worker || qnMember.isCouncilMember) && !discordMemberRolesIds.find((id: string) => id === RoleAddress.DAO)) {
      discordMember.roles.add(daoRole)
    }
    if (!(worker || qnMember.isCouncilMember) && discordMemberRolesIds.find((id: string) => id === RoleAddress.DAO)) {
      discordMember.roles.remove(daoRole)
    }

    /// concile, founding, creator part  ///
    const specialRoles = [
      // {
      //   roleId: RoleAddress.foundingMember,
      //   isActive: qnMember.isFoundingMember,
      // },
      {
        roleId: RoleAddress.councilMember,
        isActive: qnMember.isCouncilMember,
      },
      {
        roleId: RoleAddress.creator,
        isActive: false, // TODO - ???
      },
    ];

    const specialRolesPromises = specialRoles.map(async (specialRole) => {

      const role = await guild.roles.fetch(specialRole.roleId);

      if (!role) {
        console.log(`<@&${specialRole.roleId}> Role not found`);
        return;
      }

      if (specialRole.isActive && !discordMemberRolesIds.find((id: string) => id === specialRole.roleId)) {
        discordMember.roles.add(role);
      }

      if (!specialRole.isActive && discordMemberRolesIds.find((id: string) => id === specialRole.roleId)) {
        discordMember.roles.remove(role);
      }

    });

    await Promise.all(specialRolesPromises);
  });

  await Promise.all(membersPromises);
};

interface MemberRolesAndId {
  id: string;
  roles?: string[];
}

export const getUserId = (userId: string): MemberRolesAndId | undefined => {
  if (!qn_recive_data) return;

  let id: MemberFieldFragment[] = [];
  let role: string[] = [];

  qn_recive_data.map((data) =>
    data.externalResources
      .filter((data) => data.type === "DISCORD" && data.value === userId)
      .map(() => {
        data.roles.map(async (groupID) => {
          if (!roleMap[groupID.groupId]) return;

          const [leadAddress, workerAddress] = roleMap[groupID.groupId];
          const address = groupID.isLead ? leadAddress : workerAddress;

          role.push(address);
        });

        if (data.isFoundingMember) role.push(RoleAddress.foundingMember);
        if (data.isCouncilMember) role.push(RoleAddress.councilMember);

        id.push(data);
      }),
  );

  if (!id || id.length === 0) return;

  return {
    id: id[0].id,
    roles: role,
  };
};
