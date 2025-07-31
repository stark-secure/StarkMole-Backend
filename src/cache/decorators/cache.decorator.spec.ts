import { CacheKeys } from './cache.decorator';

describe('CacheKeys', () => {
  describe('build', () => {
    it('should replace single parameter in template', () => {
      const template = 'user:profile:{userId}';
      const params = { userId: '123' };

      const result = CacheKeys.build(template, params);

      expect(result).toBe('user:profile:123');
    });

    it('should replace multiple parameters in template', () => {
      const template = 'leaderboard:global:page:{page}:limit:{limit}';
      const params = { page: 1, limit: 50 };

      const result = CacheKeys.build(template, params);

      expect(result).toBe('leaderboard:global:page:1:limit:50');
    });

    it('should handle string and number parameters', () => {
      const template = 'games:user:{userId}:level:{level}';
      const params = { userId: 'abc-123', level: 5 };

      const result = CacheKeys.build(template, params);

      expect(result).toBe('games:user:abc-123:level:5');
    });

    it('should handle boolean parameters', () => {
      const template = 'settings:user:{userId}:enabled:{enabled}';
      const params = { userId: '123', enabled: true };

      const result = CacheKeys.build(template, params);

      expect(result).toBe('settings:user:123:enabled:true');
    });

    it('should handle same parameter appearing multiple times', () => {
      const template = 'analytics:{userId}:events:{userId}:summary';
      const params = { userId: '456' };

      const result = CacheKeys.build(template, params);

      expect(result).toBe('analytics:456:events:456:summary');
    });

    it('should return template unchanged if no parameters match', () => {
      const template = 'static:cache:key';
      const params = { userId: '123' };

      const result = CacheKeys.build(template, params);

      expect(result).toBe('static:cache:key');
    });

    it('should handle empty parameters object', () => {
      const template = 'static:cache:key';
      const params = {};

      const result = CacheKeys.build(template, params);

      expect(result).toBe('static:cache:key');
    });

    it('should handle null and undefined parameter values', () => {
      const template = 'test:{nullParam}:{undefinedParam}';
      const params = { nullParam: null, undefinedParam: undefined };

      const result = CacheKeys.build(template, params);

      expect(result).toBe('test:null:undefined');
    });

    it('should handle complex object parameters by stringifying', () => {
      const template = 'complex:{data}';
      const params = { data: { nested: { value: 'test' } } };

      const result = CacheKeys.build(template, params);

      expect(result).toBe('complex:[object Object]');
    });
  });

  describe('predefined cache keys', () => {
    it('should have correct global leaderboard key template', () => {
      expect(CacheKeys.GLOBAL_LEADERBOARD).toBe('leaderboard:global:page:{page}:limit:{limit}');
    });

    it('should have correct user leaderboard key template', () => {
      expect(CacheKeys.USER_LEADERBOARD).toBe('leaderboard:user:{userId}');
    });

    it('should have correct user profile key template', () => {
      expect(CacheKeys.USER_PROFILE).toBe('user:profile:{userId}');
    });

    it('should have correct user games key template', () => {
      expect(CacheKeys.USER_GAMES).toBe('games:user:{userId}');
    });

    it('should have correct user game stats key template', () => {
      expect(CacheKeys.USER_GAME_STATS).toBe('games:user:{userId}:stats');
    });

    it('should have correct analytics top events key template', () => {
      expect(CacheKeys.ANALYTICS_TOP_EVENTS).toBe('analytics:top-events:limit:{limit}:from:{from}:to:{to}');
    });

    it('should have correct analytics dashboard key template', () => {
      expect(CacheKeys.ANALYTICS_DASHBOARD).toBe('analytics:dashboard:days:{days}');
    });

    it('should have correct today challenge key template', () => {
      expect(CacheKeys.TODAY_CHALLENGE).toBe('challenge:today:{date}');
    });

    it('should have correct user badges key template', () => {
      expect(CacheKeys.USER_BADGES).toBe('badges:user:{userId}');
    });

    it('should have correct available badges key template', () => {
      expect(CacheKeys.AVAILABLE_BADGES).toBe('badges:available');
    });
  });
});
