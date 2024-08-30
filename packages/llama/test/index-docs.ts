import path from "path";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OllamaEmbeddings } from "@langchain/ollama";

const modelPath = path.join(".", "docs", "models", "bge-base-en-v1.5-q4_k_m.gguf");

class OllamaEmbeddingsEx extends OllamaEmbeddings {

    constructor(fields?) {
        super(fields);
    }

    embedDocuments(documents: string[]): Promise<number[][]> {
        return super.embedDocuments(documents).then(embeddings => {
            return embeddings;
        });
    }

    embedQuery(document: string): Promise<number[]> {
        return super.embedQuery(document).then(embedding => {
            return embedding;
        });
    }
}

async function save(folder: string) {
    console.log(`Starting ${folder}...`);
    const loader = new DirectoryLoader(`docs/in/${folder}`, {
        ".xml": path => new TextLoader(path)
    });
    // const loader = new TextLoader("docs/in/PRG_Mods/PrG_Job_Failure.xml");
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter();
    const splitDocuments = await splitter.splitDocuments(docs);
    const vectorstore = await FaissStore.fromDocuments(
        splitDocuments,
        new OllamaEmbeddingsEx({
            model: "bge-base-en-v1.5-q4_k_m",
            truncate: true
        })
    );
    console.log(`Saving ${folder}...`);
    vectorstore.save(`docs/out/${folder}`);
    console.log(`Finish ${folder}...`);
    return vectorstore;
}

const allStore = await Promise.all([
    save("ECLLanguageReference"),
    save("ECLLanguageReference2"),
    save("ECLProgrammersGuide"),
    save("ECLStandardLibraryReference")
]).then(async vectorStores => {
    await vectorStores[0].mergeFrom(vectorStores[1]);
    await vectorStores[0].mergeFrom(vectorStores[2]);
    await vectorStores[0].mergeFrom(vectorStores[3]);
    return vectorStores[0];
});
allStore.save("docs/out/all");
