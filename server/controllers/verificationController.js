const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Upload and verify driver license
// @route   POST /api/verification/upload
// @access  Private
const verifyLicense = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Read file
        const imagePath = req.file.path;
        const imageData = fs.readFileSync(imagePath);
        const imageBase64 = imageData.toString('base64');

        // Prepare for Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `
      Analyze this image of a driver's license. 
      Extract the following information in JSON format:
      {
        "name": "Full Name",
        "licenseNumber": "License Number",
        "expiryDate": "Expiry Date (YYYY-MM-DD)",
        "isValid": boolean (true if it looks like a valid license and not expired),
        "nameMatch": boolean,
        "failReason": "String explaining why it failed or why name didn't match (optional)"
      }
      
      Compare the name on the license with the user's profile name: "${user.name}".
      Set "nameMatch" to true if they match. Be lenient:
      - Ignore case.
      - Ignore middle names or initials if the first and last name match.
      - Allow minor typos.
      
      If "isValid" is false, explain why in "failReason" (e.g., "Expired", "Not a license", "Blurry").
      If "nameMatch" is false, explain why in "failReason".
      
      Return ONLY the JSON.
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: req.file.mimetype,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up JSON string (remove markdown code blocks if present)
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        console.log('Gemini Raw Response:', text);
        console.log('Cleaned JSON:', jsonString);

        const data = JSON.parse(jsonString);
        console.log('Parsed Data:', data);
        console.log('User Name:', user.name);
        console.log('Name Match:', data.nameMatch);
        console.log('Is Valid:', data.isValid);

        // Update User
        if (data.isValid && data.nameMatch) {
            user.verificationStatus = 'verified';
        } else {
            user.verificationStatus = 'rejected';
            console.log('Verification Rejected. Reason:', !data.isValid ? 'Invalid License' : 'Name Mismatch');
        }

        user.licenseDetails = {
            name: data.name,
            licenseNumber: data.licenseNumber,
            expiryDate: data.expiryDate,
            extractedData: data,
        };

        await user.save();

        // Clean up uploaded file
        fs.unlinkSync(imagePath);

        res.json({
            success: true,
            data: {
                verificationStatus: user.verificationStatus,
                details: data,
                failReason: data.failReason,
            },
        });

    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
    }
};

module.exports = {
    verifyLicense,
};
