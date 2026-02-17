import fs from "fs";
import path from "path";
import { google } from "googleapis";

const KEY_FILE_PATH = path.join(
  __dirname,
  "./../drivecredentials/book-convater-57e2b221243e.json"
);


const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID as string;


const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE_PATH,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({
  version: "v3",
  auth,
});

export const uploadFileToGoogleDrive = async (
  fileName: string,
  filePath: string,
  mimeType?: string
) => {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [FOLDER_ID],
      },
      media: {
        mimeType: mimeType || "application/octet-stream",
        body: fs.createReadStream(filePath),
      },
    });

    // Make file public
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const fileUrl = `https://drive.google.com/uc?id=${response.data.id}`;

    return {
      id: response.data.id,
      url: fileUrl,
    };
  } catch (error) {
    throw error;
  }
};
