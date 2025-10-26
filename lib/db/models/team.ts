import type { ObjectId } from "mongodb"

export type TeamRole = "owner" | "admin" | "member"

export interface TeamMember {
  userId: ObjectId
  role: TeamRole
}

export interface Team {
  _id?: ObjectId
  name: string
  description?: string
  owner: ObjectId
  members: TeamMember[]
  createdAt: Date
}

export const TeamSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "owner", "members", "createdAt"],
      properties: {
        name: {
          bsonType: "string",
          description: "Team name is required",
        },
        description: {
          bsonType: "string",
        },
        owner: {
          bsonType: "objectId",
          description: "Owner user ID is required",
        },
        members: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["userId", "role"],
            properties: {
              userId: { bsonType: "objectId" },
              role: {
                bsonType: "string",
                enum: ["owner", "admin", "member"],
              },
            },
          },
        },
        createdAt: {
          bsonType: "date",
        },
      },
    },
  },
}
