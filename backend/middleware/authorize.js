// Authorization middleware - Check user roles

// Restrict to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, please login',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`,
            });
        }

        next();
    };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, please login',
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required',
        });
    }

    next();
};

// Check resource ownership
const checkOwnership = (Model, resourceIdParam = 'id') => {
    return async (req, res, next) => {
        try {
            const resource = await Model.findById(req.params[resourceIdParam]);

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: 'Resource not found',
                });
            }

            // Admin can access any resource
            if (req.user.role === 'admin') {
                req.resource = resource;
                return next();
            }

            // Check ownership - resource should have 'user' field
            const ownerId = resource.user ? resource.user.toString() : null;

            if (ownerId !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this resource',
                });
            }

            req.resource = resource;
            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error checking resource ownership',
            });
        }
    };
};

module.exports = { authorize, isAdmin, checkOwnership };
