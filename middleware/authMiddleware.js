function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next(); // User is authenticated, proceed to the route
  } else {
    return res.redirect("/login"); // Redirect to login if not authenticated
  }
}

export default isAuthenticated;
