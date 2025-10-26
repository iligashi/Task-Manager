import type { ObjectId } from "mongodb"

export interface RefreshToken {
  token: string
  createdAt: Date
  ip: string
}

export interface User {
  _id?: ObjectId
  name: string
  email: string
  passwordHash: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
  refreshTokens: RefreshToken[]
}

export const UserSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "passwordHash", "createdAt", "updatedAt"],
      properties: {
        name: {
          bsonType: "string",
          description: "User full name is required",
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Valid email is required",
        },
        passwordHash: {
          bsonType: "string",
          description: "Password hash is required",
        },
        avatarUrl: {
          bsonType: "string",
        },
        createdAt: {
          bsonType: "date",
        },
        updatedAt: {
          bsonType: "date",
        },
        refreshTokens: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["token", "createdAt"],
            properties: {
              token: { bsonType: "string" },
              createdAt: { bsonType: "date" },
              ip: { bsonType: "string" },
            },
          },
        },
      },
    },
  },
}
