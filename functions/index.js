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

// -----------------------------
// Submit Payment (HTTP)
// Accepts POST JSON: { appointmentId, userId, userName, userEmail, petName, service, amount, method, referenceNumber }
// Writes to `payments` and updates `appointments` status atomically.
// Use this function instead of client-side writes when you need elevated privileges.
// -----------------------------
exports.submitPayment = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send({error: "Method not allowed, use POST"});
  }

  try {
    const data = req.body;
    // Basic validation
    if (!data || !data.appointmentId || !data.userId || !data.referenceNumber) {
      return res.status(400).send({error: "Missing required fields"});
    }

    const paymentData = {
      appointmentId: data.appointmentId,
      userId: data.userId,
      userName: data.userName || "",
      userEmail: data.userEmail || "",
      petName: data.petName || "",
      service: data.service || "",
      amount: data.amount || 0,
      method: data.method || "GCash",
      referenceNumber: data.referenceNumber,
      paymentType: data.paymentType || "Reservation Payment",
      status: "Pending Approval",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Write payment and update appointment in a transaction
    await db.runTransaction(async (tx) => {
      const apptRef = db.collection("appointments").doc(data.appointmentId);
      const apptSnap = await tx.get(apptRef);
      if (!apptSnap.exists) throw new Error("Appointment not found");

      // create payment doc
      const paymentsRef = db.collection("payments").doc();
      tx.set(paymentsRef, paymentData);

      // update appointment
      tx.update(apptRef, {
        status: "Pending Approval",
        paymentStatus: "Pending Approval",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return res.status(200).send({message: "Payment recorded and appointment updated"});
  } catch (err) {
    console.error("submitPayment error:", err);
    return res.status(500).send({error: err.message || "Internal error"});
  }
});

// -----------------------------
// Submit Payment (callable)
// Same logic as the HTTP endpoint but exposed as an `onCall` function
// so the client can invoke it securely using the Functions SDK.
// Accepts data: { appointmentId, userId, userName, userEmail, petName, service, amount, method, referenceNumber }
// -----------------------------
exports.submitPaymentCallable = functions.https.onCall(async (data, context) => {
  try {
    if (!data || !data.appointmentId || !data.userId || !data.referenceNumber) {
      throw new Error("Missing required fields");
    }

    const paymentData = {
      appointmentId: data.appointmentId,
      userId: data.userId,
      userName: data.userName || "",
      userEmail: data.userEmail || "",
      petName: data.petName || "",
      service: data.service || "",
      amount: data.amount || 0,
      method: data.method || "GCash",
      referenceNumber: data.referenceNumber,
      paymentType: data.paymentType || "Reservation Payment",
      status: "Pending Approval",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.runTransaction(async (tx) => {
      const apptRef = db.collection("appointments").doc(data.appointmentId);
      const apptSnap = await tx.get(apptRef);
      if (!apptSnap.exists) throw new Error("Appointment not found");

      const paymentsRef = db.collection("payments").doc();
      tx.set(paymentsRef, paymentData);

      tx.update(apptRef, {
        status: "Pending Approval",
        paymentStatus: "Pending Approval",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return {message: "Payment recorded and appointment updated"};
  } catch (err) {
    console.error("submitPaymentCallable error:", err);
    throw new functions.https.HttpsError("internal", err.message || "Internal error");
  }
});
