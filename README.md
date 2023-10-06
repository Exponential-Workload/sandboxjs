# SandboxJS
A JS Sandboxing Utility utilizing iframes (and your browser's iframe sandbox) and postMessage.

## A quick note

Any data inside of the sandbox iframe is not trustable as any site can write to it. Do not store data there, it is not a trusted environment.

Also, don't run this on any domains, or subdomains of any domain that you have sensitive information on - the best plan of action is to just use the dedicated domain [sandboxjs.foo](https://sandboxjs.foo) outside of testing.

## Usage

documentation is incomplete ok

### Creating a sandbox

```html
<script type="module">
  import SbJS from 'https://sandboxjs.foo/lib/lib.mjs'; // lib is also exposed as window.SandboxJS - use https://sandboxjs.foo/lib/lib.cjs alongside the window object if you're on commonjs.
  (async()=>{
    const sbx = await (new SandboxJS()
                            .init()); // resolves when the iframe is loaded and ready to go - this should be called before any other methods. You are not required to chain this, but you can.
    const returnValue = await sbx.run('alert(window.location.href);\nreturn `Hi from ${window.location.href}`;') // alerts 'https://sandboxjs.foo/' and returns 'Hi from https://sandboxjs.foo/'
  })();
</script>
```

### Setting the sandbox= attribute on the iframe

```ts
const sbx = new SandboxJS();
sbx.sandbox.add('allow-modals'); // adds the allow-modals sandbox attribute to the iframe
sbx.sandbox.remove('allow-modals'); // removes the allow-modals sandbox attribute from the iframe
```

### Resetting a Sandbox

> Sandboxes can have their state messed up - ie via reload()s, or via navigation.<br/>
> In addition, if you modify params, or the ADD to sandbox options, they can't retroactively be applied to the sandbox.<br/>
> In scenarios like these, you need to reset the sandbox.

To reset a sandbox, you need to kill() it, and re-init() it.

An example of doing this for navigation is this:
```ts
// Create a sandbox
const sbx = await (new SandboxJS()
                            .init());

// Mess up the sandbox
sbx.run(`window.location.href = 'https://example.com/'`);

// Reset the sandbox
sbx.kill();
await sbx.init();

// The sandbox is now reset
await sbx.run(`return window.location.href;`); // returns 'https://sandboxjs.foo/', not 'https://example.com/'
```

Another example of changing sandbox options post-load is this:
```ts
// Create a sandbox
const sbx = new SandboxJS();
sbx.sandbox.remove('allow-modals'); // you can call .remove() on any of the sandbox options, and it'll remove them from the sandbox
await sbx.init();

// Run something that's disallowed in the current policy
await sbx.run(`alert('Hai!')`); // doesn't alert

// Re-allow it
sbx.sandbox.add('allow-modals');

// Run something that's now allowed in the current policy
await sbx.run(`alert('Hai 2!')`); // still doesn't alert

// Reset the sandbox
sbx.kill();
await sbx.init();

// The sandbox is now reset
await sbx.run(`alert('Hai 3!')`); // alerts 'Hai 3!' successfully
```

> It's worth noting that, as the nested iframe's sandbox parameters are queried via a URL query parameter, if you remove a sandbox attribute post-init(), you can re-add it via sbx.sandbox.add() and it'll work again. This is, however, discouraged.
