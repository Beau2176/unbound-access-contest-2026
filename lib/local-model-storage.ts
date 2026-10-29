import { withModelLease } from "./local-model-lease.ts";

const LEGACY_CACHE = "unbound-meta-model-v1";
const MODEL_DIRECTORY = "unbound-meta-model-v2";
export type ModelStorage = { isSupported(): boolean; read(key: string): Promise<Blob | null>; write(key: string, stream: ReadableStream): Promise<void>; getSize(key: string): Promise<number>; list(): Promise<{key: string; size: number}[]>; delete(key: string): Promise<void> };
type ModelDirectory = Pick<FileSystemDirectoryHandle, "getFileHandle" | "removeEntry"> & { entries(): AsyncIterable<[string, FileSystemHandle]> };
const cacheRequest = (origin: string, key: string) => new Request(`${origin}/__local_model_cache/${encodeURIComponent(key)}`);
const notFound = (error: unknown) => error instanceof Error && error.name === "NotFoundError";

export function opfsModelStorage(directory: ModelDirectory): ModelStorage {
  async function read(key: string): Promise<Blob | null> {
    try { const file = await (await directory.getFileHandle(key)).getFile(); return file.size ? file : null; }
    catch (error) { if (notFound(error)) return null; throw error; }
  }
  return { isSupported: () => true, read,
    write: async (key, stream) => {
      const file = await directory.getFileHandle(key, {create:true});
      await stream.pipeTo(await file.createWritable());
    },
    getSize: async key => (await read(key))?.size ?? -1,
    list: async () => {
      const files: {key:string;size:number}[] = [];
      for await (const [key, handle] of directory.entries()) if (handle.kind === "file") {
        const file = await (await directory.getFileHandle(key)).getFile(); files.push({key,size:file.size});
      }
      return files;
    },
    delete: async key => { try { await directory.removeEntry(key); } catch(error) { if (!notFound(error)) throw error; } },
  };
}

export async function selectModelStorage(origin: string): Promise<{backend: ModelStorage; label: string; temporary: boolean}> {
  if (typeof navigator !== "undefined" && navigator.storage?.getDirectory) {
    try {
      const root = await navigator.storage.getDirectory();
      const directory = await root.getDirectoryHandle(MODEL_DIRECTORY, {create:true});
      return {backend:opfsModelStorage(directory as unknown as ModelDirectory),label:"Origin-private files",temporary:false};
    } catch { /* Storage can be unavailable in private/limited contexts. */ }
  }
  const legacy = typeof caches !== "undefined" ? await caches.open(LEGACY_CACHE) : undefined;
  if (legacy) return {label:"Browser cache",temporary:false,backend:{
    isSupported:()=>true,
    read:async key=>(await legacy.match(cacheRequest(origin,key)))?.blob()??null,
    write:async(key,stream)=>{await legacy.put(cacheRequest(origin,key),new Response(stream));},
    getSize:async key=>(await(await legacy.match(cacheRequest(origin,key)))?.blob())?.size??-1,
    list:async()=>Promise.all((await legacy.keys()).map(async request=>({key:decodeURIComponent(new URL(request.url).pathname.split("/").pop()!),size:(await(await legacy.match(request))!.blob()).size}))),
    delete:async key=>{await legacy.delete(cacheRequest(origin,key));},
  }};
  const files = new Map<string,Blob>();
  return {label:"Temporary memory",temporary:true,backend:{
    isSupported:()=>true,read:async key=>files.get(key)??null,
    write:async(key,stream)=>{files.set(key,await new Response(stream).blob());},
    getSize:async key=>files.get(key)?.size??-1,list:async()=>[...files].map(([key,blob])=>({key,size:blob.size})),delete:async key=>{files.delete(key);},
  }};
}

export async function removeModelDownloads() {
  return withModelLease(typeof navigator === "undefined" ? undefined : navigator.locks, async () => {
  if (typeof navigator !== "undefined" && navigator.storage?.getDirectory) {
    try { await (await navigator.storage.getDirectory()).removeEntry(MODEL_DIRECTORY,{recursive:true}); }
    catch(error) { if (!notFound(error)) throw error; }
  }
  if (typeof caches !== "undefined") await caches.delete(LEGACY_CACHE);
  });
}
