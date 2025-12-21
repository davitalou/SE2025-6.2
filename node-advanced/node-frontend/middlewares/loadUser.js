import jwt from "jsonwebtoken";

export const loadUser = (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization) {
      token = req.headers.authorization.replace("Bearer ", "");
    }
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.locals.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    res.locals.user = decoded;
  } catch (err) {
    res.locals.user = null;
  }
  next();
};
