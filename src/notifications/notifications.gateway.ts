// import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';

// @WebSocketGateway({
//   cors: {
//     origin: '*',
//   },
// })
// export class NotificationsGateway {
//   @WebSocketServer()
//   server: Server;

//   // Send a message to users with a particular role
//   @SubscribeMessage('joinRoom')
//   handleJoinRoom(client: Socket, role: string) {
//     client.join(role);  // User joins a room based on their role
//   }

//   async sendNotificationToRole(role: string, message: string) {
//     this.server.to(role).emit('notification', message);
//   }
// }
