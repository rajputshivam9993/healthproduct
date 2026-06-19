import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthUser } from '../../common/decorators/current-user.decorator';

/**
 * Socket.io gateway for real-time notifications and chat (Req 12, 13). Connections
 * are authenticated with the JWT access token (Req 12.4/12.5); each user joins a
 * private room so the service can push events to them by id.
 */
@WebSocketGateway({ cors: true })
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Authenticates the socket via JWT and joins the user's private room (Req 12.4). */
  async handleConnection(client: Socket): Promise<void> {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      client.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      client.emit('error', 'Missing access token');
      client.disconnect();
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync<AuthUser>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      client.data.userId = payload.id;
      await client.join(this.room(payload.id));
    } catch {
      // Invalid/expired token: reject the connection (Req 12.5).
      client.emit('error', 'Invalid or expired token');
      client.disconnect();
    }
  }

  /** Emits an event to a specific user's room (used by the service). */
  emitToUser(userId: string, event: string, data: unknown): void {
    this.server.to(this.room(userId)).emit(event, data);
  }

  private room(userId: string): string {
    return `user:${userId}`;
  }
}
