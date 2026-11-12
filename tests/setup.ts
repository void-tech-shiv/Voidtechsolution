import "@testing-library/jest-dom";

// Ensure all Vitest tests and repositories connect strictly to the isolated local test database
const TEST_DB =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:root@localhost:5432/voidtech_test_concurrency";

process.env.DATABASE_URL = TEST_DB;
process.env.DIRECT_URL = TEST_DB;
