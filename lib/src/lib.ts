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

  public readonly parameters = {
    get: (key: string) => {
      return this.params[key] ?? null;
    },
    getAll: () => {
      return this.params;
    },
    set: (key: string, value: string | boolean): void => {
      this.params[key] = value;
    },
  };

  constructor() {
    this.parameters.set('sbx', this.sandboxId);
    this.parameters.set('proxy', true);
  }

  public _overwriteHost(newHost: string): void {
    this.host = newHost;
    this.frames.forEach((frame) => {
      frame.src = `${this.host ?? 'https://sandboxjs.foo'}/?${Object.entries(this.params).map(([key, value]) => `${key}=${value}`).join('&')}`;
    });
  }

  public run(funcBody: string): Promise<{ success: true; result: any } | { success: false; error: any }> {
    return new Promise<{ success: true; result: any } | { success: false; error: any }>((resolve, reject) => {
      const id = 'sbjs_eval_' + Math.random().toString(36).substring(7);
      this.listenersById[id] = resolve;
      this.contentWindow = this.contentWindow ?? this.frames[0].contentWindow;
      if (this.contentWindow === null) {
        return reject('contentWindow is null');
      }
      this.contentWindow?.postMessage({
        sbx: true,
        code: funcBody,
        id,
        sandboxId: this.sandboxId,
      }, '*');
    });
  }

  public async evaluate(funcBody: string): Promise<{ success: true; result: any } | { success: false; error: any }> {
    return this.run(funcBody);
  }

  public async init(): Promise<void> {
    const frame = document.createElement('iframe');
    frame.allow = 'encrypted-media';
    frame.src = `${this.host ?? 'https://sandboxjs.foo'}/?proxy&sbx=${this.sandboxId}`;
    this.frames.push(frame);
    this.contentWindow = frame.contentWindow;

    const listenersById: Record<string, (data: any) => void> = {};

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
        if (typeof listenersById[data.id] !== 'function') {
          return console.error('[sbjs] listener is not a function');
        }
        listenersById[data.id](data);
      }
    };

    frame.style.display = 'block';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = 'none';
    frame.style.position = 'fixed';
    frame.style.top = '-10000vh';
    frame.style.left = '-10000vw';

    (document.body ?? document.head).appendChild(frame);
  };

  public async kill(): Promise<void> {
    this.frames.forEach((frame) => {
      frame.remove();
    });
  };
}

export default Sandbox;

// @ts-ignore
if (typeof window !== 'undefined') window.SandboxJS = Sandbox;
