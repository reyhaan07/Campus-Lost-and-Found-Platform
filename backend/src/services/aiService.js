import { RawImage } from '@xenova/transformers';
import sharp from 'sharp';
import { loadClipModel } from '../config/aiConfig.js';
import stringSimilarity from 'string-similarity';

const normalizeEmbedding = (embedding) => {
  const magnitude = Math.sqrt(embedding.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return embedding;
  return embedding.map((value) => value / magnitude);
};

export const cosineSimilarity = (a, b) => {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  const left = normalizeEmbedding(a);
  const right = normalizeEmbedding(b);
  let dot = 0;
  for (let i = 0; i < left.length; i += 1) {
    dot += left[i] * right[i];
  }
  return Math.max(0, Math.min(1, dot));
};

export const getTextSimilarity = (a, b) => {
  return stringSimilarity.compareTwoStrings(a || '', b || '');
};

export const extractEmbedding = async (input, type = 'text') => {
  const { tokenizer, processor, model } = await loadClipModel();
  const text = type === 'text' ? String(input) : 'a photo of an item';
  const textInputs = tokenizer([text], { padding: true, truncation: true });

  if (type === 'image') {
    const imageBuffer = input instanceof Blob
      ? Buffer.from(await input.arrayBuffer())
      : input;
    const { data, info } = await sharp(imageBuffer)
      .rotate()
      .removeAlpha()
      .toColorspace('srgb')
      .raw()
      .toBuffer({ resolveWithObject: true });
    const image = new RawImage(data, info.width, info.height, info.channels);
    const imageInputs = await processor(image);
    const { image_embeds: imageEmbeds } = await model({ ...textInputs, ...imageInputs });
    return Array.from(imageEmbeds.data);
  }

  const blankImage = new RawImage(new Uint8ClampedArray(224 * 224 * 3), 224, 224, 3);
  const imageInputs = await processor(blankImage);
  const { text_embeds: textEmbeds } = await model({ ...textInputs, ...imageInputs });
  return Array.from(textEmbeds.data);
};

export const buildTextInput = (title, description) => {
  return `${title} ${description}`.slice(0, 77);
};

const WEIGHTS_WITH_IMAGE = { image: 0.35, title: 0.2, description: 0.15, location: 0.15, date: 0.15 };
const WEIGHTS_WITHOUT_IMAGE = { title: 0.35, description: 0.25, location: 0.2, date: 0.2 };

export const getDateProximity = (dateA, dateB) => {
  const diffDays = Math.abs(new Date(dateA).getTime() - new Date(dateB).getTime()) / 86400000;
  return Math.exp(-diffDays / 14);
};

export const scoreMatch = ({ imageScore, titleScore, descriptionScore, locationScore, dateProximity }) => {
  const weights = imageScore === null ? WEIGHTS_WITHOUT_IMAGE : WEIGHTS_WITH_IMAGE;
  const score = weights.title * titleScore
    + weights.description * descriptionScore
    + weights.location * locationScore
    + weights.date * dateProximity
    + (imageScore === null ? 0 : weights.image * imageScore);
  return Math.max(0, Math.min(1, score));
};
