const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const { PrismaClient } = require("@prisma/client");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const prisma = new PrismaClient();
const app = express();
app.use(bodyParser.json());

app.post("/auth", async (req, res) => {
  const idToken = req.body.idToken;
  if (!idToken) {
    return res.status(400).send("ID token is required");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, uid } = decodedToken;

    // Cari atau buat pengguna di database
    let user = await prisma.user.findUnique({ where: { googleId: uid } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email,
          name: name,
          googleId: uid,
        },
      });
      return res
        .status(201)
        .send({ message: "User registered successfully", user: user });
    }

    res.status(200).send({ message: "Login successful", user: user });
  } catch (error) {
    console.error("Error verifying ID token:", error);
    res.status(401).send("Unauthorized");
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
