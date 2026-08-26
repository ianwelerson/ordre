export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "build",
        "chore",
        "ci",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "revert",
        "style",
        "test",
        "setup",
      ],
    ],
    // A commit message is the subject line and nothing else. The diff says how,
    // and reasoning that outlives the conversation belongs in `apps/docs`.
    "body-empty": [2, "always"],
    // Keeps the subject-only rule closed at the other end, and makes the ban on
    // `Co-Authored-By` and other attribution trailers a check rather than a note.
    "footer-empty": [2, "always"],
  },
};
