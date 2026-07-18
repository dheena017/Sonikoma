# FAQ

**Q: Why bundle the CSS and JS in Python strings for the dashboard?**
A: To guarantee that generated health reports can be viewed offline, stored as CI/CD artifacts, and shared securely without relying on CDNs or internet access.

**Q: Can I use a different graphing library?**
A: The graph functionality is encapsulated behind `DependencyGraph` and `GraphBuilder`. While NetworkX is used internally, callers are decoupled from it.
