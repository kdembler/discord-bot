import { Command } from "./Command";
import { Claim } from "./commands/Claim";
import { Solve } from "./commands/Solve";
import { Help } from "./commands/Help";
import { Status } from "./commands/Status";
import { WhoIs } from "./commands/WhoIs";
import { ListRoleMembers } from "./commands/ListRoleMembers";

export const Commands: Command[] = [
  Claim,
  Solve,
  Status,
  Help,
  WhoIs,
  ListRoleMembers,
];
