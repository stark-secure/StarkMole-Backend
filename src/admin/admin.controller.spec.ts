/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MetricsService } from './services/metrics.service';
import { AdminGuard } from './guards/admin.guard';
import { ExecutionContext } from '@nestjs/common';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;
  let metricsService: MetricsService;

  const mockAdminService = {
    getDashboardData: jest.fn(),
    exportToCsv: jest.fn(),
  };

  const mockMetricsService = {
    getActiveUsers: jest.fn(),
    getSystemErrors: jest.fn(),
    getGamesSummary: jest.fn(),
    getSystemHealth: jest.fn(),
  };

  const mockAdminGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = { id: 1, email: 'admin@test.com', role: 'admin' };
      return true;
    }),
  };

  const mockRequest = {
    user: { id: 1, email: 'admin@test.com', role: 'admin' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        { provide: MetricsService, useValue: mockMetricsService },
        { provide: AdminGuard, useValue: mockAdminGuard },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return dashboard data', async () => {
      const expectedData = {
        overview: { activeUsers: 100, gamesPlayed: 500 },
        charts: { userActivity: [], gamesTrend: [] },
      };
      mockAdminService.getDashboardData.mockResolvedValue(expectedData);

      const result = await controller.getDashboard(mockRequest as any);

      expect(result).toEqual(expectedData);
      expect(mockAdminService.getDashboardData).toHaveBeenCalled();
    });
  });

  describe('getActiveUsers', () => {
    it('should return active users data', async () => {
      const expectedData = { count: 50, hours: 24 };
      mockMetricsService.getActiveUsers.mockResolvedValue(expectedData);

      const result = await controller.getActiveUsers('24', mockRequest as any);

      expect(result).toEqual(expectedData);
      expect(mockMetricsService.getActiveUsers).toHaveBeenCalledWith(24);
    });

    it('should use default hours when not provided', async () => {
      const expectedData = { count: 50, hours: 24 };
      mockMetricsService.getActiveUsers.mockResolvedValue(expectedData);

      const result = await controller.getActiveUsers(
        undefined,
        mockRequest as any,
      );

      expect(result).toEqual(expectedData);
      expect(mockMetricsService.getActiveUsers).toHaveBeenCalledWith(24);
    });
  });

  // describe('getSystemErrors', () => {
  //   it('should return system errors', async () => {
  //     const expectedData = { errors: [], total: 0, page: 1 };
  //     mockMetricsService.getSystemErrors.mockResolvedValue(expectedData);

  //     const result = await controller.getSystemErrors(
  //       '1',
  //       '50',
  //       mockRequest as any,
  //     );

  //     expect(result).toEqual(expectedData);
  //     expect(mockMetricsService.getSystemErrors).toHaveBeenCalledWith(1, 50);
  //   });
  // });

  describe('getGamesSummary', () => {
    it('should return games summary', async () => {
      const expectedData = { totalGames: 100, days: 7 };
      mockMetricsService.getGamesSummary.mockResolvedValue(expectedData);

      const result = await controller.getGamesSummary('7', mockRequest as any);

      expect(result).toEqual(expectedData);
      expect(mockMetricsService.getGamesSummary).toHaveBeenCalledWith(7);
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health data', async () => {
      const expectedData = { uptime: 3600, memory: { usage: 50 } };
      mockMetricsService.getSystemHealth.mockResolvedValue(expectedData);

      const result = await controller.getSystemHealth(mockRequest as any);

      expect(result).toEqual(expectedData);
      expect(mockMetricsService.getSystemHealth).toHaveBeenCalled();
    });
  });

  describe('exportDataCsv', () => {
    it('should export data as CSV', async () => {
      const expectedData = { filename: 'users_export.csv', data: 'csv,data' };
      mockAdminService.exportToCsv.mockResolvedValue(expectedData);

      const result = await controller.exportDataCsv(
        'users',
        '30',
        mockRequest as any,
      );

      expect(result).toEqual(expectedData);
      expect(mockAdminService.exportToCsv).toHaveBeenCalledWith('users', 30);
    });
  });
});
