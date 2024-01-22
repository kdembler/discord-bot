import { Client } from "discord.js";
import { RoleAddress } from "../RoleConfig";
import { getMembers } from "../data.query";
import { GetMembersQuery } from "../gql/graphql";

type MemberFields = GetMembersQuery["memberships"][0];

export let qn_recive_data: MemberFields[] = [];
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

type MemberInfo = {
  isCouncilMember: boolean;
  isFoundingMember: boolean;
  activeRoles: MemberFields["roles"];
};
async function getDiscordHandleToTargetRolesMap(): Promise<
  Record<string, string[]>
> {
  const members = await getMembers();

  // get all members for a given discord handle
  const discordHandleToMembersMap: Record<string, MemberFields[]> = {};
  members.forEach((member) => {
    const discordHandle = member.externalResources?.find(
      (data) => data.type === "DISCORD",
    )?.value;
    if (!discordHandle) return;
    if (!discordHandleToMembersMap[discordHandle]) {
      discordHandleToMembersMap[discordHandle] = [];
    }
    discordHandleToMembersMap[discordHandle].push(member);
  });

  // TODO: refactor - this is currently used to share QN data with other commands
  qn_recive_data = members;

  // get parsed info for a given discord handle
  const discordHandleToMemberInfoMap: Record<string, MemberInfo> = {};
  Object.entries(discordHandleToMembersMap).forEach(
    ([discordHandle, members]) => {
      const isCouncilMember = members.some((member) => member.isCouncilMember);
      const isFoundingMember = members.some(
        (member) => member.isFoundingMember,
      );
      const activeRoles = members.flatMap((member) =>
        member.roles.filter(
          (group) => group.status.__typename === "WorkerStatusActive",
        ),
      );
      discordHandleToMemberInfoMap[discordHandle] = {
        isCouncilMember,
        isFoundingMember,
        activeRoles,
      };
    },
  );

  // get target roles for a given discord handle
  const discordHandleToTargetRolesMap: Record<string, string[]> = {};
  Object.entries(discordHandleToMemberInfoMap).forEach(
    ([discordHandle, memberInfo]) => {
      const targetRoles: string[] = [];
      targetRoles.push(RoleAddress.membershipLinked);
      if (memberInfo.isCouncilMember) {
        targetRoles.push(RoleAddress.councilMember);
      }
      if (memberInfo.isCouncilMember || memberInfo.activeRoles.length > 0) {
        targetRoles.push(RoleAddress.DAO);
      }
      // if (memberInfo.isFoundingMember) {
      //   targetRoles.push(RoleAddress.foundingMember);
      // }
      memberInfo.activeRoles.forEach((role) => {
        const mappedRoles = roleMap[role.groupId];
        if (!mappedRoles) return;
        const [leadRoleId, workerRoleId] = mappedRoles;
        if (!targetRoles.includes(workerRoleId)) {
          targetRoles.push(workerRoleId);
        }
        if (role.isLead) {
          targetRoles.push(leadRoleId);
        }
      });

      discordHandleToTargetRolesMap[discordHandle] = targetRoles;
    },
  );

  return discordHandleToTargetRolesMap;
}

export const runUpdate = async (client: Client): Promise<void> => {
  console.log("Discord server update start...");

  const guild = client.guilds.cache.get(String(process.env.SERVER_ID));

  if (!guild) {
    console.log("Guild not found.");
    return;
  }

  await guild.members.fetch();
  await guild.roles.fetch();

  const discordMembers = guild.members.cache.filter(
    (member) => !member.user.bot,
  );

  // ensure all roles exist
  for (const [roleKey, roleAddress] of Object.entries(RoleAddress)) {
    if (!guild.roles.cache.has(roleAddress)) {
      console.log(`${roleKey} (${roleAddress}) Role not found.`);
      return;
    }
  }

  // get all Discord members that have a role managed by the bot
  const managedRoles = Object.values(RoleAddress);
  const discordMembersWithManagedRoles = discordMembers.filter((member) =>
    member.roles.cache.some((role) => managedRoles.includes(role.id)),
  );

  // get all QN members that have a Discord handle with their target roles
  const discordHandleToTargetRolesMap =
    await getDiscordHandleToTargetRolesMap();

  const DEBUG = true;

  const added: string[] = [];
  const removed: string[] = [];

  // update Discord members
  const updatePromises = discordMembersWithManagedRoles.map(async (member) => {
    const discordHandle = member.user.username;
    const targetRoles = discordHandleToTargetRolesMap[discordHandle] || [];
    const currentRoles = member.roles.cache
      .map((role) => role.id)
      .filter((id) => managedRoles.includes(id));
    const rolesToAdd = targetRoles.filter(
      (role) => !currentRoles.includes(role),
    );
    const rolesToRemove = currentRoles.filter(
      (role) => !targetRoles.includes(role),
    );
    const addRolePromises = rolesToAdd.map((role) => {
      if (DEBUG) {
        added.push(
          `Adding ${guild.roles.cache.get(role)
            ?.name} role to ${discordHandle}`,
        );
      } else {
        return member.roles.add(role);
      }
    });
    const removeRolePromises = rolesToRemove.map((role) => {
      if (DEBUG) {
        removed.push(
          `Removing ${guild.roles.cache.get(role)
            ?.name} role from ${discordHandle}`,
        );
      } else {
        return member.roles.remove(role);
      }
    });
    await Promise.all([...addRolePromises, ...removeRolePromises]);
  });

  await Promise.all(updatePromises);

  if (DEBUG) {
    console.log(added.join("\n"));
    console.log(removed.join("\n"));
  }

  console.log("Discord server update finish!");
  lastUpdateTime = new Date().toISOString();
};

interface MemberRolesAndId {
  id: string;
  roles?: string[];
}

export const getUserId = (userId: string): MemberRolesAndId | undefined => {
  if (!qn_recive_data) return;

  let id: MemberFields[] = [];
  let role: string[] = [];

  qn_recive_data.map(
    (data) =>
      data.externalResources
        ?.filter((data) => data.type === "DISCORD" && data.value === userId)
        .map(() => {
          data.roles.map(async (groupID) => {
            if (!roleMap[groupID.groupId]) return;

            const [leadAddress, workerAddress] = roleMap[groupID.groupId];
            const address = groupID.isLead ? leadAddress : workerAddress;

            role.push(address);
          });

          // if (data.isFoundingMember) role.push(RoleAddress.foundingMember);
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
