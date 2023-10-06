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
}

/**
 * @example ```ts
 * const sandbox = new Sandbox();
 * sandbox.overwriteHost('https://new-host.com');
 * sandbox.evaluate('console.log("Hello, world!");');
 * ```
 */
export class Sandbox {
  private host: string | null = null;
  private frames: HTMLIFrameElement[] = [];
  private contentWindow: Window | null = null;
  private listenersById: Record<string, (data: any) => void> = {};
  private __sandboxId = Math.random().toString(36).substring(7);
  private get sandboxId(): string {
    return this.__sandboxId;
  }
  private params: Record<string, string | boolean> = {};
  protected executionQueue: { sbx: true; code: string; id: string, sandboxId: string, }[] = [];
  protected executeQueue() {
    if (!this.contentWindow) return false;
    const executionQueue = this.executionQueue;
    this.executionQueue = [];
    executionQueue.forEach((data) => {
      console.log('[sbjs] executing', data);
      this.contentWindow?.postMessage(data, '*');
    });
    return true;
  }

  /** Frame load timeout */
  public timeout = 8192;

  /** Sandbox parameters */
  public readonly parameters = {
    get: (key: string) => {
      return this.params[key] ?? null;
    },
    getAll: () => {
      return { ...this.params };
    },
    set: (key: string, value: string | boolean): void => {
      this.params[key] = value;
    },
  };

  /**
   * Creates a new Sandbox instance
   * @param host The host to use for the sandbox
   */
  constructor() {
    this.parameters.set('sbx', this.sandboxId);
    this.parameters.set('proxy', true);
  }

  /**
   * Overwrites the host of the sandbox
   * @param newHost The new host to use
   * @internal
   */
  public _overwriteHost(newHost: string): void {
    this.host = newHost;
    this.frames.forEach((frame) => {
      frame.src = `${this.host ?? 'https://sandboxjs.foo'}/?${Object.entries(this.params).map(([key, value]) => `${key}=${value}`).join('&')}`;
    });
  }

  /**
   * Runs a function in the sandbox
   * @param funcBody The function to run
   */
  public run(funcBody: string): Promise<ExecutionResponse> {
    return new Promise<ExecutionResponse>((resolve, reject) => {
      const id = 'sbjs_eval_' + Math.random().toString(36).substring(7);
      const obj = {
        sbx: true as true,
        code: funcBody,
        id,
        sandboxId: this.sandboxId,
      };
      this.listenersById[id] = resolve;
      this.contentWindow = this.contentWindow ?? this.frames[0]?.contentWindow;
      if (this.contentWindow === null || this.contentWindow === undefined || this.contentWindow.closed === true || this.contentWindow.location.href === 'about:blank' || this.contentWindow.location.href === null) {
        this.executionQueue.push(obj);
        (async () => {
          await new Promise((res) => setTimeout(res, this.timeout));
          if (this.executionQueue.includes(obj)) {
            this.executionQueue.splice(this.executionQueue.indexOf(obj), 1);
            reject('Frame load timed out');
          };
        })();
        return;
      }
      this.contentWindow.postMessage(obj, '*');
    });
  }

  /**
   * Alias to {@link Sandbox.run}
   */
  public async evaluate(funcBody: string): Promise<{ success: true; result: any } | { success: false; error: any }> {
    return this.run(funcBody);
  }

  /**
   * Initializes the sandbox
   */
  public async init(): Promise<void> {
    const frame = document.createElement('iframe');
    frame.allow = 'encrypted-media';
    frame.src = `${this.host ?? 'https://sandboxjs.foo'}/?proxy&sbx=${this.sandboxId}`;
    this.frames.push(frame);
    this.contentWindow = frame.contentWindow;

    const listener = async (e: MessageEvent) => {
      if (e.data && e.data.sbjs_ready) {
        this.contentWindow = frame.contentWindow;
        window.addEventListener('message', listener);
      } else if (e.data && e.data.sbxRs) {
        // sandbox response
        const data = e.data;
        if (this.host === 'http://localhost:5173') {
          if (data.success) {
            console.log('[sbjs] success', data.result);
          } else {
            console.error('[sbjs] error', data.error);
          }
        }
        if (typeof data.id !== 'string') {
          return console.error('[sbjs] data.id is not a string');
        }
        if (typeof this.listenersById[data.id] !== 'function') {
          return console.error('[sbjs] listener is not a function');
        }
        this.listenersById[data.id](data);
      }
    };

    frame.style.display = 'block';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = 'none';
    frame.style.position = 'fixed';
    frame.style.top = '-10000vh';
    frame.style.left = '-10000vw';

    window.addEventListener('message', listener);

    // resolve on frame load, reject on frame error or timeout
    const promise = new Promise<void>((resolve, reject) => {
      frame.addEventListener('load', () => {
        resolve();
      });
      frame.addEventListener('error', (e) => {
        reject(e);
      });
      setTimeout(() => {
        reject('Frame load timed out');
      }, this.timeout);
    });

    (document.body ?? document.head).appendChild(frame);

    await promise;
    this.executeQueue();
  };

  /**
   * Removes the sandbox
   */
  public kill() {
    this.frames.forEach((frame) => {
      frame.remove();
    });
  };
}

export default Sandbox;

// @ts-ignore
if (typeof window !== 'undefined') window.SandboxJS = Sandbox;
