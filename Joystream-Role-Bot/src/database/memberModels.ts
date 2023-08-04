import { model, Schema } from "mongoose";
import { RoleMember } from "src/query/generator/members_generate";

export interface RoleBotData {
  id: string;
  handle: string;
  createAt: Date;
  isFoundingMember: boolean;
  isCouncilMember: boolean;
  isCreator: boolean;
  rootAccount: string;
  roles: RoleMember[];
}

interface RoleSchema {
  groupId: {
    __typename: String;
  };
  isLead: Boolean;
  status: String;
}
export const RoleBot = new Schema({
  id: String,
  handle: String,
  createAt: Date,
  isFoundingMember: Boolean,
  isCouncilMember: Boolean,
  isCreator: Boolean,
  rootAccount: String,
  roles: Array<RoleSchema>,
});

export default model<RoleBotData>("memberRole", RoleBot);
