import { Client } from "discord.js";
import {
  MemberFieldFragment,
  getMembers,
} from "../query/generator/members_generate";
import { RoleAddress } from "../RoleConfig";

export let qn_recive_data: MemberFieldFragment[] = [];
export let lastUpdateTime = "Unknown";

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

async function getDiscordHandleToTargetRolesMap(): Promise<
  Record<string, string[]> {
  const members = await getMembers();
}

export const runUpdate = async (client: Client): Promise<void> => {
  const Qndata: MemberFieldFragment[] = await getMembers();

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
    return;
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

    const DEBUG = true;
    const addMemberRole = async (role: string) => {
      if (DEBUG) {
        console.log(`Adding <@&${role}> role to ${qnMember.id}`);
      } else {
        await discordMember.roles.add(role);
      }
    };

    const removeMemberRole = async (role: string) => {
      if (DEBUG) {
        console.log(`Removing <@&${role}> role from ${qnMember.id}`);
      } else {
        await discordMember.roles.remove(role);
      }
    };

    const discordMemberAllRolesIds = discordMember.roles.cache.map(
      (role) => role.id,
    );
    const roleAddressArray: string[] = Object.values(RoleAddress);
    const discordMemberRolesIdsLookup = discordMemberAllRolesIds.reduce(
      (acc, roleId) => {
        if (roleAddressArray.includes(roleId)) {
          acc[roleId] = true;
        }
        return acc;
      },
      {} as Record<string, boolean>,
    );

    if (!discordMemberRolesIdsLookup[RoleAddress.membershipLinked]) {
      await addMemberRole(RoleAddress.membershipLinked);
    }

    const qnMemberActiveRoles = qnMember.roles.filter(
      (group) => group.status.__typename === "WorkerStatusActive",
    );

    let worker = false;

    const qnMemberActiveRolesIds: string[] = [];

    const memberRolesPromises = qnMemberActiveRoles.map(async (role) => {
      const mappedRoles = roleMap[role.groupId];

      if (!mappedRoles) {
        return;
      }
      const [leadRoleId, workerRoleId] = mappedRoles;

      const workerDiscordRole = await guild.roles.fetch(workerRoleId);

      if (!workerDiscordRole) {
        console.log(`<@&${workerRoleId}> Role not found`);
        return;
      }
      if (!discordMemberRolesIdsLookup[workerRoleId]) {
        await addMemberRole(workerRoleId);
        discordMemberRolesIdsLookup[workerRoleId] = true;
      }
      qnMemberActiveRolesIds.push(workerRoleId);
      worker = true;

      if (role.isLead) {
        const leadDiscordRole = await guild.roles.fetch(leadRoleId);

        if (!leadDiscordRole) {
          console.log(`<@&${leadRoleId}> Role not found`);
          return;
        }
        if (!discordMemberRolesIdsLookup[leadRoleId]) {
          await addMemberRole(leadRoleId);
          discordMemberRolesIdsLookup[leadRoleId] = true;
        }
        qnMemberActiveRolesIds.push(leadRoleId);
      }
    });

    await Promise.all(memberRolesPromises);

    const terminatedRoles = Object.keys(discordMemberRolesIdsLookup)
      .filter(
        (roleId) =>
          roleId !== RoleAddress.councilMember &&
          roleId !== RoleAddress.foundingMember &&
          roleId !== RoleAddress.membershipLinked &&
          roleId !== RoleAddress.DAO,
      )
      .filter((item) => !qnMemberActiveRolesIds.includes(item));
    const terminatedRolesPromises = terminatedRoles.map((id) =>
      removeMemberRole(id),
    );
    await Promise.all(terminatedRolesPromises);

    if (
      (worker || qnMember.isCouncilMember) &&
      !discordMemberRolesIdsLookup[RoleAddress.DAO]
    ) {
      await addMemberRole(RoleAddress.DAO);
    }
    if (
      !(worker || qnMember.isCouncilMember) &&
      discordMemberRolesIdsLookup[RoleAddress.DAO]
    ) {
      await removeMemberRole(RoleAddress.DAO);
    }

    // FMs, CMs
    const specialRoles = [
      // {
      //   roleId: RoleAddress.foundingMember,
      //   isActive: qnMember.isFoundingMember,
      // },
      {
        roleId: RoleAddress.councilMember,
        isActive: qnMember.isCouncilMember,
      },
    ];

    const specialRolesPromises = specialRoles.map(async (specialRole) => {
      const role = await guild.roles.fetch(specialRole.roleId);

      if (!role) {
        console.log(`<@&${specialRole.roleId}> Role not found`);
        return;
      }

      if (
        specialRole.isActive &&
        !discordMemberRolesIdsLookup[specialRole.roleId]
      ) {
        await addMemberRole(specialRole.roleId);
      }

      if (
        !specialRole.isActive &&
        discordMemberRolesIdsLookup[specialRole.roleId]
      ) {
        await removeMemberRole(specialRole.roleId);
      }
    });

    await Promise.all(specialRolesPromises);
  });

  await Promise.all(membersPromises);

  console.log("Discord server update finish!");
  lastUpdateTime = new Date().toLocaleString();
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
