import type { ObjectId } from "mongodb"

export interface Comment {
  _id?: ObjectId
  taskId: ObjectId
  author: ObjectId
  content: string
  createdAt: Date
}

export const CommentSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["taskId", "author", "content", "createdAt"],
      properties: {
        taskId: {
          bsonType: "objectId",
          description: "Task ID is required",
        },
        author: {
          bsonType: "objectId",
          description: "Author user ID is required",
        },
        content: {
          bsonType: "string",
          description: "Comment content is required",
        },
        createdAt: {
          bsonType: "date",
        },
      },
    },
  },
}
