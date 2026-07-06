import {
  AutoProcessor,
  AutoTokenizer,
  CLIPModel,
} from '@xenova/transformers';

let clipModel = null;
let loadingPromise = null;

export const loadClipModel = async () => {
  if (clipModel) return clipModel;
  if (loadingPromise) return loadingPromise;

  console.log('Loading AI model...');
  const modelId = 'Xenova/clip-vit-base-patch32';

  loadingPromise = Promise.all([
    AutoTokenizer.from_pretrained(modelId),
    AutoProcessor.from_pretrained(modelId),
    CLIPModel.from_pretrained(modelId),
  ]).then(([tokenizer, processor, model]) => {
    clipModel = { tokenizer, processor, model };
    return clipModel;
  }).finally(() => {
    loadingPromise = null;
  });

  return loadingPromise;
};

export const getClipModel = () => clipModel;
