export type ExecutionResponse = ({
    /**
      * Indicates a successful response from the sandbox
      */
    success: true;
    /**
      * The result of the execution
      */
    result: any;
} | {
    /**
      * Indicates an unsuccessful response from the sandbox
      */
    success: false;
    /**
      * The error of the execution
      */
    error: any;
}) & {
    /**
      * @internal Indicates a response from the sandbox
      */
    sbxRs: true;
    /**
      * @internal The id of the request
      */
    id: string;
};
/**
 * @example ```ts
 * const sandbox = new Sandbox();
 * sandbox.overwriteHost('https://new-host.com');
 * sandbox.evaluate('console.log("Hello, world!");');
 * ```
 */
export default class Sandbox {
    private get sandboxId();
    protected executionQueue: {
        sbx: true;
        code: string;
        id: string;
        sandboxId: string;
    }[];
    protected executeQueue(): boolean;
    readonly sandbox: {
        getAll: () => string[];
        get: (key: string) => boolean;
        /** Needs to be called prior to init() - to modify parameters, call kill(), call this, then init() again. */
        add: (key: string) => void;
        /** You should reset the sandbox after this, however as the root sandbox is directly affected, the nested one should be fine without needing you to reset. */
        remove: (...keys: string[]) => void;
    };
    /** Frame load timeout */
    timeout: number;
    /** Sandbox parameters */
    readonly parameters: {
        get: (key: string) => string | boolean;
        getAll: () => {
            [x: string]: string | boolean;
        };
        /** Needs to be called prior to init() - to modify parameters, call kill(), call this, then init() again */
        set: (key: string, value: string | boolean) => void;
    };
    /**
     * Creates a new Sandbox instance
     * @param host The host to use for the sandbox
     */
    constructor();
    /**
     * Overwrites the host of the sandbox
     * @param newHost The new host to use
     * @internal
     */
    _overwriteHost(newHost: string): void;
    /**
     * Runs a function in the sandbox
     * @param funcBody The function to run
     */
    run(funcBody: string): Promise<ExecutionResponse>;
    /**
     * Alias to {@link Sandbox.run}
     */
    evaluate(funcBody: string): Promise<{
        success: true;
        result: any;
    } | {
        success: false;
        error: any;
    }>;
    /**
     * Initializes the sandbox
     */
    init(): Promise<this>;
    /**
     * Removes the sandbox
     */
    kill(): void;
}
export default Sandbox;

//# sourceMappingURL=lib.d.ts.map
