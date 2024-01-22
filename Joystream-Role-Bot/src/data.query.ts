import { graphql } from "./gql";
import { GraphQLClient } from "graphql-request";

const getMembersQueryDoc = graphql(`
  query getMembers {
    memberships(
      limit: 500000
      where: { externalResources_some: { type_eq: DISCORD } }
    ) {
      handle
      id
      createdAt
      isFoundingMember
      isCouncilMember
      rootAccount
      externalResources {
        type
        value
      }
      roles {
        status {
          __typename
        }
        groupId
        isLead
      }
    }
  }
`);

const graphQLClient = new GraphQLClient(
  process.env.QUERY_NODE || "https://query.joystream.org/graphql",
);

export const getMembers = async () => {
  const data = await graphQLClient.request(getMembersQueryDoc);
  return data.memberships;
};
