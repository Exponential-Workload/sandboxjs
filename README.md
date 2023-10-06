# SandboxJS
A JS Sandboxing Utility utilizing iframes (and your browser's iframe sandbox) and postMessage.

## A quick note

Any data inside of the sandbox iframe is not trustable as any site can write to it. Do not store data there, it is not a trusted environment.

Also, don't run this on any domains, or subdomains of any domain that you have sensitive information on - the best plan of action is to just use the dedicated domain [sandboxjs.foo](https://sandboxjs.foo) outside of testing.

## Usage

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

documentation is incomplete ok
