const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        const error = new Error("El archivo subido debe ser una imagen válida (JPEG, PNG, WEBP, etc.)");
        error.code = "INVALID_FILE_TYPE";
        cb(error, false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB máximo
    },
    fileFilter
});

/**
 * Middleware que envuelve multer para capturar errores de subida
 * y responder con formato JSON consistente.
 */
const handleUploadPhoto = (req, res, next) => {
    const uploadMiddleware = upload.fields([
        { name: "photo", maxCount: 1 },
        { name: "image", maxCount: 1 },
        { name: "file", maxCount: 1 }
    ]);

    uploadMiddleware(req, res, (err) => {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    error: "FILE_TOO_LARGE",
                    message: "La imagen excede el tamaño máximo permitido de 10 MB"
                });
            }
            if (err.code === "INVALID_FILE_TYPE") {
                return res.status(400).json({
                    error: "INVALID_FILE_TYPE",
                    message: err.message
                });
            }
            return res.status(400).json({
                error: "UPLOAD_ERROR",
                message: err.message || "Error al subir la imagen"
            });
        }
        next();
    });
};

module.exports = {
    handleUploadPhoto
};
