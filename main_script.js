const readline = require("readline");
const axios = require("axios");
const fs = require("fs");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  "Choose a document type (PAN/ICSE/CBSE/AADHAR): ",
  async (documentType) => {
    const fileName = await askForFileName();

    // Make API call with document type and file content
    const firstApiResponse = await makeFirstApiCall(documentType, fileName);
    console.log("Parser result: ", firstApiResponse);

    function generateRandomId() {
      return Math.floor(1000 + Math.random() * 9000);
    }

    const randomId = generateRandomId();

    let data = {
      identifier: documentType,
      id: randomId,
      data: firstApiResponse,
    };

    console.log("Data: ", data);

    // Make another API call with the result from the first call
    const secondApiResponse = await makeSecondApiCall(data);

    console.log("Result:", secondApiResponse);

    console.log("Waiting....");

    setTimeout(async () => {
      const res = await makeSecondApiCall(data);
      console.log("Verdict: ", res);

      if (res.verification === "Verified") console.log("Document verified!");
      else console.log("Document rejected!");
    }, 3000);

    rl.close();
  }
);

function askForFileName() {
  return new Promise((resolve, reject) => {
    rl.question("Enter the file name: ", (fileName) => {
      resolve(fileName);
    });
  });
}

async function makeFirstApiCall(documentType, filename) {
  try {
    const response = await axios.post("http://localhost:5000/parse_document", {
      document_type: documentType,
      filename: filename,
    });
    return response.data;
  } catch (error) {
    console.error("Error making first API call:", error);
    process.exit(1);
  }
}

async function makeSecondApiCall(data) {
  try {
    const response = await axios.post(
      "http://localhost:4000/uploadDocument",
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error making second API call:", error);
    process.exit(1);
  }
}
