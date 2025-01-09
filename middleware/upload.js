import multer from "multer";
import { GridFsStorage } from "multer-gridfs-storage";
import { mongoConfig } from "../config/settings.js";
import { dbConnection } from "../config/mongoConnection.js";

const storage = new GridFsStorage({
  db: dbConnection(),
  file: (req, file) => {
    return {
      bucketName: "uploads",
      filename: `${Date.now()}-${file.originalname}`,
    };
  },
});

const upload = multer({ storage });

export default upload;
