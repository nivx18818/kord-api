import { Test, TestingModule } from '@nestjs/testing';

import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    // Set environment variable for testing
    process.env.JWT_ACCESS_SECRET = 'test-secret-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    delete process.env.JWT_ACCESS_SECRET;
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object from JWT payload', () => {
      const payload = {
        email: 'test@example.com',
        sub: 1,
        username: 'testuser',
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        email: 'test@example.com',
        id: 1,
        username: 'testuser',
      });
    });

    it('should extract user id from sub claim', () => {
      const payload = {
        email: 'another@example.com',
        sub: 999,
        username: 'anotheruser',
      };

      const result = strategy.validate(payload);

      expect(result.id).toBe(999);
      expect(result.email).toBe('another@example.com');
      expect(result.username).toBe('anotheruser');
    });
  });
});
