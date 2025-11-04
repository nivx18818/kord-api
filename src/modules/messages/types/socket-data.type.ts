import { Socket } from 'socket.io';

// Using 'any' for Socket generic parameters as they are not relevant for our use case
export type AuthenticatedSocket = Socket<any, any, any, SocketData>;

export interface SocketData {
  user?: {
    email: string;
    id: number;
    username: string;
  };
}
