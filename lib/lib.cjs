function $parcel$defineInteropFlag(a) {
  Object.defineProperty(a, '__esModule', {value: true, configurable: true});
}
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$defineInteropFlag(module.exports);

$parcel$export(module.exports, "Sandbox", () => $6324ce8b5bc4dc81$export$aaaea0ead6b8e811);
$parcel$export(module.exports, "default", () => $6324ce8b5bc4dc81$export$2e2bcd8739ae039);
class $6324ce8b5bc4dc81$export$aaaea0ead6b8e811 {
    get sandboxId() {
        return this.__sandboxId;
    }
    executeQueue() {
        if (!this.contentWindow) return false;
        while(this.executionQueue.length > 0){
            const data = this.executionQueue.shift();
            if (this.host === "http://localhost:5173") console.log("[sbjs] executing", data);
            this.contentWindow?.postMessage(data, "*");
        }
        return true;
    }
    /**
   * Creates a new Sandbox instance
   * @param host The host to use for the sandbox
   */ constructor(){
        this.host = null;
        this.frames = [];
        this.contentWindow = null;
        this.listenersById = {};
        this.__sandboxId = Math.random().toString(36).substring(7);
        this.params = {};
        this.executionQueue = [];
        this._sandboxParams = [];
        this.sandbox = {
            getAll: ()=>{
                return [
                    ...this._sandboxParams
                ];
            },
            get: (key)=>{
                return this._sandboxParams.includes(key);
            },
            /** Needs to be called prior to init() - to modify parameters, call kill(), call this, then init() again. */ add: (key)=>{
                this._sandboxParams.push(key);
                this.frames.forEach((frame)=>frame.sandbox.add(key));
                this.parameters.set("sandbox", this._sandboxParams.join("+"));
            },
            /** You should reset the sandbox after this, however as the root sandbox is directly affected, the nested one should be fine without needing you to reset. */ remove: (...keys)=>{
                keys.forEach((key)=>{
                    this._sandboxParams.splice(this._sandboxParams.indexOf(key), 1);
                    this.frames.forEach((frame)=>frame.sandbox.remove(key));
                });
                this.parameters.set("sandbox", this._sandboxParams.join("+"));
            }
        };
        /** Frame load timeout */ this.timeout = 8192;
        /** Sandbox parameters */ this.parameters = {
            get: (key)=>{
                return this.params[key] ?? null;
            },
            getAll: ()=>{
                return {
                    ...this.params
                };
            },
            /** Needs to be called prior to init() - to modify parameters, call kill(), call this, then init() again */ set: (key, value)=>{
                this.params[key] = value;
            }
        };
        this.parameters.set("sbxid", this.sandboxId);
        this.parameters.set("proxy", true);
        [
            "allow-scripts",
            "allow-same-origin",
            "allow-popups",
            "allow-forms",
            "allow-downloads",
            "allow-modals"
        ].forEach((k)=>this.sandbox.add(k));
    }
    /**
   * Overwrites the host of the sandbox
   * @param newHost The new host to use
   * @internal
   */ _overwriteHost(newHost) {
        this.host = newHost;
        this.frames.forEach((frame)=>{
            frame.src = `${this.host ?? "https://sandboxjs.foo"}/?${Object.entries(this.params).map(([key, value])=>`${key}=${value}`).join("&")}`;
        });
    }
    /**
   * Runs a function in the sandbox
   * @param funcBody The function to run
   */ run(funcBody) {
        return new Promise((resolve, reject)=>{
            const id = "sbjs_eval_" + Math.random().toString(36).substring(7);
            const obj = {
                sbx: true,
                code: funcBody,
                id: id,
                sandboxId: this.sandboxId
            };
            this.listenersById[id] = (a)=>{
                if (this.host === "http://localhost:5173") this.listenersById[id] = (data)=>{
                    console.warn("[sbjs] duplicate listener call", {
                        id: id,
                        data: data,
                        err: new Error("Duplicate listener call")
                    });
                    resolve(data);
                };
                resolve(a);
            };
            this.contentWindow = this.contentWindow ?? this.frames[0]?.contentWindow;
            this.executionQueue.push(obj);
            if (this.contentWindow === null || this.contentWindow === undefined || this.contentWindow.closed === true) (async ()=>{
                await new Promise((res)=>setTimeout(res, this.timeout));
                if (this.executionQueue.includes(obj)) {
                    this.executionQueue.splice(this.executionQueue.indexOf(obj), 1);
                    reject("Frame load timed out");
                }
            })();
            else this.executeQueue();
        });
    }
    /**
   * Alias to {@link Sandbox.run}
   */ async evaluate(funcBody) {
        return this.run(funcBody);
    }
    /**
   * Initializes the sandbox
   */ async init() {
        const frame = document.createElement("iframe");
        this.sandbox.getAll().forEach((k)=>frame.sandbox.add(k));
        frame.src = `${this.host ?? "https://sandboxjs.foo"}/?proxy&${Object.entries(this.params).map(([key, value])=>`${key}=${value}`).join("&")}`;
        this.frames.push(frame);
        this.contentWindow = frame.contentWindow;
        const listener = async (e)=>{
            if (e.data && e.data.sbjs_ready) {
                this.contentWindow = frame.contentWindow;
                window.addEventListener("message", listener);
            } else if (e.data && e.data.sbxRs) {
                // sandbox response
                const data = e.data;
                if (this.host === "http://localhost:5173") {
                    if (data.success) console.log("[sbjs] success", data.result);
                    else console.error("[sbjs] error", data.error);
                }
                if (typeof data.id !== "string") return console.error("[sbjs] data.id is not a string");
                if (typeof this.listenersById[data.id] !== "function") {
                    console.warn(new Error(`[sbjs] listener is not a function (id: ${data.id})`));
                    return;
                }
                this.listenersById[data.id](data);
            }
        };
        frame.style.display = "block";
        frame.style.width = "0";
        frame.style.height = "0";
        frame.style.border = "none";
        frame.style.position = "fixed";
        frame.style.top = "-10000vh";
        frame.style.left = "-10000vw";
        window.addEventListener("message", listener);
        // resolve on frame load, reject on frame error or timeout
        const promise = new Promise((resolve, reject)=>{
            frame.addEventListener("load", ()=>{
                resolve();
            });
            frame.addEventListener("error", (e)=>{
                reject(e);
            });
            setTimeout(()=>{
                reject("Frame load timed out");
            }, this.timeout);
        });
        (document.body ?? document.head).appendChild(frame);
        await promise;
        this.executeQueue();
        return this;
    }
    /**
   * Removes the sandbox
   */ kill() {
        this.frames.forEach((frame)=>{
            frame.remove();
        });
        this.frames = [];
        this.contentWindow = null;
        this.executionQueue = [];
        this.listenersById = {};
    }
}
var $6324ce8b5bc4dc81$export$2e2bcd8739ae039 = $6324ce8b5bc4dc81$export$aaaea0ead6b8e811;
// @ts-ignore
if (typeof window !== "undefined") window.SandboxJS = $6324ce8b5bc4dc81$export$aaaea0ead6b8e811;


//# sourceMappingURL=lib.cjs.map
