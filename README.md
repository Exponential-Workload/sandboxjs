# SandboxJS
A JS Sandboxing Utility utilizing iframes (and your browser's iframe sandbox) and postMessage.

## A quick note

Any data inside of the sandbox iframe is not trustable as any site can write to it. Do not store data there, it is not a trusted environment.

Also, don't run this on any domains, or subdomains of any domain that you have sensitive information on - the best plan of action is to just use the dedicated domain [sandboxjs.foo](https://sandboxjs.foo) outside of testing.

## Usage

### Creating a sandbox

```html
<script src="https://sandboxjs.foo/lib.js"></script>
```

documentation is incomplete ok
