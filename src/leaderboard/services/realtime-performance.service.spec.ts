// /* eslint-disable prettier/prettier */
// import { Test, TestingModule } from '@nestjs/testing';
// import { RealtimeGateway } from '../../common/gateways/realtime.gateway';
// import { RealtimePerformanceService } from './realtime-performance.service';

// // Mock RealtimeGateway
// const mockRealtimeGateway = {
//   emitLeaderboardUpdate: jest.fn(),
// };

// describe('RealtimePerformanceService', () => {
//   let service: RealtimePerformanceService;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         RealtimePerformanceService,
//         {
//           provide: RealtimeGateway,
//           useValue: mockRealtimeGateway,
//         },
//       ],
//     }).compile();

//     service = module.get<RealtimePerformanceService>(RealtimePerformanceService);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//     service.clearPendingUpdates();
//   });

//   describe('throttledEmitLeaderboardUpdate', () => {
//     it('should queue score change updates', async () => {
//       await service.throttledEmitLeaderboardUpdate('global', [], 'score_change');
//       const stats = service.getPerformanceStats();
//       expect(stats.pendingUpdates).toBe(1);
//       expect(mockRealtimeGateway.emitLeaderboardUpdate).not.toHaveBeenCalled();
//     });

//     it('should immediately emit critical updates (reset)', async () => {
//       await service.throttledEmitLeaderboardUpdate('global', [], 'reset');
//       const stats = service.getPerformanceStats();
//       expect(stats.pendingUpdates).toBe(0);
//       expect(mockRealtimeGateway.emitLeaderboardUpdate).toHaveBeenCalledWith(
//         'global',
//         [],
//         'reset',
//       );
//     });

//     it('should immediately emit critical updates (new_entry)', async () => {
//       await service.throttledEmitLeaderboardUpdate('global', [], 'new_entry');
//       const stats = service.getPerformanceStats();
//       expect(stats.pendingUpdates).toBe(0);
//       expect(mockRealtimeGateway.emitLeaderboardUpdate).toHaveBeenCalledWith(
//         'global',
//         [],
//         'new_entry',
//       );
//     });

//     it('should process queued updates after throttle period', async () => {
//       jest.useFakeTimers();
      
//       await service.throttledEmitLeaderboardUpdate('global', [], 'score_change');
//       expect(service.getPerformanceStats().pendingUpdates).toBe(1);
      
//       // Fast-forward time
//       jest.advanceTimersByTime(1100);
      
//       // This requires async operation to complete
//       await new Promise(resolve => setImmediate(resolve));

//       expect(service.getPerformanceStats().pendingUpdates).toBe(0);
//       expect(mockRealtimeGateway.emitLeaderboardUpdate).toHaveBeenCalledWith(
//         'global',
//         [],
//         'score_change',
//       );
      
//       jest.useRealTimers();
//     });
//   });

//   describe('handleUserConnection and Disconnection', () => {
//     it('should adjust throttle based on user load', async () => {
//       // Simulate high load
//       for (let i = 0; i <= 100; i++) {
//         await service.handleUserConnection();
//       }

//       let stats = service.getPerformanceStats();
//       expect(stats.connectedUsers).toBe(101);
//       expect(stats.throttleMs).toBe(2000);

//       // Simulate load decrease
//       await service.handleUserDisconnection();
//       stats = service.getPerformanceStats();
//       expect(stats.connectedUsers).toBe(100);
//       expect(stats.throttleMs).toBe(1000);
//     });
//   });
// });
