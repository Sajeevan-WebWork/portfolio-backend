const allowedOrigins = [
    'https://sajeevan-web-dev.web.app',
    'http://localhost:5000',
    'http://localhost:5173'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not Allowed by CORS"));
        }
    }
};

module.exports = corsOptions;
