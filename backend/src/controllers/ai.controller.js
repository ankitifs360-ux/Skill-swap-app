import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/user.model.js";

export const getSmartMatch = async (req, res) => {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ 
        message: "Simulation Mode: Gemini API Key is missing. Connect with 'Ankit' - he knows React!",
        isSimulation: true 
      });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const currentUser = await User.findById(req.user.id).select("-password -resetPasswordToken");
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const otherUsers = await User.find({ _id: { $ne: currentUser._id } })
      .select("name bio skillsToTeach skillsToLearn reputation")
      .limit(10);

    if (otherUsers.length === 0) {
      return res.json({ message: "Not enough users on the platform to find a match yet!" });
    }

    const prompt = `
      You are a friendly Skill Swap community connector. 
      The current user is ${currentUser.name}. 
      They know: ${currentUser.skillsToTeach.join(", ")}. 
      They want to learn: ${currentUser.skillsToLearn.join(", ")}. 
      Their bio is: "${currentUser.bio || "No bio"}".
      
      Here are potential candidates in JSON format:
      ${JSON.stringify(otherUsers, null, 2)}
      
      Analyze the candidates and find the single BEST mutual skill exchange match for ${currentUser.name}. 
      Return a fun, enthusiastic 3-sentence response. Name the specific user they should connect with, explain exactly why their skills align perfectly for a mutual learning experience, and provide a quick suggestion for their first message. Do not use complex markdown formatting, just plain text with emojis.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ message: text });

  } catch (error) {
    console.error("AI Matcher Error:", error);
    return res.status(500).json({ message: "AI Engine is currently processing heavily. Try again!", isSimulation: true });
  }
};
