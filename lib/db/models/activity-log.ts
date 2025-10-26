import type { ObjectId } from "mongodb"

export interface ActivityLog {
  _id?: ObjectId
  teamId: ObjectId
  actor: ObjectId
  action: string
  meta: Record<string, any>
  createdAt: Date
}

export const ActivityLogSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["teamId", "actor", "action", "createdAt"],
      properties: {
        teamId: {
          bsonType: "objectId",
        },
        actor: {
          bsonType: "objectId",
        },
        action: {
          bsonType: "string",
        },
        meta: {
          bsonType: "object",
        },
        createdAt: {
          bsonType: "date",
        },
      },
    },
  },
}
