const jwt = require('jsonwebtoken');

// CHIAVE SEGRETA PER LA FIRMA DEL TOKEN DA HACKARE
const weakSecret = '12345';

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    // Check if token exists
    if (!token) {
        req.user = null;
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
        return res.status(401).json({ message: 'Token non valido' });
    }
}
};

// check if user is authenticated and has a role of admin
authMiddleware.isAdmin = (req, res, next) => {
    authMiddleware(req, res, () => {});
    if (!req.user) {
        return res.status(401).send('Non autorizzato');
    }
    if (req.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Vietato');
    }
};

module.exports = authMiddleware;