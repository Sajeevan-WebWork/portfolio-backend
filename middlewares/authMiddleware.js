const authMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (apiKey !== process.env.API_SECRET_KEY) {
        return res.status(403).json({ error: "Access Denied: Invalid API Key" });
    }

    next();
};

module.exports = authMiddleware;
