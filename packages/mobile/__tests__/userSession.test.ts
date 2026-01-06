let mockDb: {
  execSync: jest.Mock;
  runSync: jest.Mock;
  getFirstSync: jest.Mock;
};
let store: Map<string, string>;

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

const loadUserSession = () => {
  jest.resetModules();
  return require('../src/shared/db/userSession') as typeof import('../src/shared/db/userSession');
};

const setupDb = () => {
  store = new Map<string, string>();
  mockDb = {
    execSync: jest.fn(),
    runSync: jest.fn((sql: string, params: string[]) => {
      if (sql.includes('INSERT INTO app_state')) {
        store.set(params[0], params[1]);
      } else if (sql.includes('DELETE FROM app_state')) {
        store.delete(params[0]);
      }
    }),
    getFirstSync: jest.fn((sql: string, params: string[]) => {
      const value = store.get(params[0]);
      return value ? { value } : undefined;
    }),
  };
};

describe('userSession', () => {
  beforeEach(() => {
    setupDb();
  });

  it('stores and returns current user id', () => {
    const { setCurrentUserId, getCurrentUserIdSync } = loadUserSession();
    setCurrentUserId('user-1');
    expect(getCurrentUserIdSync()).toBe('user-1');
  });

  it('clears current user id', () => {
    const { setCurrentUserId, getCurrentUserIdSync } = loadUserSession();
    setCurrentUserId('user-1');
    setCurrentUserId(null);
    expect(getCurrentUserIdSync()).toBeNull();
  });
});
