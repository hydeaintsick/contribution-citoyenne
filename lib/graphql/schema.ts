import { GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import type { GraphQLContext } from "./auth";

const typeDefs = `
  scalar DateTime

  enum ContributionType {
    ALERT
    SUGGESTION
  }

  enum ContributionStatus {
    OPEN
    CLOSED
  }

  type Commune {
    id: ID!
    name: String!
    slug: String
    postalCode: String!
    osmId: String!
    osmType: String!
    latitude: Float!
    longitude: Float!
    country: String!
    websiteUrl: String
    isVisible: Boolean!
    isPartner: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Category {
    id: ID!
    name: String!
    description: String
    isActive: Boolean!
    badgeColor: String!
    badgeTextColor: String!
  }

  type User {
    id: ID!
    email: String!
    firstName: String
    lastName: String
  }

  type Location {
    label: String
    latitude: Float
    longitude: Float
  }

  type Photo {
    url: String!
    publicId: String
  }

  type Contribution {
    id: ID!
    type: ContributionType!
    status: ContributionStatus!
    category: Category
    categoryLabel: String!
    title: String!
    details: String!
    location: Location
    photo: Photo
    email: String
    ticketNumber: String
    createdAt: DateTime!
    updatedAt: DateTime!
    closedAt: DateTime
    closureNote: String
    closedBy: User
    isPotentiallyMalicious: Boolean!
    commune: Commune!
  }

  type ContributionConnection {
    edges: [ContributionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ContributionEdge {
    node: Contribution!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  input ContributionFilter {
    status: ContributionStatus
    type: ContributionType
    categoryId: ID
    startDate: DateTime
    endDate: DateTime
  }

  input PaginationInput {
    first: Int
    after: String
    last: Int
    before: String
  }

  type ContributionTotals {
    overall: Int!
    last30Days: Int!
    alerts: ContributionTypeCount!
    suggestions: ContributionTypeCount!
  }

  type ContributionTypeCount {
    count: Int!
    percentage: Float!
  }

  type TrendPoint {
    label: String!
    date: String!
    alerts: Int!
    suggestions: Int!
  }

  type ContributionTimeline {
    weekly: [TrendPoint!]!
    monthly: [TrendPoint!]!
    yearly: [TrendPoint!]!
  }

  type MapPoint {
    id: ID!
    type: ContributionType!
    latitude: Float!
    longitude: Float!
    createdAt: String!
    locationLabel: String
  }

  type MapBounds {
    southwest: [Float!]!
    northeast: [Float!]!
  }

  type ContributionMap {
    bounds: MapBounds!
    points: [MapPoint!]!
  }

  type ContributionStats {
    totals: ContributionTotals!
    timeline: ContributionTimeline!
    map: ContributionMap!
  }

  type Query {
    commune: Commune!
    contribution(id: ID!): Contribution
    contributions(filter: ContributionFilter, pagination: PaginationInput): ContributionConnection!
    stats(startDate: DateTime, endDate: DateTime): ContributionStats!
    categories: [Category!]!
  }
`;

// Le schéma sera complété avec les résolveurs
export function createGraphQLSchema(resolvers: any): GraphQLSchema {
  return makeExecutableSchema({
    typeDefs,
    resolvers,
  });
}

export { typeDefs };

