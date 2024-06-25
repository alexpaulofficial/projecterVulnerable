const jwt = require('jsonwebtoken');
const weakSecret = '12345';


const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    // Check if token exists
    if (!token) {
        req.user = null;
        //return res.status(401).json({ message: 'No token provided' });
        next();
    }
    else {
    try {
        // Verify the token
        const decoded = jwt.verify(token, weakSecret);

        // Attach the decoded token to the request object
        req.user = decoded;

        // Call the next middleware or route handler
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}
};

// check if user is authenticated and has a role of admin
authMiddleware.isAdmin = (req, res, next) => {
    authMiddleware(req, res, () => {});
    if (!req.user) {
        return res.status(401).send('Unauthorized');
    }
    if (req.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
};

module.exports = authMiddleware;