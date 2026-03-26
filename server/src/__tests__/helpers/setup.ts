import { vi, afterEach } from 'vitest';

// Global mocks
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  child: vi.fn().mockReturnThis(),
  levels: {
    values: {
      fatal: 60,
      error: 50,
      warn: 40,
      info: 30,
      debug: 20,
      trace: 10,
    },
    labels: {
      10: 'trace',
      20: 'debug',
      30: 'info',
      40: 'warn',
      50: 'error',
      60: 'fatal',
    },
  },
};

vi.mock('../../utils/logger', () => ({
  logger: mockLogger,
}));

vi.mock('../utils/logger', () => ({
  logger: mockLogger,
}));

// Add any custom matchers or teardown logic here
afterEach(() => {
  vi.clearAllMocks();
});
