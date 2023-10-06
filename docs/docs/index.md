# Sandbox.JS

JS Sandboxing via iframe sandboxing.

## Installation

```bash
pnpm install sboxjs
```

## Usage

=== "Bundler"

    ```html
    <script type="module">
      import { init } from 'sboxjs';
      (async()=>{
        const sbox = await init();
        const value = await sbox.evaluate('return 1'); // {success:true,result:1};
        if (value.error) throw value.error;
        alert(value.result);
      })();
    </script>
    ```

=== "CDN"

    ```html
    <script type="module">
      import { init } from 'https://unpkg.com/sboxjs?module';
      (async()=>{
        const sbox = await SandboxJS.init();
        const value = await sbox.evaluate('return 1'); // {success:true,result:1};
        if (value.error) throw value.error;
        alert(value.result);
      })();
    </script>
    ```