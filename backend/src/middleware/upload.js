const multer = require("multer");

// Memory storage, so we can pass buffer directly to MinIO
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload; // export the multer instance directly
