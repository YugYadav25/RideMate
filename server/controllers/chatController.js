const aiService = require('../services/aiService');

// @desc    Chat with AI
// @route   POST /api/chat
// @access  Private
const handleChat = async (req, res, next) => {
    try {
        console.log(`[Chat] Request from user: ${req.user.id}`);
        const { message } = req.body;
        const userId = req.user.id;

        if (!message) {
            console.log(`[Chat] Failed: Message is required`);
            return res.status(400).json({
                success: false,
                message: 'Message is required',
            });
        }

        const response = await aiService.chat(message, userId);
        console.log(`[Chat] Response generated successfully`);

        res.json({
            success: true,
            message: response,
        });
    } catch (error) {
        console.error(`[Chat] Error:`, error);
        next(error);
    }
};

module.exports = {
    handleChat,
};
