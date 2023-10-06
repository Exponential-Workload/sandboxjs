import './style.css'

// get ?sbx parameter - if not present, redirect to /docs/
const usp = new URLSearchParams(window.location.search)
// if ?proxy is present, create iframe to /?sbx, and proxy all messages from/to it
if (usp.get('proxy') !== null) {
  document.querySelector('#app')?.remove();

  const frame = document.createElement('iframe');
  frame.src = `/?sbx&${usp.get('debug') !== null ? 'debug&' : ''}${usp.get('ready') !== null ? 'ready&' : ''}hi`;
  const sandboxes = [
    'allow-scripts',
    'allow-same-origin',
    'allow-popups',
    'allow-forms',
    'allow-downloads',
    'allow-modals',
    ...usp.get('allowSandboxItems')?.split(',').map(v => v.toLowerCase().trim()) ?? [],
  ];
  const disallowSandboxItems = usp.get('disallowSandboxItems')?.split(',').map(v => v.toLowerCase().trim()) ?? [];
  sandboxes.filter(s => !disallowSandboxItems.includes(s.replace('allow-', ''))).forEach(s => frame.sandbox.add(s));
  frame.allow = 'autoplay fullscreen';
  frame.style.display = 'block';
  frame.style.width = '100vw';
  frame.style.height = '100vh';
  frame.style.border = 'none';
  frame.style.position = 'fixed';
  frame.style.top = '0';
  frame.style.left = '0';
  document.body.appendChild(frame);

  // add event listener for proxying to iframe
  const listener = (event: MessageEvent) => {
    if (event.data && event.data.sbx) {
      if (usp.get('debug') !== null)
        console.log('[sbjs] event send to inner', event);
      // send to iframe
      frame.contentWindow?.postMessage(event.data, '*');
    }
  }
  window.addEventListener('message', listener);
  // add event listener for proxying from iframe
  const listener2 = (event: MessageEvent) => {
    if (event.data && event.data.sbxRs) {
      if (usp.get('debug') !== null)
        console.log('[sbjs] event send to parent', event);

      // send to parent
      window.parent.postMessage(event.data, '*');
    }
  }
  window.addEventListener('message', listener2);
} else {
  // handle main
  const sbx = usp.get('sbx')
  if (sbx === undefined && !window.location.pathname.startsWith('/docs'))
    window.location.replace('/docs/');
  else {
    // listen to iframe events
    const listener = async (event: MessageEvent) => {
      let data = event.data
      try {
        data = JSON.parse(data)
      } catch (error) { }
      if (!data.sbx) return;
      // event error thrower - send { success: false, error: string, id?: string } to iframe
      const e = (error: string) => {
        console.warn('Error in iframe code:', error);
        event.source?.postMessage({ sbxRs: true, success: false, error, id: data?.id ?? 'no id' }, {
          targetOrigin: event.origin,
        })
      };
      // ensure format is { code: string, id: string }
      if (typeof data !== 'object') return e('Event.data is not object');
      if (typeof data.code !== 'string') return e('Event.data.code is not string');
      if (typeof data.id !== 'string') return e('Event.data.id is not string');
      if (usp.get('debug') !== null)
        console.log('[sbjs] event', event)
      // get code
      const code = data.code;
      // get id
      const id = data.id;
      // check if is eval
      const evalResolve = (event?.data?.resolve ?? null) as ((data: any) => void) | null;
      // create func
      // const func = new Function(code); // not async
      const func = new Function(`return (async () => { ${code} })();`) // async
      try {
        // run func
        const result = await func();
        // send result to iframe
        const rVal = { sbxRs: true, success: true, result: JSON.parse(JSON.stringify(result) ?? null), id }
        if (evalResolve)
          return evalResolve(rVal);
        else
          window.parent.postMessage(rVal, '*');
      } catch (error) {
        const rVal = { sbxRs: true, success: false, error: JSON.parse(JSON.stringify(error)), id };
        if (evalResolve)
          return evalResolve(rVal);
        // send error to iframe
        window.parent.postMessage(rVal, '*');
      }
    }
    // listen
    window.addEventListener('message', listener, false);
    // if query param ?ready is present, emit a message event of our own to trigger the listener
    const evaluate = async (funcBody: string) => {
      let resolve: ((value: { success: true, result: any, id: string } | { success: false, error: any, id: string }) => void) | undefined = undefined;
      const promise = new Promise<{ success: true, result: any, id: string } | { success: false, error: any, id: string }>((res) => resolve = res);
      while (typeof resolve === 'undefined')
        await new Promise((res) => setTimeout(res, 1));
      const event = new MessageEvent('message', {
        data: {
          code: funcBody,
          id: 'sbjs_eval_' + Math.random().toString(36).substring(7),
          resolve,
          sbx: true,
        },
        origin: '*',
      });
      window.dispatchEvent(event);
      return await promise;
    }
    if (usp.get('ready') !== null)
      evaluate('console.log(\'[sbjs] ready\')');
    // oh and, expose evaluate() to the window
    (window as any).evaluate = evaluate;
    // send ready to iframe
    window.parent.postMessage({ sbxRs: true, sbjs_ready: true }, '*');
  }
}