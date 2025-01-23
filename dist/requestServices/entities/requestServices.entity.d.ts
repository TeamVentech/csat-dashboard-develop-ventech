export declare class RequestServices {
    id: string;
    name: string;
    type: string;
    state: string;
    rating: string;
    addedBy: string;
    actions: string;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
    serviceId: string;
    generateCustomId(): void;
    isExpiringSoon(): boolean;
}
