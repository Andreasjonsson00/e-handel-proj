import multer from "multer";

const MAX_SIZE = 4 * 1024 * 1024 // 4 MB, Matches the Supabase Storage Bucket limit
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

// multer reads multipart/form-data, the format a browser uses to send files.
// limits the fileSize to 4MB
const upload = multer({
  limits: {fileSize: MAX_SIZE}
})

export function receiveImage(req, res, next) {
  upload.single("image")(req, res, function (err) {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        error: `The image is too large. Max ${MAX_SIZE / (1024 * 1024)} MB.`,
      });
      return;
    } else if (err) {
      res.status(400).json({
        error: `Could not read the File. Send ONE image file in the field "image`,
      });
      return;
    }

    next();
  });
}
