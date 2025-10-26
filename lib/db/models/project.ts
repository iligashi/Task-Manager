import type { ObjectId } from "mongodb"

export interface ProjectColumn {
  _id: ObjectId
  title: string
  position: number
}

export type ProjectPrivacy = "team" | "private"

export interface ProjectSettings {
  privacy: ProjectPrivacy
}

export interface Project {
  _id?: ObjectId
  teamId: ObjectId
  name: string
  description?: string
  columns: ProjectColumn[]
  settings: ProjectSettings
  createdBy: ObjectId
  createdAt: Date
}

export const ProjectSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["teamId", "name", "columns", "settings", "createdBy", "createdAt"],
      properties: {
        teamId: {
          bsonType: "objectId",
          description: "Team ID is required",
        },
        name: {
          bsonType: "string",
          description: "Project name is required",
        },
        description: {
          bsonType: "string",
        },
        columns: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["_id", "title", "position"],
            properties: {
              _id: { bsonType: "objectId" },
              title: { bsonType: "string" },
              position: { bsonType: "number" },
            },
          },
        },
        settings: {
          bsonType: "object",
          required: ["privacy"],
          properties: {
            privacy: {
              bsonType: "string",
              enum: ["team", "private"],
            },
          },
        },
        createdBy: {
          bsonType: "objectId",
        },
        createdAt: {
          bsonType: "date",
        },
      },
    },
  },
}
