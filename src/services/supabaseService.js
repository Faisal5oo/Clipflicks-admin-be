const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const uploadVideo = async (file) => {
  const { data, error } = await supabase.storage
    .from("videos")
    .upload(`uploads/${Date.now()}_${file.originalname}`, file.buffer, {
      contentType: file.mimetype,
    });
  if (error) throw new Error("Failed to upload video");
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/videos/${data.path}`;
};

module.exports = { uploadVideo };