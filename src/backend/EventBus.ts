export interface EventBus {
    on(event: string, listener: (payload: any) => void): void;
    off(event: string, listener: (payload: any) => void): void;
    emit(event: string, payload?: any): void;
}
