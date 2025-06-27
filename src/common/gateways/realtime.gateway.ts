import {
  WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect,
  MessageBody, ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { LeaderboardUpdateDto } from './dto/leaderboard-update.dto';
import { GameStateChangeDto } from './dto/game-state-change.dto';
import { NotificationDto } from './dto/notification.dto';
import { validateOrReject, ValidationError } from 'class-validator';

@WebSocketGateway({ namespace: '/realtime', cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  // Track connected users for demonstration 
  private connectedUsers: Map<string, string> = new Map(); 

  @UseGuards(WsJwtGuard)
  async handleConnection(client: Socket) {
    try {
      const user = (client as any).user;
      if (!user || !user.sub) {
        this.logger.warn(`Connection attempt without valid user payload.`);
        client.disconnect(true);
        return;
      }
      client.join(`user:${user.sub}`);
      this.connectedUsers.set(client.id, user.sub);
      this.logger.log(`User ${user.sub} connected (socket: ${client.id})`);
    } catch (err) {
      this.logger.error(`Error in handleConnection: ${err}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
      this.connectedUsers.delete(client.id);
    } else {
      this.logger.log(`Unknown user disconnected (socket: ${client.id})`);
    }
    
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaderboard:subscribe')
  async handleLeaderboardSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { leaderboardId: string }) {
    try {
      if (!data || typeof data.leaderboardId !== 'string' || !data.leaderboardId.trim()) {
        return { error: 'Invalid leaderboardId' };
      }
      client.join(`leaderboard:${data.leaderboardId}`);
      return { event: 'subscribed', leaderboardId: data.leaderboardId };
    } catch (err) {
      this.logger.error(`Error in leaderboard:subscribe: ${err}`);
      return { error: 'Subscription failed' };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('game:subscribe')
  async handleGameSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { gameId: string }) {
    try {
      if (!data || typeof data.gameId !== 'string' || !data.gameId.trim()) {
        return { error: 'Invalid gameId' };
      }
      client.join(`game:${data.gameId}`);
      return { event: 'subscribed', gameId: data.gameId };
    } catch (err) {
      this.logger.error(`Error in game:subscribe: ${err}`);
      return { error: 'Subscription failed' };
    }
  }

  async emitLeaderboardUpdate(leaderboardId: string, scores: any[]) {
    this.server.to(`leaderboard:${leaderboardId}`).emit('leaderboard:update', { leaderboardId, scores });
  }

  async emitGameStateChange(gameId: string, state: 'started' | 'paused' | 'ended') {
    this.server.to(`game:${gameId}`).emit('game:state-change', { gameId, state });
  }

  async emitNotification(userId: string, message: string, type: string) {
    this.server.to(`user:${userId}`).emit('notification:alert', { message, type });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('notification:send')
  async handleSendNotification(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: NotificationDto
  ) {
    try {
      await validateOrReject(Object.assign(new NotificationDto(), payload));
      const user = (client as any).user;
      if (user.role !== 'admin') return { error: 'Unauthorized' };
      this.emitNotification(payload.userId, payload.message, payload.type);
      return { status: 'sent' };
    } catch (err) {
      if (Array.isArray(err) && err[0] instanceof ValidationError) {
        return { error: 'Validation failed', details: err };
      }
      this.logger.error(`Error in notification:send: ${err}`);
      return { error: 'Notification failed' };
    }
  }
} 