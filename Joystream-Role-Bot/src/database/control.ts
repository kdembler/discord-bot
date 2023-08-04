import {
  Client,
  CommandInteraction,
  Guild,
  GuildMember,
  Role,
} from "discord.js";
import MemberModel, { RoleBotData } from "./memberModels";
import IdModel from "./idModels";
import {
  MemberFieldFragment,
  getMembers,
} from "../query/generator/members_generate";
import { decodeAddress, encodeAddress } from "../hook/formatAddress";
import { RoleAddress, roleDBStatus } from "../RoleConfig";
import { upDateBlockNumber } from "../hook/blockCalc";

export let qn_recive_data: MemberFieldFragment[];

export const setMemberDB = async (
  client: Client,
  interaction: CommandInteraction
): Promise<void> => {
  qn_recive_data = await getMembers();

  console.log(qn_recive_data);
  const guild = interaction.guild;
  const members = guild?.members.cache;

  if (members) {
    members.forEach((member) => {
      console.log(`${member.user.tag}`);
    });
  }

  console.log("Database update finish!");
};

const groupIdToRolePara = (
  status: boolean | undefined,
  groupId: string,
  isLead: boolean | undefined,
  guild: Guild,
  member: GuildMember
) => {
  switch (groupId) {
    case "contentWorkingGroup":
      isLead
        ? addRole(
            RoleAddress.contentWorkingGroupLead,
            guild,
            member,
            "Content Lead",
            status
          )
        : addRole(
            RoleAddress.contentWorkingGroup,
            guild,
            member,
            "Content Worker",
            status
          );

      break;
    case "forumWorkingGroup":
      isLead
        ? addRole(
            RoleAddress.forumWorkingGroupLead,
            guild,
            member,
            "Forum Lead",
            status
          )
        : addRole(
            RoleAddress.forumWorkingGroup,
            guild,
            member,
            "Forum Worker",
            status
          );

      break;
    case "appWorkingGroup":
      isLead
        ? addRole(
            RoleAddress.appWorkingGroupLead,
            guild,
            member,
            "App Lead",
            status
          )
        : addRole(
            RoleAddress.appWorkingGroup,
            guild,
            member,
            "App Worker",
            status
          );

      break;
    case "membershipWorkingGroup":
      isLead
        ? addRole(
            RoleAddress.membershipWorkingGroupLead,
            guild,
            member,
            "Membership Lead",
            status
          )
        : addRole(
            RoleAddress.membershipWorkingGroup,
            guild,
            member,
            "Membership Worker",
            status
          );

      break;
    case "distributionWorkingGroup":
      isLead
        ? addRole(
            RoleAddress.distributionWorkingGroupLead,
            guild,
            member,
            "Distribution Lead",
            status
          )
        : addRole(
            RoleAddress.distributionWorkingGroup,
            guild,
            member,
            "Distribution Worker",
            status
          );

      break;
    case "storageWorkingGroup":
      isLead
        ? addRole(
            RoleAddress.storageWorkingGroupLead,
            guild,
            member,
            "Storage Lead",
            status
          )
        : addRole(
            RoleAddress.storageWorkingGroup,
            guild,
            member,
            "Storage Worker",
            status
          );

      break;
    case "operationsWorkingGroupAlpha":
      isLead
        ? addRole(
            RoleAddress.operationsWorkingGroupAlphaLead,
            guild,
            member,
            "Builder Lead",
            status
          )
        : addRole(
            RoleAddress.operationsWorkingGroupAlpha,
            guild,
            member,
            "Builder Worker",
            status
          );

      break;
    case "operationsWorkingGroupBeta":
      isLead
        ? addRole(
            RoleAddress.operationsWorkingGroupBetaLead,
            guild,
            member,
            "HR Lead",
            status
          )
        : addRole(
            RoleAddress.operationsWorkingGroupBeta,
            guild,
            member,
            "HR Worker",
            status
          );

      break;
    case "operationsWorkingGroupGamma":
      isLead
        ? addRole(
            RoleAddress.operationsWorkingGroupGammaLead,
            guild,
            member,
            "Marketing Lead",
            status
          )
        : addRole(
            RoleAddress.operationsWorkingGroupGamma,
            guild,
            member,
            "Marketing Worker",
            status
          );

      break;
    default:
      break;
  }
};

const addRole = async (
  roleId: string,
  guild: Guild,
  member: GuildMember,
  roleName: string,
  state: boolean | undefined
) => {
  const role = await guild.roles.fetch(roleId);
  if (role) {
    state ? await member.roles.add(role) : await member.roles.remove(role);
  } else {
    console.log(`${roleName} Role not found`);
  }
};

const changeDBdataToRoles = (
  groupId: string,
  isLead: boolean,
  status: boolean
) => {
  let buf: string = "";
  switch (groupId) {
    case "contentWorkingGroup":
      if (status)
        isLead
          ? (buf = RoleAddress.contentWorkingGroupLead)
          : (buf = RoleAddress.contentWorkingGroup);
      break;
    case "forumWorkingGroup":
      if (status)
        isLead
          ? (buf = RoleAddress.forumWorkingGroupLead)
          : (buf = RoleAddress.forumWorkingGroup);

      break;
    case "appWorkingGroup":
      if (status)
        isLead
          ? (buf = RoleAddress.appWorkingGroupLead)
          : (buf = RoleAddress.appWorkingGroup);

      break;
    case "membershipWorkingGroup":
      if (status)
        isLead
          ? (buf = RoleAddress.membershipWorkingGroupLead)
          : (buf = RoleAddress.membershipWorkingGroup);

      break;
    case "distributionWorkingGroup":
      if (status)
        isLead
          ? (buf = RoleAddress.distributionWorkingGroupLead)
          : (buf = RoleAddress.distributionWorkingGroup);

      break;
    case "storageWorkingGroup":
      if (status)
        isLead
          ? (buf = RoleAddress.storageWorkingGroupLead)
          : (buf = RoleAddress.storageWorkingGroup);

      break;
    case "operationsWorkingGroupAlpha":
      if (status)
        isLead
          ? (buf = RoleAddress.operationsWorkingGroupAlphaLead)
          : (buf = RoleAddress.operationsWorkingGroupAlpha);

      break;
    case "operationsWorkingGroupBeta":
      if (status)
        isLead
          ? (buf = RoleAddress.operationsWorkingGroupBetaLead)
          : (buf = RoleAddress.operationsWorkingGroupBeta);
      break;
    case "operationsWorkingGroupGamma":
      if (status)
        isLead
          ? (buf = RoleAddress.operationsWorkingGroupGammaLead)
          : (buf = RoleAddress.operationsWorkingGroupGamma);
      break;
    default:
      break;
  }
  return buf;
};

export const getUserIdtoRoles = async (id: string) => {
  const DiscordId = await IdModel.findOne({ discordHandle: id });

  let result: string[] = [];
  if (DiscordId) {
    if (DiscordId.verifyState) {
      const encodeAccount = encodeAddress(DiscordId.rootAccount, 126);
      await MemberModel.findOne({
        rootAccount: encodeAccount,
      })
        .then((d) => {
          if (d?.isCouncilMember) {
            result.push(RoleAddress.foundingMember);
          }
          if (d?.isCreator) {
            result.push(RoleAddress.creator);
          }
          if (d?.isFoundingMember) {
            result.push(RoleAddress.foundingMember);
          }

          d?.roles.map((rol: any) => {
            if (rol.groupId) {
              const status: boolean =
                rol.status.__typename === "WorkerStatusActive" ? true : false;

              result.push(changeDBdataToRoles(rol.groupId, rol.isLead, status));
            }
          });
        })
        .catch((err) => (result = err));

      return result;
    } else {
      return result;
    }
  } else {
    return result;
  }
};

export const setUserIdChallenge = async (
  userName: string,
  wallet: string,
  challenge: string
) => {
  const UserId = await IdModel.findOne({ discordHandle: userName });

  if (!UserId) {
    await IdModel.create({
      discordHandle: userName,
      challenge: challenge,
      rootAccount: wallet,
      verifyState: false,
    });
  } else {
    UserId.challenge = challenge;
    UserId.rootAccount = wallet;
    UserId.verifyState = false;
  }
  UserId?.save();
  return false;
};

export const getMembersOfRole = async (role: string) => {
  let result: string[] = [];

  switch (role) {
    case RoleAddress.foundingMember:
      const Members = await MemberModel.find({
        isFoundingMember: true,
      });
      for (const member of Members) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }
      break;
    case RoleAddress.creator:
      const createMembers = await MemberModel.find({
        isCreator: true,
      });
      for (const member of createMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }
      break;
    case RoleAddress.councilMember:
      const councilMembers = await MemberModel.find({
        isCouncilMember: true,
      });
      for (const member of councilMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }
      break;

    case RoleAddress.operationsWorkingGroupAlpha:
      const builderWorkingMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "operationsWorkingGroupAlpha",
            isLead: false,
          },
        },
      });

      for (const member of builderWorkingMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.operationsWorkingGroupAlphaLead:
      const builderWorkingLeadMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "operationsWorkingGroupAlpha",
            isLead: true,
          },
        },
      });

      for (const member of builderWorkingLeadMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.operationsWorkingGroupBeta:
      const HRMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "operationsWorkingGroupBeta",
            isLead: false,
          },
        },
      });

      for (const member of HRMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.operationsWorkingGroupBetaLead:
      const HRLeadMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "operationsWorkingGroupBeta",
            isLead: true,
          },
        },
      });

      for (const member of HRLeadMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.appWorkingGroup:
      const appMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "appWorkingGroup",
            isLead: false,
          },
        },
      });

      for (const member of appMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.appWorkingGroupLead:
      const appLeadMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "appWorkingGroup",
            isLead: true,
          },
        },
      });

      for (const member of appLeadMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.contentWorkingGroup:
      const contentMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "contentWorkingGroup",
            isLead: false,
          },
        },
      });

      for (const member of contentMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.contentWorkingGroupLead:
      const contentLeadMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "contentWorkingGroup",
            isLead: true,
          },
        },
      });

      for (const member of contentLeadMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.distributionWorkingGroup:
      const distributionMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "distributionWorkingGroup",
            isLead: false,
          },
        },
      });

      for (const member of distributionMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.distributionWorkingGroupLead:
      const distributionLeadMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "distributionWorkingGroup",
            isLead: true,
          },
        },
      });

      for (const member of distributionLeadMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.forumWorkingGroup:
      const forumMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "forumWorkingGroup",
            isLead: false,
          },
        },
      });

      for (const member of forumMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.forumWorkingGroupLead:
      const forumLeadMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "forumWorkingGroup",
            isLead: true,
          },
        },
      });

      for (const member of forumLeadMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.membershipWorkingGroup:
      const membershipMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "membershipWorkingGroup",
            isLead: false,
          },
        },
      });

      for (const member of membershipMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.membershipWorkingGroupLead:
      const membershipLeadMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "membershipWorkingGroup",
            isLead: true,
          },
        },
      });

      for (const member of membershipLeadMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.operationsWorkingGroupGamma:
      const marketingMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "operationsWorkingGroupGamma",
            isLead: false,
          },
        },
      });

      for (const member of marketingMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;
    case RoleAddress.operationsWorkingGroupGammaLead:
      const marketingLeadMembers = await MemberModel.find({
        roles: {
          $elemMatch: {
            "status.__typename": "WorkerStatusActive",
            groupId: "operationsWorkingGroupGamma",
            isLead: true,
          },
        },
      });

      for (const member of marketingLeadMembers) {
        const buf = await getVerifyUsers(member);
        if (buf) result.push(buf);
      }

      break;

    default:
      break;
  }

  return result;
};

const getVerifyUsers = async (member: RoleBotData) => {
  const buf = await IdModel.findOne({
    rootAccount: member.rootAccount,
  }).then((u) => {
    if (u?.verifyState) {
      return u.discordHandle;
    }
  });
  return buf;
};

export const getEmptyRole = async () => {
  const valuesArray = Object.values(RoleAddress);
  let result: string[] = [];
  for (const element of valuesArray) {
    let state: boolean = false;
    switch (element) {
      case RoleAddress.foundingMember:
        const Members = await MemberModel.find({
          isFoundingMember: true,
        });
        for (const member of Members) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }

        if (!state) result.push(RoleAddress.foundingMember);
        break;
      case RoleAddress.creator:
        const createMembers = await MemberModel.find({
          isCreator: true,
        });
        for (const member of createMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.creator);
        break;
      case RoleAddress.councilMember:
        const councilMembers = await MemberModel.find({
          isCouncilMember: true,
        });
        for (const member of councilMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.councilMember);
        break;

      case RoleAddress.operationsWorkingGroupAlpha:
        const builderWorkingMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "operationsWorkingGroupAlpha",
              isLead: false,
            },
          },
        });

        for (const member of builderWorkingMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.operationsWorkingGroupAlpha);

        break;
      case RoleAddress.operationsWorkingGroupAlphaLead:
        const builderWorkingLeadMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "operationsWorkingGroupAlpha",
              isLead: true,
            },
          },
        });

        for (const member of builderWorkingLeadMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.operationsWorkingGroupAlphaLead);

        break;
      case RoleAddress.operationsWorkingGroupBeta:
        const HRMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "operationsWorkingGroupBeta",
              isLead: false,
            },
          },
        });

        for (const member of HRMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.operationsWorkingGroupBeta);

        break;
      case RoleAddress.operationsWorkingGroupBetaLead:
        const HRLeadMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "operationsWorkingGroupBeta",
              isLead: true,
            },
          },
        });

        for (const member of HRLeadMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.operationsWorkingGroupBetaLead);

        break;
      case RoleAddress.appWorkingGroup:
        const appMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "appWorkingGroup",
              isLead: false,
            },
          },
        });

        for (const member of appMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.appWorkingGroup);

        break;
      case RoleAddress.appWorkingGroupLead:
        const appLeadMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "appWorkingGroup",
              isLead: true,
            },
          },
        });

        for (const member of appLeadMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.appWorkingGroupLead);

        break;
      case RoleAddress.contentWorkingGroup:
        const contentMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "contentWorkingGroup",
              isLead: false,
            },
          },
        });

        for (const member of contentMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.contentWorkingGroup);

        break;
      case RoleAddress.contentWorkingGroupLead:
        const contentLeadMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "contentWorkingGroup",
              isLead: true,
            },
          },
        });

        for (const member of contentLeadMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.contentWorkingGroupLead);

        break;
      case RoleAddress.distributionWorkingGroup:
        const distributionMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "distributionWorkingGroup",
              isLead: false,
            },
          },
        });

        for (const member of distributionMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.distributionWorkingGroup);

        break;
      case RoleAddress.distributionWorkingGroupLead:
        const distributionLeadMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "distributionWorkingGroup",
              isLead: true,
            },
          },
        });

        for (const member of distributionLeadMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.distributionWorkingGroupLead);

        break;
      case RoleAddress.forumWorkingGroup:
        const forumMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "forumWorkingGroup",
              isLead: false,
            },
          },
        });

        for (const member of forumMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.forumWorkingGroup);

        break;
      case RoleAddress.forumWorkingGroupLead:
        const forumLeadMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "forumWorkingGroup",
              isLead: true,
            },
          },
        });

        for (const member of forumLeadMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.forumWorkingGroupLead);

        break;
      case RoleAddress.membershipWorkingGroup:
        const membershipMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "membershipWorkingGroup",
              isLead: false,
            },
          },
        });

        for (const member of membershipMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.membershipWorkingGroup);

        break;
      case RoleAddress.membershipWorkingGroupLead:
        const membershipLeadMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "membershipWorkingGroup",
              isLead: true,
            },
          },
        });

        for (const member of membershipLeadMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.membershipWorkingGroupLead);

        break;
      case RoleAddress.operationsWorkingGroupGamma:
        const marketingMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "operationsWorkingGroupGamma",
              isLead: false,
            },
          },
        });

        for (const member of marketingMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.operationsWorkingGroupGamma);

        break;
      case RoleAddress.operationsWorkingGroupGammaLead:
        const marketingLeadMembers = await MemberModel.find({
          roles: {
            $elemMatch: {
              "status.__typename": "WorkerStatusActive",
              groupId: "operationsWorkingGroupGamma",
              isLead: true,
            },
          },
        });

        for (const member of marketingLeadMembers) {
          const buf = await getEmptyUsers(member);
          if (buf) state = true;
        }
        if (!state) result.push(RoleAddress.operationsWorkingGroupGammaLead);

        break;

      default:
        break;
    }
  }
  return result;
};

const getEmptyUsers = async (member: RoleBotData) => {
  const buf = await IdModel.findOne({
    rootAccount: member.rootAccount,
  }).then((u) => {
    if (u?.verifyState) {
      return true;
    }
  });
  if (buf) {
    return true;
  } else {
    return false;
  }
};

export interface Challenge {
  name?: string;
  wallet?: string;
  challenge?: string;
}

export const getChallengeData = async (
  username: string
): Promise<Challenge | Boolean> => {
  const UserData = await IdModel.findOne({ discordHandle: username });

  if (!UserData) {
    return false;
  }

  const val: Challenge = {
    challenge: UserData?.challenge,
    name: UserData?.discordHandle,
    wallet: UserData?.rootAccount,
  };

  return val;
};

export const setChallengeVerify = async (
  username: string
): Promise<Challenge | Boolean> => {
  const UserData = await IdModel.findOne({ discordHandle: username });

  if (!UserData) {
    return false;
  }

  UserData.verifyState = true;
  UserData.save();

  return true;
};
