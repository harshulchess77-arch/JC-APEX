// Mock base44 client to prevent WebSocket connection errors
const mockEntity = {
  list: () => Promise.resolve([]),
  filter: () => Promise.resolve([]),
  subscribe: () => () => {},
  create: () => Promise.resolve({}),
  update: () => Promise.resolve({}),
  delete: () => Promise.resolve({}),
  bulkCreate: () => Promise.resolve([])
};

export const base44 = {
  auth: {
    me: () => Promise.reject(new Error('Base44 disabled')),
    logout: () => {},
    redirectToLogin: () => {}
  },
  entities: {
    RaceSession: mockEntity,
    LapLog: mockEntity,
    CommsMessage: mockEntity,
    StrategyPreset: mockEntity,
    RaceMessage: mockEntity
  }
};
