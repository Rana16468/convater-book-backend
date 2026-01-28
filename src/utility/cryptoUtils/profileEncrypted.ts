import crypto from "crypto";
import config from "../../app/config";

const algorithm = config.algorithm as string;
const SECRET_KEY = config.secret_key as string;
const key = crypto.scryptSync(SECRET_KEY, "salt", 32);

 const encryptPhoto = (text: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv) as crypto.CipherGCM;

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
};

 const decryptPhoto = (encryptedText: string): string => {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
    if (!ivHex || !authTagHex || !encrypted) return encryptedText;

    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(ivHex, "hex")
    ) as crypto.DecipherGCM; 

    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("Failed to decrypt photo:", err);
    return encryptedText;
  }
};

const isCloudinaryUrl = (url: string): boolean => {
  return url.includes("res.cloudinary.com");
};


const profileEncrypted={
    encryptPhoto, decryptPhoto, isCloudinaryUrl
};

export default  profileEncrypted;
