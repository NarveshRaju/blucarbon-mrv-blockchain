// // --- server.js ---
// const express = require("express");
// const mongoose = require("mongoose");
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const multer = require("multer");
// const { BlobServiceClient } = require("@azure/storage-blob");
// require("dotenv").config();

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // ---------------- MongoDB Connection ----------------
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch(err => console.error("❌ MongoDB Error:", err));

// // ---------------- Schemas ----------------
// const userSchema = new mongoose.Schema({
//   username: String,
//   password: String,
//   loggedIn: { type: Boolean, default: false }
// });

// const formSchema = new mongoose.Schema({
//   ngoId: String,                // ✅ Added NGO ID
//   projectName: String,          // ✅ Replaced username with projectName
//   description: String,
//   location: String,
//   plantationType: String,
//   saplingsPlanted: Number,
//   walletAddress: String,
//   imageUrl: String, // Azure Blob URL
//   status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
//   createdAt: { type: Date, default: Date.now }
// });

// const User = mongoose.model("User", userSchema, "users_db");
// const Admin = mongoose.model("Admin", userSchema, "admin_db");
// const Form = mongoose.model("Form", formSchema, "forms_db");

// // ---------------- Azure Blob Setup ----------------
// const blobServiceClient = BlobServiceClient.fromConnectionString(
//   process.env.AZURE_STORAGE_CONNECTION_STRING
// );
// const containerName = "useruploads"; // make sure this container exists
// const containerClient = blobServiceClient.getContainerClient(containerName);

// // ---------------- Login Route ----------------
// app.post("/login", async (req, res) => {
//   const { username, password, role } = req.body;

//   if (!username || !password || !role) {
//     return res.status(400).json({ error: "Username, password, and role are required" });
//   }

//   try {
//     let accountModel = role === "admin" ? Admin : User;
//     const account = await accountModel.findOne({ username, password });

//     if (!account) return res.status(401).json({ error: "Invalid credentials" });

//     if (account.loggedIn) {
//       return res.json({ message: `${role} already logged in` });
//     }

//     account.loggedIn = true;
//     await account.save();

//     return res.json({ message: `${role} login successful` });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // ---------------- Logout Route ----------------
// app.post("/logout", async (req, res) => {
//   const { username, role } = req.body;

//   try {
//     let accountModel = role === "admin" ? Admin : User;
//     const account = await accountModel.findOne({ username });

//     if (!account) return res.status(404).json({ error: "Account not found" });

//     account.loggedIn = false;
//     await account.save();

//     res.json({ message: `${role} logged out` });
//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // ---------------- Form Submission Route ----------------
// app.post("/form", async (req, res) => {
//   try {
//     const { ngoId, projectName, description, location, plantationType, saplingsPlanted, walletAddress } = req.body;

//     const newForm = new Form({
//       ngoId,
//       projectName,
//       description,
//       location,
//       plantationType,
//       saplingsPlanted,
//       walletAddress
//     });

//     await newForm.save();
//     res.json({
//       error: false,
//       message: "Project added successfully",   // ✅ Updated message
//       projectId: newForm._id                   // ✅ Return projectId instead of formId
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       error: true,
//       message: "Failed to save form data"
//     });
//   }
// });

// // ---------------- Image Upload Route ----------------
// const upload = multer({ storage: multer.memoryStorage() });

// app.post("/upload/:projectId", upload.single("image"), async (req, res) => {
//   try {
//     const projectId = req.params.projectId;
//     const file = req.file;

//     if (!file) return res.status(400).json({ error: "No file uploaded" });

//     const blobName = `${Date.now()}-${file.originalname}`;
//     const blockBlobClient = containerClient.getBlockBlobClient(blobName);

//     await blockBlobClient.uploadData(file.buffer, {
//       blobHTTPHeaders: { blobContentType: file.mimetype }
//     });

//     const imageUrl = blockBlobClient.url;

//     await Form.findByIdAndUpdate(projectId, { imageUrl });

//     res.json({
//       message: "Image uploaded successfully",
//       projectId,
//       imageUrl
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Image upload failed" });
//   }
// });

// // ---------------- Get All Forms ----------------
// app.get("/forms", async (req, res) => {
//   try {
//     const forms = await Form.find().sort({ createdAt: -1 });
//     res.json(forms);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch forms" });
//   }
// });

// // ---------------- Update Form Status (DAO) ----------------
// app.patch("/forms/:id/status", async (req, res) => {
//   try {
//     const { status } = req.body;

//     if (!["Pending", "Approved", "Rejected"].includes(status)) {
//       return res.status(400).json({ error: "Invalid status value" });
//     }

//     const updatedForm = await Form.findByIdAndUpdate(
//       req.params.id,
//       { status },
//       { new: true }
//     );

//     if (!updatedForm) {
//       return res.status(404).json({ error: "Form not found" });
//     }

//     res.json({
//       message: "✅ Form status updated",
//       form: updatedForm,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to update form status" });
//   }
// });

// // ---------------- Start Server ----------------
// const PORT = 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// --- server.js ---
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();
const { triggerMinting } = require("./blockchain"); // import the function
const { v4: uuidv4 } = require("uuid");
// const Form = require("./models/Form"); // Your Mongoose model for projects
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------------- MongoDB Connection ----------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// ---------------- Schemas ----------------
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  loggedIn: { type: Boolean, default: false }
});

// Project (form) schema — optional price added for marketplace usage
const formSchema = new mongoose.Schema({
  ngoId: String,                // Added NGO ID
  projectName: String,          // Replaced username with projectName
  description: String,
  location: String,
  plantationType: String,
  saplingsPlanted: Number,
  walletAddress: String,
  price: Number,                // optional, for marketplace
  imageBase64s: [String],       // ✅ UPDATED: Array for multiple Base64 Image Data
  imageUrl: String,             // Azure Blob URL
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

// Company schema for credits & marketplace buyers
const companySchema = new mongoose.Schema({
  companyName: String,
  email: String,
  credits: { type: Number, default: 0 }, // credits balance
  createdAt: { type: Date, default: Date.now }
});

// DAO schema (organisations who can register/approve projects)
const daoSchema = new mongoose.Schema({
  daoName: String,
  email: String,
  createdAt: { type: Date, default: Date.now }
});

// Project registration storage for DAOs
const projectRegistrationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Form" },
  daoId: { type: mongoose.Schema.Types.ObjectId, ref: "DAO" },
  ngoId: String, // optional quick reference
  registeredAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["Registered", "Accepted", "Rejected"], default: "Registered" }
});

// Marketplace cart schema for companies/buyers
const cartSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  items: [
    {
      projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Form" },
      addedAt: { type: Date, default: Date.now }
      // quantity omitted because projects are unique items; add if needed
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

// Governance Proposal schema
const proposalSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: { type: String, enum: ["project_approval", "parameter_change", "fund_allocation"], default: "project_approval" },
  proposer: String, // wallet address
  forVotes: { type: Number, default: 0 },
  againstVotes: { type: Number, default: 0 },
  abstainVotes: { type: Number, default: 0 },
  quorum: { type: Number, default: 1000 },
  status: { type: String, enum: ["active", "passed", "failed", "executed"], default: "active" },
  voters: { type: Map, of: String, default: {} }, // walletAddress -> "for"/"against"/"abstain"
  endsAt: Date,
  executedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

// Carbon Credit Retirement schema
const retirementSchema = new mongoose.Schema({
  address: String, // wallet address
  amount: Number,
  txHash: String,
  certificateId: String,
  createdAt: { type: Date, default: Date.now }
});

// User Role schema
const userRoleSchema = new mongoose.Schema({
  walletAddress: { type: String, unique: true },
  role: { type: String, enum: ["ngo", "validator", "investor", "admin"], default: "investor" },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema, "users_db");
const Admin = mongoose.model("Admin", userSchema, "admin_db");
const Form = mongoose.model("Form", formSchema, "forms_db");
const Company = mongoose.model("Company", companySchema, "companies_db");
const DAO = mongoose.model("DAO", daoSchema, "daos_db");
const ProjectRegistration = mongoose.model("ProjectRegistration", projectRegistrationSchema, "project_registrations_db");
const Cart = mongoose.model("Cart", cartSchema, "carts_db");
const Proposal = mongoose.model("Proposal", proposalSchema, "proposals_db");
const Retirement = mongoose.model("Retirement", retirementSchema, "retirements_db");
const UserRole = mongoose.model("UserRole", userRoleSchema, "user_roles_db");

// ---------------- Azure Blob Setup ----------------
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const containerName = "useruploads"; // make sure this container exists
const containerClient = blobServiceClient.getContainerClient(containerName);

// ---------------- Login Route ----------------
app.post("/login", async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: "Username, password, and role are required" });
  }

  try {
    let accountModel = role === "admin" ? Admin : User;
    const account = await accountModel.findOne({ username, password });

    if (!account) return res.status(401).json({ error: "Invalid credentials" });

    if (account.loggedIn) {
      return res.json({ message: `${role} already logged in` });
    }

    account.loggedIn = true;
    await account.save();

    return res.json({ message: `${role} login successful` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- Logout Route ----------------
app.post("/logout", async (req, res) => {
  const { username, role } = req.body;

  try {
    let accountModel = role === "admin" ? Admin : User;
    const account = await accountModel.findOne({ username });

    if (!account) return res.status(404).json({ error: "Account not found" });

    account.loggedIn = false;
    await account.save();

    res.json({ message: `${role} logged out` });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- Form Submission Route ----------------
app.post("/form", async (req, res) => {
  try {
    const { ngoId, projectName, description, location, plantationType, saplingsPlanted, walletAddress, price } = req.body;

    const newForm = new Form({
      ngoId,
      projectName,
      description,
      location,
      plantationType,
      saplingsPlanted,
      walletAddress,
      price
    });

    await newForm.save();

    // Note: We DON'T auto-register the project to DAOs here.
    // The app (NGO) / client should call /register-project-to-dao if they want DAOs to be notified/stored.

    res.json({
      error: false,
      message: "Project added successfully",
      projectId: newForm._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: true,
      message: "Failed to save form data"
    });
  }
});

// ---------------- Image Upload Route base 64 new 3.15pm ----------------
// ---------------- Base64 Image Upload Route (NEW) ----------------
// Flutter app will call this endpoint with a JSON body containing the Base64 string.
// app.post("/upload-base64/:projectId", async (req, res) => {
//   try {
//     const projectId = req.params.projectId;
//     // The Flutter app should send the Base64 string with the data URI prefix 
//     // (e.g., "data:image/jpeg;base64,..." or "data:image/png;base64,...")
//     const { imageBase64 } = req.body; 

//     if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.length < 50) {
//       return res.status(400).json({ error: "Invalid or missing Base64 image data" });
//     }

//     // Update the project document with the Base64 string
//     const updatedForm = await Form.findByIdAndUpdate(
//       projectId,
//       { imageBase64: imageBase64 }, 
//       { new: true }
//     );

//     if (!updatedForm) {
//       return res.status(404).json({ error: "Project not found" });
//     }

//     // Success response
//     res.json({
//       message: "Image (Base64) uploaded and linked successfully to project",
//       projectId,
//       // NOTE: We avoid sending the huge Base64 string back in the response
//     });

//   } catch (err) {
//     console.error("❌ Base64 Upload Error:", err);
//     // Be mindful of MongoDB's 16MB document size limit for large images
//     if (err.message.includes('E11000')) {
//         return res.status(413).json({ error: "Image too large. MongoDB document size limit exceeded (16MB)." });
//     }
//     res.status(500).json({ error: "Base64 image upload failed", details: err.message });
//   }
// });

app.post("/upload-base64/:projectId", async (req, res) => {
  try {
    const projectId = req.params.projectId;
    // Expecting an array of Base64 strings (data URIs)
    const { imageBase64s } = req.body; 

    // Validate the input: must be an array and contain at least one valid string
    if (!Array.isArray(imageBase64s) || imageBase64s.length === 0 || 
        !imageBase64s.every(img => typeof img === 'string' && img.length > 50)) {
      return res.status(400).json({ error: "Invalid or missing array of Base64 image data" });
    }

    // Update the project document with the array of Base64 strings
    const updatedForm = await Form.findByIdAndUpdate(
      projectId,
      { imageBase64s: imageBase64s }, // Use the new array field name
      { new: true }
    );

    if (!updatedForm) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Success response
    res.json({
      message: "Images (Base64 array) uploaded and linked successfully to project",
      projectId,
      // NOTE: We avoid sending the huge Base64 strings back in the response
    });

  } catch (err) {
    console.error("❌ Base64 Upload Error:", err);
    // Be mindful of MongoDB's 16MB document size limit for large images
    if (err.message.includes('E11000')) {
        // This limit now applies to the total size of the document, including all Base64 strings combined.
        return res.status(413).json({ error: "Total image size too large. MongoDB document size limit exceeded (16MB)." });
    }
    // Check for potential body-parser error on size limit 
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: `Request body too large. Express limit is ${req.app.settings['body-parser-limit'] || '100mb'}. Try a smaller image array.` });
    }
    res.status(500).json({ error: "Base64 image upload failed", details: err.message });
  }
});


// ---------------- Get All Forms (projects) ----------------
// If ngoId is provided, return only projects belonging to that NGO
// app.get("/forms", async (req, res) => {
//   try {
//     const { ngoId } = req.query; // expecting query like /forms?ngoId=NGOID123
//     let query = {};
//     if (ngoId) {
//       query.ngoId = ngoId;
//     }

//     const forms = await Form.find(query).sort({ createdAt: -1 });
//     res.json(forms);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch forms" });
//   }
// });
// ---------------- Get All Forms (projects) ---------------- proper working
// app.get("/forms", async (req, res) => {
//   try {
//     const { ngoId } = req.query; // ✅ read from query params
//     let query = {};

//     if (ngoId) {
//       query.ngoId = ngoId; // ✅ filter by ngoId if provided
//     }

//     const forms = await Form.find(query).sort({ createdAt: -1 });

//     // ✅ transform _id → projectId before sending response
//     const response = forms.map(form => ({
//       projectId: form._id,
//       ngoId: form.ngoId,
//       projectName: form.projectName,
//       description: form.description,
//       location: form.location,
//       plantationType: form.plantationType,
//       saplingsPlanted: form.saplingsPlanted,
//       walletAddress: form.walletAddress,
//       imageUrl: form.imageUrl,
//       status: form.status,
//       createdAt: form.createdAt
//     }));

//     res.json(response);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch forms" });
//   }
// });

// get all forms w soldstatus 11.35
// ---------------- GET all forms (with sold status) ----------------
// ---------------- GET all forms (with sold status & listing date) ----------------
// app.get("/forms", async (req, res) => {
//   try {
//     const { ngoId } = req.query; 
//     let query = {};

//     if (ngoId) {
//       query.ngoId = ngoId; 
//     }

//     const forms = await Form.find(query).sort({ createdAt: -1 });

//     const response = forms.map(form => {
//       // ✅ check if project has been sold
//       const isSold =
//         form.price && form.totalTokens && form.totalCost &&
//         form.price > 0 && form.totalTokens > 0 && form.totalCost > 0;

//       return {
//         projectId: form._id,
//         ngoId: form.ngoId,
//         projectName: form.projectName,
//         description: form.description,
//         location: form.location,
//         plantationType: form.plantationType,
//         saplingsPlanted: form.saplingsPlanted,
//         walletAddress: form.walletAddress,
//         imageUrl: form.imageUrl,
//         status: form.status,
//         createdAt: form.createdAt,
//         soldStatus: isSold ? "Sold" : "Not Sold",   // ✅ fixed
//         listingDate: isSold ? form.updatedAt : null // ✅ show when sold
//       };
//     });

//     res.json(response);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch forms" });
//   }
// });

//new get /form without id 3.20pm
// ---------------- Get All Forms (projects) - MODIFIED for Base64 ----------------
app.get("/forms", async (req, res) => {
  try {
    const { ngoId } = req.query; 
    let query = {};

    if (ngoId) {
      query.ngoId = ngoId; 
    }

    const forms = await Form.find(query).sort({ createdAt: -1 });

    const response = forms.map(form => {
      const isSold =
        form.price && form.totalTokens && form.totalCost &&
        form.price > 0 && form.totalTokens > 0 && form.totalCost > 0;

      return {
        projectId: form._id,
        ngoId: form.ngoId,
        projectName: form.projectName,
        description: form.description,
        location: form.location,
        plantationType: form.plantationType,
        saplingsPlanted: form.saplingsPlanted,
        walletAddress: form.walletAddress,
        imageBase64s: form.imageBase64s, // ✅ Returning the array of Base64 data
        status: form.status,
        createdAt: form.createdAt,
        soldStatus: isSold ? "Sold" : "Not Sold",
        listingDate: isSold ? form.updatedAt : null
      };
    });

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch forms" });
  }
});


// new form for project api 11.25pm
// app.get("/forms/:id", async (req, res) => {
//   try {
//     const projectId = req.params.id;

//     // Check if the provided ID is a valid format for MongoDB
//     if (!mongoose.Types.ObjectId.isValid(projectId)) {
//       return res.status(400).json({ error: "Invalid Project ID format" });
//     }

//     const project = await Form.findById(projectId);

//     // If the database search finds nothing, send a specific 404 error
//     if (!project) {
//       return res.status(404).json({ error: "Project not found" });
//     }

//     // If the project is found, send its data
//     res.json(project);

//   } catch (err) {
//     console.error("Error fetching single project:", err);
//     res.status(500).json({ error: "Failed to fetch project" });
//   }
// });

// new get forms for id 
// ---------------- Get Single Form (project) - MODIFIED for Base64 ----------------
app.get("/forms/:id", async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: "Invalid Project ID format" });
    }

    const project = await Form.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Return the document including the imageBase64 field
    res.json(project);

  } catch (err) {
    console.error("Error fetching single project:", err);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});


// ---------------- Get All Projects for Sale (Website) ----------------
app.get("/projects-for-sale", async (req, res) => {
  try {
    const projects = await Form.find({}).sort({ createdAt: -1 });

    const response = projects.map(project => ({
      projectId: project._id,
      ngoId: project.ngoId,
      projectName: project.projectName,
      description: project.description,
      location: project.location,
      plantationType: project.plantationType,
      noOfPlantations: project.saplingsPlanted,
      totalTokens: project.saplingsPlanted || 0,
      costPerToken: project.price || 0,
      totalCost: project.totalCost || (project.saplingsPlanted * (project.price || 0)),
      walletAddress: project.walletAddress,
      imageUrl: project.imageUrl,
      status: project.status,
      createdAt: project.createdAt
    }));

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects for sale" });
  }
});

// ---------------- Update Form Status (DAO) ----------------
// app.patch("/forms/:id/status", async (req, res) => {
//   try {
//     const { status } = req.body;

//     if (!["Pending", "Approved", "Rejected"].includes(status)) {
//       return res.status(400).json({ error: "Invalid status value" });
//     }

//     const updatedForm = await Form.findByIdAndUpdate(
//       req.params.id,
//       { status },
//       { new: true }
//     );

//     if (!updatedForm) {
//       return res.status(404).json({ error: "Form not found" });
//     }

//     res.json({
//       message: "✅ Form status updated",
//       form: updatedForm,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to update form status" });
//   }
// });

// new form id status + minting + 1st time trying
// app.patch("/forms/:id/status", async (req, res) => {
//   try {
//     const { status } = req.body;

//     if (!["Pending", "Approved", "Rejected"].includes(status)) {
//       return res.status(400).json({ error: "Invalid status value" });
//     }

//     const updatedForm = await Form.findByIdAndUpdate(
//       req.params.id,
//       { status },
//       { new: true }
//     );

//     if (!updatedForm) {
//       return res.status(404).json({ error: "Form not found" });
//     }

//     // ✅ If approved, trigger blockchain minting
//     if (status === "Approved") {
//       const result = await triggerMinting(
//         updatedForm.walletAddress,        // NGO wallet from DB
//         updatedForm.saplingsPlanted,      // Number of tokens = saplings
//         updatedForm._id.toString()        // Use project ID
//       );

//       if (result.success) {
//         updatedForm.blockchainTx = result.transactionHash; // optional field
//         await updatedForm.save();
//       }
//     }

//     res.json({ message: "✅ Form status updated", form: updatedForm });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to update form status" });
//   }
// });

//trying status + minting again 2nd time trying
// ---------------- Update Form Status (DAO) ----------------
app.patch("/forms/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updatedForm = await Form.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedForm) {
      return res.status(404).json({ error: "Form not found" });
    }

    res.json({ message: "✅ Form status updated", form: updatedForm });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update form status" });
  }
});

// ----------------- Sell Token APIs -----------------

// GET token sale details for a project
// app.get("/sell-token/:projectId", async (req, res) => {
//   try {
//     const projectId = req.params.projectId;
//     const project = await Form.findById(projectId);

//     if (!project) return res.status(404).json({ error: "Project not found" });

//     // Calculate total tokens and total cost if available
//     const totalTokens = project.saplingsPlanted || 0;
//     const costPerToken = project.price || 0; // assuming initial per token cost stored in price
//     const totalCost = totalTokens * costPerToken;

//     res.json({
//       projectId: project._id,
//       projectName: project.projectName,
//       plantationType: project.plantationType,
//       noOfPlantations: project.saplingsPlanted,
//       totalTokens,
//       costPerToken,
//       totalCost
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch token sale details" });
//   }
// });

// POST token sale: store price per token & total tokens
app.post("/token/sell", async (req, res) => {
  try {
    const { projectId, pricePerToken, totalTokens, totalAmount } = req.body;

    if (typeof pricePerToken !== "number" || typeof totalTokens !== "number") {
      return res.status(400).json({ error: "pricePerToken and totalTokens must be numbers" });
    }

    const project = await Form.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    project.price = pricePerToken;
    project.totalTokens = totalTokens;
    project.totalCost = totalAmount;
    await project.save();

    res.json({ message: "Token sale info updated", project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list token for sale" });
  }
});

// ---------------- GET token sale details for an NGO ----------------
// app.get("/sell-token/:ngoId", async (req, res) => {
//   try {
//     const ngoId = req.params.ngoId;

//     // Find all projects belonging to this NGO
//     const projects = await Form.find({ ngoId });
//     if (!projects || projects.length === 0) {
//       return res.status(404).json({ error: "No projects found for this NGO" });
//     }

//     const details = projects.map((project) => {
//       const totalTokens = project.saplingsPlanted || 0;
//       const costPerToken = project.price || 0;
//       const totalCost = totalTokens * costPerToken;

//       return {
//         projectId: project._id,
//         projectName: project.projectName,
//         plantationType: project.plantationType,
//         noOfPlantations: project.saplingsPlanted,
//         totalTokens,
//         costPerToken,
//         totalCost,
//       };
//     });

//     res.json({ ngoId, projects: details });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch token sale details" });
//   }
// });

//get try #2 10.30pm
// ---------------- GET sold token details for an NGO ----------------
app.get("/sell-token", async (req, res) => {
  try {
    const ngoId = req.query.ngoId; // ✅ now from query param

    if (!ngoId) {
      return res.status(400).json({ error: "ngoId is required" });
    }

    // ✅ Find all projects that belong to NGO AND are sold (price set)
    const projects = await Form.find({ ngoId, price: { $exists: true, $ne: 0 } });

    if (!projects || projects.length === 0) {
      return res.status(404).json({ error: "No sold projects found for this NGO" });
    }

    const details = projects.map((project) => {
      const totalTokens = project.totalTokens || project.saplingsPlanted || 0;
      const costPerToken = project.price || 0;
      const totalCost = project.totalCost || totalTokens * costPerToken;

      return {
        projectId: project._id,
        projectName: project.projectName,
        plantationType: project.plantationType,
        noOfPlantations: project.saplingsPlanted,
        totalTokens,
        costPerToken,
        totalCost,
        listingDate: project.updatedAt || project.createdAt || new Date() // ✅ listing date
      };
    });

    res.json({ ngoId, soldProjects: details });
  } catch (err) {
    console.error("❌ Error in GET /sell-token:", err);
    res.status(500).json({ error: "Failed to fetch sold token details", details: err.message });
  }
});



// ---------------- POST token sale info ----------------
// app.post("/sell-token/:ngoId/:projectId", async (req, res) => {
//   try {
//     const { ngoId, projectId } = req.params;
//     const { costPerToken, totalCost } = req.body;

//     if (typeof costPerToken !== "number" || typeof totalCost !== "number") {
//       return res
//         .status(400)
//         .json({ error: "costPerToken and totalCost must be numbers" });
//     }

//     // Ensure project belongs to this NGO
//     const project = await Form.findOne({ _id: projectId, ngoId });
//     if (!project) {
//       return res
//         .status(404)
//         .json({ error: "Project not found for this NGO" });
//     }

//     // Update project with new values
//     project.price = costPerToken;
//     project.totalCost = totalCost;
//     await project.save();

//     res.json({ message: "Token sale info updated", project });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to update token sale info" });
//   }
// });

// new app post trying #2 6.10
// ---------------- POST token sale info ----------------
app.post("/token/sell", async (req, res) => {
  try {
    const { ngoId, projectId, pricePerToken, totalTokens, totalAmount } = req.body;

    // ✅ Validate input
    if (
      !ngoId ||
      !projectId ||
      typeof pricePerToken !== "number" ||
      typeof totalTokens !== "number" ||
      typeof totalAmount !== "number"
    ) {
      return res.status(400).json({ error: "Missing or invalid fields" });
    }

    // ✅ Find project in MongoDB
    const project = await Form.findOne({ _id: projectId, ngoId });
    if (!project) {
      return res.status(404).json({ error: "Project not found for this NGO" });
    }

    // ✅ Update project token sale info
    project.price = pricePerToken;
    project.totalTokens = totalTokens;
    project.totalCost = totalAmount;
    await project.save();

    // ✅ Optional transaction record
    const transaction = {
      transactionId: uuidv4(),
      type: "sell",
      ngoId,
      projectId,
      pricePerToken,
      tokens: totalTokens,
      amountReceived: totalAmount,
      date: new Date().toISOString()
    };

    res.json({
      status: "success",
      message: "Tokens listed for sale successfully",
      project: {
        projectId: project._id,
        ngoId: project.ngoId,
        projectName: project.projectName,
        plantationType: project.plantationType,
        noOfPlantations: project.saplingsPlanted,
        pricePerToken: project.price,
        totalTokens: project.totalTokens,
        totalCost: project.totalCost
      },
      transaction
    });
  } catch (err) {
    console.error("❌ Error in /token/sell:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// ----------------- NEW FEATURES START -----------------

// ---------------- Company (credits) APIs ----------------

// Create company (simple create - no required fields enforced)
app.post("/company", async (req, res) => {
  try {
    const { companyName, email, credits } = req.body;
    const newCompany = new Company({ companyName, email, credits });
    await newCompany.save();
    res.json({ message: "Company created", company: newCompany });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create company" });
  }
});

// Get company details (including credits)
app.get("/company/:companyId", async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch company" });
  }
});

// Add credits to company (increment)
app.post("/company/:companyId/credits", async (req, res) => {
  try {
    const { amount } = req.body;
    if (typeof amount !== "number") {
      return res.status(400).json({ error: "Amount must be a number" });
    }
    const company = await Company.findByIdAndUpdate(
      req.params.companyId,
      { $inc: { credits: amount } },
      { new: true }
    );
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json({ message: "Credits updated", company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update credits" });
  }
});

// Debit credits (internal use - e.g., during checkout)
async function debitCompanyCredits(companyId, amount) {
  if (amount <= 0) return { success: false, message: "Invalid amount" };
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const company = await Company.findById(companyId).session(session);
    if (!company) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, message: "Company not found" };
    }
    if (company.credits < amount) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, message: "Insufficient credits" };
    }
    company.credits -= amount;
    await company.save({ session });
    await session.commitTransaction();
    session.endSession();
    return { success: true, company };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("debitCompanyCredits error:", err);
    return { success: false, message: "Failed to debit credits" };
  }
}

// ---------------- DAO & Project Registration APIs ----------------

// Create DAO
app.post("/dao", async (req, res) => {
  try {
    const { daoName, email } = req.body;
    const newDao = new DAO({ daoName, email });
    await newDao.save();
    res.json({ message: "DAO created", dao: newDao });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create DAO" });
  }
});

// Get DAO details
app.get("/dao/:daoId", async (req, res) => {
  try {
    const dao = await DAO.findById(req.params.daoId);
    if (!dao) return res.status(404).json({ error: "DAO not found" });
    res.json(dao);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch DAO" });
  }
});

// Register a project for a DAO (store registration)
app.post("/register-project-to-dao", async (req, res) => {
  try {
    const { projectId, daoId, ngoId } = req.body;
    // No field compulsory per your instruction — but check existence to be helpful
    if (!projectId || !daoId) {
      return res.status(400).json({ error: "projectId and daoId recommended" });
    }

    const registration = new ProjectRegistration({ projectId, daoId, ngoId });
    await registration.save();

    res.json({ message: "Project registered to DAO", registration });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register project" });
  }
});

// DAO: get all projects registered to them (with project details populated)
app.get("/dao/:daoId/projects", async (req, res) => {
  try {
    const daoId = req.params.daoId;
    const regs = await ProjectRegistration.find({ daoId }).sort({ registeredAt: -1 }).populate("projectId");
    res.json(regs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch DAO projects" });
  }
});

// Get registrations for a specific project (which DAOs it was registered to)
app.get("/project/:projectId/registrations", async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const regs = await ProjectRegistration.find({ projectId }).sort({ registeredAt: -1 }).populate("daoId");
    res.json(regs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch project registrations" });
  }
});

// Update registration status (e.g., DAO accepts/rejects)
app.patch("/registration/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Registered", "Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const updated = await ProjectRegistration.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: "Registration not found" });
    res.json({ message: "Registration updated", registration: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update registration" });
  }
});

// ---------------- Marketplace Cart APIs ----------------

// Ensure a cart exists for company
async function ensureCart(companyId) {
  let cart = await Cart.findOne({ companyId });
  if (!cart) {
    cart = new Cart({ companyId, items: [] });
    await cart.save();
  }
  return cart;
}

// Add project to cart
app.post("/cart/:companyId/add", async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: "projectId is required" });

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ error: "Company not found" });

    const project = await Form.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const cart = await ensureCart(companyId);

    // prevent duplicates
    const exists = cart.items.some(i => i.projectId.toString() === projectId.toString());
    if (exists) {
      return res.json({ message: "Project already in cart", cart });
    }

    cart.items.push({ projectId });
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: "Project added to cart", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// Get company cart (populated)
app.get("/cart/:companyId", async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const cart = await Cart.findOne({ companyId }).populate("items.projectId");
    if (!cart) return res.json({ message: "Cart empty", cart: { companyId, items: [] } });
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// Remove an item from cart
app.delete("/cart/:companyId/item/:projectId", async (req, res) => {
  try {
    const { companyId, projectId } = req.params;
    const cart = await Cart.findOne({ companyId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const before = cart.items.length;
    cart.items = cart.items.filter(i => i.projectId.toString() !== projectId.toString());
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: "Item removed", removed: before - cart.items.length, cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove item" });
  }
});

// Clear cart
app.post("/cart/:companyId/clear", async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const cart = await Cart.findOne({ companyId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });
    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();
    res.json({ message: "Cart cleared", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

// Checkout cart: debit company credits based on project.price
app.post("/cart/:companyId/checkout", async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const cart = await Cart.findOne({ companyId }).populate("items.projectId");
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: "Cart is empty" });

    // sum prices (projects without price assumed 0)
    let total = 0;
    for (const item of cart.items) {
      const p = item.projectId;
      total += (p && typeof p.price === "number") ? p.price : 0;
    }

    // Attempt to debit company credits (transactionally)
    const debitResult = await debitCompanyCredits(companyId, total);
    if (!debitResult.success) {
      return res.status(400).json({ error: debitResult.message || "Failed to debit credits" });
    }

    // After successful debit: create simple purchase records (optional)
    // For now we clear the cart and return info; you can extend to save purchase history.
    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();

    res.json({
      message: "Checkout successful",
      totalDebited: total,
      company: debitResult.company
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// ----------------- NEW FEATURES END -----------------

// ================ GOVERNANCE APIs ================

// Get all proposals
app.get("/proposals", async (req, res) => {
  try {
    const proposals = await Proposal.find().sort({ createdAt: -1 });
    res.json(proposals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch proposals" });
  }
});

// Create proposal
app.post("/proposals", async (req, res) => {
  try {
    const { title, description, type, proposer, duration } = req.body;
    const endsAt = new Date(Date.now() + (duration || 7) * 24 * 60 * 60 * 1000);
    const proposal = new Proposal({ title, description, type, proposer, endsAt });
    await proposal.save();
    res.json({ message: "Proposal created", proposal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create proposal" });
  }
});

// Vote on proposal
app.post("/proposals/:id/vote", async (req, res) => {
  try {
    const { voter, voteType, votingPower } = req.body;
    if (!["for", "against", "abstain"].includes(voteType)) {
      return res.status(400).json({ error: "Invalid vote type" });
    }
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });
    if (proposal.status !== "active") return res.status(400).json({ error: "Voting has ended" });
    if (proposal.voters.get(voter)) return res.status(400).json({ error: "Already voted" });

    proposal.voters.set(voter, voteType);
    const power = votingPower || 1;
    if (voteType === "for") proposal.forVotes += power;
    else if (voteType === "against") proposal.againstVotes += power;
    else proposal.abstainVotes += power;

    await proposal.save();
    res.json({ message: "Vote recorded", proposal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record vote" });
  }
});

// ================ RETIREMENT APIs ================

// Record retirement
app.post("/retirements", async (req, res) => {
  try {
    const { address, amount, txHash } = req.body;
    const certificateId = `CERT-${Date.now().toString(36).toUpperCase()}`;
    const retirement = new Retirement({ address, amount, txHash, certificateId });
    await retirement.save();
    res.json({ message: "Retirement recorded", retirement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record retirement" });
  }
});

// Get all retirements
app.get("/retirements", async (req, res) => {
  try {
    const retirements = await Retirement.find().sort({ createdAt: -1 });
    res.json(retirements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch retirements" });
  }
});

// ================ ANALYTICS API ================

app.get("/analytics/summary", async (req, res) => {
  try {
    const projects = await Form.find();
    const retirements = await Retirement.find();
    const proposals = await Proposal.find();

    const totalTrees = projects.reduce((s, p) => s + (p.saplingsPlanted || 0), 0);
    const totalCO2 = Math.round(totalTrees * 22 / 1000 * 10) / 10;
    const totalRetired = retirements.reduce((s, r) => s + (r.amount || 0), 0);

    res.json({
      totalProjects: projects.length,
      approvedProjects: projects.filter(p => p.status === "Approved").length,
      pendingProjects: projects.filter(p => p.status === "Pending").length,
      totalTrees,
      totalCO2,
      totalRetired,
      activeProposals: proposals.filter(p => p.status === "active").length,
      totalProposals: proposals.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ================ USER ROLE API ================

app.post("/user-role", async (req, res) => {
  try {
    const { walletAddress, role } = req.body;
    const userRole = await UserRole.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      { role, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ message: "Role saved", userRole });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save role" });
  }
});

app.get("/user-role/:walletAddress", async (req, res) => {
  try {
    const userRole = await UserRole.findOne({ walletAddress: req.params.walletAddress.toLowerCase() });
    if (!userRole) return res.json({ role: null });
    res.json(userRole);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch role" });
  }
});

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
