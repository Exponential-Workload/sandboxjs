let host = null as string | null;
let frames: HTMLIFrameElement[] = [];
export const overwriteHost = (newHost: string) => {
  host = newHost;
  frames.forEach((frame) => {
    frame.src = `${host ?? 'https://sandboxjs.foo'}/?proxy`
  })
};
export const init = () => new Promise(resolve => {
  const frame = document.createElement('iframe');
  frame.allow = 'encrypted-media';
  frame.src = `${host ?? 'https://sandboxjs.foo'}/?proxy`
  frames.push(frame);
  let contentWindow = frame.contentWindow;
  const listenersById = {} as Record<string, (data: any) => void>;
  const listener = async (e: MessageEvent) => {
    if (e.data && e.data.sbjs_ready) {
      // sandbox is ready
      resolve({
        evaluate: (funcBody: string) => new Promise<{
          success: true;
          result: any;
        } | {
          success: false;
          error: any;
        }>((resolve, reject) => {
          const id = 'sbjs_eval_' + Math.random().toString(36).substring(7);
          listenersById[id] = resolve;
          contentWindow = contentWindow ?? frame.contentWindow;
          if (contentWindow === null)
            return reject('contentWindow is null');
          contentWindow?.postMessage({
            sbx: true,
            code: funcBody,
            id,
          }, '*');
        }),
        contentWindow,
      });
    } else if (e.data && e.data.sbxRs) {
      // sandbox response
      const data = e.data;
      if (host === 'http://localhost:5173') {
        if (data.success) {
          console.log('[sbjs] success', data.result);
        } else {
          console.error('[sbjs] error', data.error);
        }
      }
      if (typeof data.id !== 'string')
        return console.error('[sbjs] data.id is not string');
      if (typeof listenersById[data.id] !== 'function')
        return console.error('[sbjs] listener is not function');
      listenersById[data.id](data);
    }
  }
  window.addEventListener('message', listener);
  frame.style.display = 'block';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = 'none';
  frame.style.position = 'fixed';
  frame.style.top = '-10000vh';
  frame.style.left = '-10000vw';
  (document.body ?? document.head).appendChild(frame);
})
export default init;

// @ts-ignore
if (typeof window !== 'undefined') window.sandboxjs = { init };
