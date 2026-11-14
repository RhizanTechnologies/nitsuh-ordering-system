export declare class AppController {
    getHealth(): {
        status: string;
        service: string;
        message: string;
        timestamp: string;
    };
    getApiHealth(): {
        status: string;
        service: string;
        message: string;
        timestamp: string;
    };
    getHealthCheck(): {
        status: string;
        uptime: number;
        timestamp: string;
    };
}
