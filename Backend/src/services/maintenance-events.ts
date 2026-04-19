import { EventEmitter } from 'events';

/** Broadcasts maintenance ticket changes to all subscribed SSE clients (each client still GETs scoped data). */
export const maintenanceBus = new EventEmitter();
maintenanceBus.setMaxListeners(0);

export function notifyTicketsChanged(): void {
  maintenanceBus.emit('tickets_changed');
}
