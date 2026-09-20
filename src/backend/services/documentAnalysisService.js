/**
 * Document Analysis & OCR Intelligence Service — BlueChain MRV System
 *
 * Integrates Google Gemini API and Tesseract OCR to perform structured,
 * semantic audit of uploaded evidence (Land deeds, NGO registrations, Government permits).
 *
 * Strictly adheres to non-hallucinatory rules and legal honesty caveats.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const Tesseract = require("tesseract.js");

/**
 * Extracts raw textual content from Base64 or Image buffer using Tesseract OCR.
 * @param {string} base64Data - Image Base64 String
 * @returns {Promise<string>} Extracted OCR text
 */
async function extractTextWithOCR(base64Data) {
  if (!base64Data || typeof base64Data !== "string") return "";

  try {
    // Strip Base64 data header if present
    const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
    const imgBuffer = Buffer.from(cleanBase64, "base64");

    const result = await Tesseract.recognize(imgBuffer, "eng", {
      logger: () => {} // Silent
    });

    return result?.data?.text?.trim() || "";
  } catch (err) {
    console.warn("⚠️ Tesseract OCR Notice:", err.message);
    return "";
  }
}

/**
 * Analyzes uploaded evidence document against project metadata using Gemini AI.
 *
 * @param {object} params
 * @param {string} params.documentText - Text extracted via OCR or direct file reading
 * @param {string} params.fileName - Evidence file name
 * @param {string} params.category - Evidence category (e.g. land_authorization, ngo_registration, etc.)
 * @param {object} params.projectContext - Project metadata (projectName, ngoId, location, coordinates)
 * @returns {Promise<object>} Structured Gemini document analysis
 */
async function analyzeDocumentWithGemini({
  documentText = "",
  fileName = "",
  category = "supporting_document",
  projectContext = {}
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      status: "UNAVAILABLE",
      error: "GEMINI_API_KEY is not configured in backend environment.",
      fileName,
      category,
      documentType: category,
      organizationName: null,
      locationReferences: [],
      authorizationEvidence: "Automated semantic analysis unavailable (API key missing).",
      dateInformation: { issueDate: null, expiryDate: null },
      consistencyFindings: [],
      riskFlags: ["Automated semantic parsing unavailable; certified human validator must review."],
      confidence: 0,
      requiresHumanReview: true,
      limitations: [
        "Semantic AI parsing disabled. Human validator manual review required."
      ]
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash for high-speed structured extraction
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a certified, objective environmental auditor reviewing blue carbon restoration evidence.
Analyze the following document text extracted from an uploaded project file.

PROJECT CONTEXT:
- Project Name: "${projectContext.projectName || "N/A"}"
- NGO Steward: "${projectContext.ngoId || "N/A"}"
- Submitted Location: "${projectContext.location || "N/A"}"
- Submitted Coordinates: Lat ${projectContext.latitude || "N/A"}, Lon ${projectContext.longitude || "N/A"}
- Evidence File Name: "${fileName}"
- Declared Evidence Category: "${category}"

DOCUMENT TEXT:
"""
${documentText ? documentText.slice(0, 4000) : "[NO EXTRACTED OCR TEXT AVAILABLE — ONLY FILE METADATA]"}
"""

TASK:
Evaluate whether the document content is consistent with the project claims and contains evidence of authorization or authenticity.
DO NOT declare the document legally authentic with certainty. You are only an automated pre-screening layer.

Return ONLY a valid JSON object matching this schema without markdown code blocks:
{
  "documentType": "<Identified document type, e.g. Land Authorization / NGO Registration / Field Photo / Survey>",
  "organizationName": "<Organization or NGO name found in document, or null>",
  "locationReferences": ["<List of geographic place names, survey/plot numbers, or coordinates found>"],
  "authorizationEvidence": "<Summary of what permission, stewardship, or rights are conveyed>",
  "dateInformation": {
    "issueDate": "<YYYY-MM-DD or null>",
    "expiryDate": "<YYYY-MM-DD or null>"
  },
  "consistencyFindings": ["<Bullet points explaining alignment with submitted project>"],
  "riskFlags": ["<Potential inconsistencies, missing stamps, name mismatches, or date issues>"],
  "confidence": <integer between 0 and 100>,
  "requiresHumanReview": true,
  "limitations": ["Legal ownership cannot be certified by AI. Human validator verification required."]
}`;

    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text().trim();

    // Clean JSON response (remove markdown backticks if returned)
    const cleanJson = rawResponse.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      status: "SUCCESS",
      fileName,
      category,
      ...parsed,
      analyzedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error("❌ Gemini Document Analysis Error:", err.message);
    return {
      status: "UNAVAILABLE",
      error: `Gemini API query failed: ${err.message}`,
      fileName,
      category,
      documentType: category,
      organizationName: null,
      locationReferences: [],
      authorizationEvidence: "Analysis could not be completed automatically.",
      dateInformation: { issueDate: null, expiryDate: null },
      consistencyFindings: [],
      riskFlags: ["Automated semantic document analysis encountered an error. Manual inspection required."],
      confidence: 0,
      requiresHumanReview: true,
      limitations: [
        "External AI service failure. Human validator review is mandatory."
      ]
    };
  }
}

/**
 * Iterates over all project evidence documents, runs OCR if necessary, and aggregates Gemini semantic findings.
 *
 * @param {object} project - Project document from MongoDB
 * @returns {Promise<Array<object>>} List of analyzed evidence reports
 */
async function analyzeProjectEvidenceDocuments(project) {
  const results = [];
  const projectContext = {
    projectName: project.projectName || project.name,
    ngoId: project.ngoId,
    location: project.location,
    latitude: project.latitude,
    longitude: project.longitude
  };

  const evidenceItems = Array.isArray(project.evidence) ? project.evidence : [];
  const imageBase64s = Array.isArray(project.imageBase64s) ? project.imageBase64s : [];

  // 1. Process Structured Evidence Items
  for (const item of evidenceItems) {
    let docText = item.text || item.description || "";

    if (!docText && item.data && item.data.startsWith("data:image")) {
      docText = await extractTextWithOCR(item.data);
    }

    const analysis = await analyzeDocumentWithGemini({
      documentText: docText,
      fileName: item.fileName || item.name || "Evidence Document",
      category: item.category || "land_authorization",
      projectContext
    });

    results.push(analysis);
  }

  // 2. If no structured items but Base64 images exist, process primary images
  if (evidenceItems.length === 0 && imageBase64s.length > 0) {
    for (let i = 0; i < Math.min(imageBase64s.length, 3); i++) {
      const b64 = imageBase64s[i];
      const docText = await extractTextWithOCR(b64);

      const analysis = await analyzeDocumentWithGemini({
        documentText: docText,
        fileName: `Uploaded_Evidence_Photo_${i + 1}.png`,
        category: i === 0 ? "land_authorization" : "field_photograph",
        projectContext
      });

      results.push(analysis);
    }
  }

  return results;
}

module.exports = {
  extractTextWithOCR,
  analyzeDocumentWithGemini,
  analyzeProjectEvidenceDocuments
};
