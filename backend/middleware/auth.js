const jwt = require('jsonwebtoken');

// Protect routes - Authentication middleware
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Add user to request (you'll need to import your User model)
            // req.user = await User.findById(decoded.id).select('-password');

            req.user = decoded;
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(401).json({
                success: false,
                message: 'Not authorized, token failed',
            });
        }
    }

    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Not authorized, no token',
        });
    }
};

module.exports = { protect };
