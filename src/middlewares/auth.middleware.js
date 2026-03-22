import jwt from "jsonwebtoken";

export const extractTokenFromHeader = (authorization = "") => {
  if (!authorization) return null;

  const parts = authorization.split(" ");

  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }

  return authorization;
};

export const verifyToken = (token) => {
  if (!token) {
    throw new Error("No token provided");
  }

  return jwt.verify(token, process.env.JWT_SECRET);
};

export const verifyJWT = (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: error.message === "No token provided" ? "No token provided" : "Invalid token"
    });
  }
};