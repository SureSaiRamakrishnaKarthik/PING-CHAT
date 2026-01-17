const Messages = require("../models/messageModel");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

module.exports.addImageMessage = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Convert buffer to base64 and upload
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    // Upload to Cloudinary with timeout
    const uploadResponse = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Upload timeout"));
      }, 30000); // 30 second timeout

      cloudinary.uploader.upload(
        dataURI,
        {
          resource_type: "auto",
          timeout: 30000,
        },
        (error, result) => {
          clearTimeout(timeout);
          if (error) reject(error);
          else resolve(result);
        },
      );
    });

    // Save message with image URL
    const data = await Messages.create({
      message: { text: uploadResponse.secure_url },
      sender: from,
      reciever: to,
      imageUrl: uploadResponse.secure_url,
    });

    if (data) {
      return res.json({
        msg: "Image message added successfully.",
        imageUrl: uploadResponse.secure_url,
      });
    }
    return res.status(500).json({ error: "Failed to save image message" });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ error: "Image upload failed: " + error.message });
  }
};

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
      // users: {
      //   $all: [from, to],
      // },
      $or: [
        { sender: from, reciever: to },
        { sender: to, reciever: from },
      ],
    }).sort({ updatedAt: 1 });

    const projectedMessages = messages.map((msg) => {
      return {
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
        imageUrl: msg.imageUrl,
      };
    });
    res.json(projectedMessages);
  } catch (error) {
    next(error);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;
    const data = await Messages.create({
      message: { text: message },
      // users: [from, to],
      sender: from,
      reciever: to,
    });

    if (data) return res.json({ msg: "Message added successfully." });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (error) {
    next(error);
  }
};
