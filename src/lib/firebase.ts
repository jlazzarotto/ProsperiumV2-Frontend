// Mock implementations to replace Firebase
import { mockAuth } from "./mock-service"

// Mock Firebase app object
const app = {
  name: "mock-app",
  options: {}
}

// Mock Firestore object
const db = {
  name: "mock-firestore"
}

// Use mock auth instead of Firebase auth
const auth = mockAuth

console.log("Mock services initialized (replacing Firebase)")

export { app, db, auth }

