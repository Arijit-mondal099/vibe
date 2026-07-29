/**
 * Commit message linting — enforces Conventional Commits
 * (e.g. `feat: add hero section`, `chore: scaffold app`, `fix: ...`).
 * Runs from the `commit-msg` Husky hook so malformed messages are rejected.
 */

const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [2, "always", 120],
  },
};

export default config;
