export const GroupIdToRoleParam = {
  contentWorkingGroup: "Content",
  forumWorkingGroup: "Forum",
  appWorkingGroup: "App",
  membershipWorkingGroup: "Membership",
  distributionWorkingGroup: "Distribution",
  storageWorkingGroup: "Storage",
  operationsWorkingGroupAlpha: "Builder",
  operationsWorkingGroupBeta: "HR",
  operationsWorkingGroupGamma: "Marketing",
} as const;

export type GroupIdName = keyof typeof GroupIdToRoleParam;

export interface MemberRoleState {
  foundingMember: boolean;
  creator: boolean;
  councilMember: boolean;
  contentWorker: boolean;
  contentLead: boolean;
  appWorker: boolean;
  appLead: boolean;
  forumWorker: boolean;
  forumLead: boolean;
  membershipWoker: boolean;
  membershipLead: boolean;
  discributionWorker: boolean;
  discributionLead: boolean;
  storageWorker: boolean;
  storageLead: boolean;
  buildWorker: boolean;
  buildLead: boolean;
  hrWorker: boolean;
  hrLead: boolean;
  marketingWorker: boolean;
  marketingLead: boolean;
}
