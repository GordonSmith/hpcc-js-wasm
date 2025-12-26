[**@hpcc-js/wasm-root**](../../../../README.md)

***

# Class: Llama

Defined in: [packages/llama/src/llama.ts:28](https://github.com/GordonSmith/hpcc-js-wasm/blob/0a18c0cdf697299cd970a547d62486b5535d7540/packages/llama/src/llama.ts#L28)

The llama WASM library, provides a simplified wrapper around the llama.cpp library.

See [llama.cpp](https://github.com/ggerganov/llama.cpp) for more details.

```ts
import { Llama, WebBlob } from "@hpcc-js/wasm-llama";

let llama = await Llama.load();
const model = "https://huggingface.co/CompendiumLabs/bge-base-en-v1.5-gguf/resolve/main/bge-base-en-v1.5-q4_k_m.gguf";
const webBlob: Blob = await WebBlob.create(new URL(model));

const data: ArrayBuffer = await webBlob.arrayBuffer();

const embeddings = llama.embedding("Hello and Welcome!", new Uint8Array(data));
```

## Extends

- `MainModuleEx`\<`MainModule`\>

## Methods

### load()

> `static` **load**(): `Promise`\<`Llama`\>

Defined in: [packages/llama/src/llama.ts:55](https://github.com/GordonSmith/hpcc-js-wasm/blob/0a18c0cdf697299cd970a547d62486b5535d7540/packages/llama/src/llama.ts#L55)

Compiles and instantiates the raw wasm.

::: info
In general WebAssembly compilation is disallowed on the main thread if the buffer size is larger than 4KB, hence forcing `load` to be asynchronous;
:::

#### Returns

`Promise`\<`Llama`\>

A promise to an instance of the Llama class.

***

### unload()

> `static` **unload**(): `void`

Defined in: [packages/llama/src/llama.ts:64](https://github.com/GordonSmith/hpcc-js-wasm/blob/0a18c0cdf697299cd970a547d62486b5535d7540/packages/llama/src/llama.ts#L64)

Unloades the compiled wasm instance.

#### Returns

`void`

***

### version()

> **version**(): `string`

Defined in: [packages/llama/src/llama.ts:71](https://github.com/GordonSmith/hpcc-js-wasm/blob/0a18c0cdf697299cd970a547d62486b5535d7540/packages/llama/src/llama.ts#L71)

#### Returns

`string`

The Llama c++ version

***

### embedding()

> **embedding**(`text`, `model`, `format`): `number`[][]

Defined in: [packages/llama/src/llama.ts:83](https://github.com/GordonSmith/hpcc-js-wasm/blob/0a18c0cdf697299cd970a547d62486b5535d7540/packages/llama/src/llama.ts#L83)

Calculates the vector representation of the input text.

#### Parameters

##### text

`string`

The input text.

##### model

`Uint8Array`

The model to use for the embedding.

##### format

`string` = `"array"`

#### Returns

`number`[][]

The embedding of the text using the model.

***

### malloc()

> **malloc**(`size`): `HeapU8`

Defined in: packages/util/types/wasm-library.d.ts:19

#### Parameters

##### size

`number`

#### Returns

`HeapU8`

#### Inherited from

`MainModuleEx.malloc`

***

### free()

> **free**(`data`): `void`

Defined in: packages/util/types/wasm-library.d.ts:20

#### Parameters

##### data

`HeapU8`

#### Returns

`void`

#### Inherited from

`MainModuleEx.free`

***

### dataToHeap()

> **dataToHeap**(`data`): `HeapU8`

Defined in: packages/util/types/wasm-library.d.ts:21

#### Parameters

##### data

`Uint8Array`

#### Returns

`HeapU8`

#### Inherited from

`MainModuleEx.dataToHeap`

***

### heapView()

> **heapView**(`data`): `Uint8Array`

Defined in: packages/util/types/wasm-library.d.ts:22

#### Parameters

##### data

`HeapU8`

#### Returns

`Uint8Array`

#### Inherited from

`MainModuleEx.heapView`

***

### heapToUint8Array()

> **heapToUint8Array**(`data`): `Uint8Array`

Defined in: packages/util/types/wasm-library.d.ts:23

#### Parameters

##### data

`HeapU8`

#### Returns

`Uint8Array`

#### Inherited from

`MainModuleEx.heapToUint8Array`

***

### lengthBytes()

> **lengthBytes**(`str`): `number`

Defined in: packages/util/types/wasm-library.d.ts:24

#### Parameters

##### str

`string`

#### Returns

`number`

#### Inherited from

`MainModuleEx.lengthBytes`

***

### stringToHeap()

> **stringToHeap**(`str`): `HeapU8`

Defined in: packages/util/types/wasm-library.d.ts:25

#### Parameters

##### str

`string`

#### Returns

`HeapU8`

#### Inherited from

`MainModuleEx.stringToHeap`

***

### heapToString()

> **heapToString**(`data`): `string`

Defined in: packages/util/types/wasm-library.d.ts:26

#### Parameters

##### data

`HeapU8`

#### Returns

`string`

#### Inherited from

`MainModuleEx.heapToString`

***

### hasFilesystem()

> **hasFilesystem**(): `boolean`

Defined in: packages/util/types/wasm-library.d.ts:27

#### Returns

`boolean`

#### Inherited from

`MainModuleEx.hasFilesystem`

***

### createPath()

> **createPath**(`path`, `canRead?`, `canWrite?`): `void`

Defined in: packages/util/types/wasm-library.d.ts:28

#### Parameters

##### path

`string`

##### canRead?

`boolean`

##### canWrite?

`boolean`

#### Returns

`void`

#### Inherited from

`MainModuleEx.createPath`

***

### createDataFile()

> **createDataFile**(`path`, `data`, `canRead?`, `canWrite?`, `canOwn?`): `void`

Defined in: packages/util/types/wasm-library.d.ts:29

#### Parameters

##### path

`string`

##### data

`Uint8Array`

##### canRead?

`boolean`

##### canWrite?

`boolean`

##### canOwn?

`boolean`

#### Returns

`void`

#### Inherited from

`MainModuleEx.createDataFile`

***

### preloadFile()

> **preloadFile**(`path`, `data`, `canRead?`, `canWrite?`, `dontCreateFile?`, `canOwn?`, `preFinish?`): `Promise`\<`void`\>

Defined in: packages/util/types/wasm-library.d.ts:30

#### Parameters

##### path

`string`

##### data

`Uint8Array`

##### canRead?

`boolean`

##### canWrite?

`boolean`

##### dontCreateFile?

`boolean`

##### canOwn?

`boolean`

##### preFinish?

`boolean`

#### Returns

`Promise`\<`void`\>

#### Inherited from

`MainModuleEx.preloadFile`

***

### unlink()

> **unlink**(`path`): `any`

Defined in: packages/util/types/wasm-library.d.ts:31

#### Parameters

##### path

`string`

#### Returns

`any`

#### Inherited from

`MainModuleEx.unlink`
