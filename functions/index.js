/* eslint-disable max-len */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const auth = admin.auth();
const db = admin.firestore();

// -----------------------------
// Create New User
// -----------------------------
exports.createNewUser = functions.https.onCall(async (data) => {
  const {email, name, role} = data;

  try {
    // Create Firebase Auth user
    const userRecord = await auth.createUser({email, password: "Default@123"});

    // Add user data to Firestore
    await db.collection("users").doc(userRecord.uid).set({
      name,
      email,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {message: "User created successfully!"};
  } catch (error) {
    console.error("Error creating user:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// -----------------------------
// Delete User
// -----------------------------
exports.deleteUser = functions.https.onCall(async (data) => {
  const {uid} = data;

  try {
    // Delete from Firebase Auth
    await auth.deleteUser(uid);

    // Delete from Firestore
    await db.collection("users").doc(uid).delete();

    return {message: "User deleted successfully!"};
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// -----------------------------
// Reset User Password
// -----------------------------
exports.resetUserPassword = functions.https.onCall(async (data) => {
  const {email} = data;

  try {
    const link = await auth.generatePasswordResetLink(email);
    return {message: "Password reset email sent!", link};
  } catch (error) {
    console.error("Error resetting password:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// -----------------------------
// Edit User Info
// -----------------------------
exports.editUser = functions.https.onCall(async (data) => {
  const {uid, name, role} = data;

  try {
    // Update Firestore
    await db.collection("users").doc(uid).update({
      name,
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {message: "User updated successfully!"};
  } catch (error) {
    console.error("Error updating user:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// -----------------------------
// Sample Health Check Function
// -----------------------------
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase Functions!");
});
