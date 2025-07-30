// /* eslint-disable prettier/prettier */
// import { Test, TestingModule } from '@nestjs/testing';
// import { HttpExceptionFilter } from './http-exception.filter';
// import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
// import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';

// describe('HttpExceptionFilter', () => {
//   let filter: HttpExceptionFilter;
//   let mockLogger: any;

//   beforeEach(async () => {
//     mockLogger = {
//       error: jest.fn(),
//     };

//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         HttpExceptionFilter,
//         {
//           provide: WINSTON_MODULE_PROVIDER,
//           useValue: mockLogger,
//         },
//       ],
//     }).compile();

//     filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
//   });

//   it('should be defined', () => {
//     expect(filter).toBeDefined();
//   });

//   it('should handle HTTP exceptions', () => {
//     const mockResponse = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//     };

//     const mockRequest = {
//       method: 'GET',
//       url: '/test',
//       body: { test: 'data' },
//       headers: { 'content-type': 'application/json' },
//     };

//     const mockHost = {
//       switchToHttp: () => ({
//         getResponse: () => mockResponse,
//         getRequest: () => mockRequest,
//       }),
//     } as ArgumentsHost;

//     const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

//     filter.catch(exception, mockHost);

//     expect(mockLogger.error).toHaveBeenCalledWith(
//       'HTTP Exception: GET /test',
//       {
//         status: 400,
//         message: 'Test error',
//         stack: expect.any(String),
//         request: {
//           method: 'GET',
//           url: '/test',
//           body: { test: 'data' },
//           headers: { 'content-type': 'application/json' },
//         },
//       },
//     );

//     expect(mockResponse.status).toHaveBeenCalledWith(400);
//     expect(mockResponse.json).toHaveBeenCalledWith({
//       statusCode: 400,
//       timestamp: expect.any(String),
//       path: '/test',
//       message: 'Test error',
//     });
//   });

//   it('should handle generic errors', () => {
//     const mockResponse = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//     };

//     const mockRequest = {
//       method: 'POST',
//       url: '/api/test',
//       body: {},
//       headers: {},
//     };

//     const mockHost = {
//       switchToHttp: () => ({
//         getResponse: () => mockResponse,
//         getRequest: () => mockRequest,
//       }),
//     } as ArgumentsHost;

//     const exception = new Error('Generic error');

//     filter.catch(exception, mockHost);

//     expect(mockLogger.error).toHaveBeenCalledWith(
//       'HTTP Exception: POST /api/test',
//       {
//         status: 500,
//         message: 'Internal server error',
//         stack: expect.any(String),
//         request: {
//           method: 'POST',
//           url: '/api/test',
//           body: {},
//           headers: {},
//         },
//       },
//     );

//     expect(mockResponse.status).toHaveBeenCalledWith(500);
//     expect(mockResponse.json).toHaveBeenCalledWith({
//       statusCode: 500,
//       timestamp: expect.any(String),
//       path: '/api/test',
//       message: 'Internal server error',
//     });
//   });
// });
