import { normalizeHttpUrl } from './linkValidation';

export const MAX_IMPORT_LINK_COUNT = 1000;
export const MAX_IMPORT_CATEGORY_COUNT = 10;

const MAX_TITLE_LENGTH = 50;
const MAX_URL_LENGTH = 200;
const MAX_SHORT_MEMO_LENGTH = 50;
const MAX_DETAIL_MEMO_LENGTH = 1000;
const MAX_CATEGORY_NAME_LENGTH = 30;
const MAX_BROWSER_LENGTH = 50;
const MAX_TAGS_TOTAL_LENGTH = 100;

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const trimString = (value, maxLength) => {
  if (typeof value !== 'string') {
    return { value: '', truncated: false };
  }

  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return { value: trimmed, truncated: false };
  }

  return { value: trimmed.slice(0, maxLength), truncated: true };
};

const normalizeNumber = (value, fallbackValue) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallbackValue;
};

const normalizeBoolean = (value) => value === true;

const normalizeTags = (value) => {
  const rawTags = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  const tags = [];
  let currentLength = 0;
  let truncated = false;

  for (const rawTag of rawTags) {
    if (typeof rawTag !== 'string') {
      continue;
    }

    const trimmedTag = rawTag.trim();
    if (!trimmedTag || tags.includes(trimmedTag)) {
      continue;
    }

    const nextLength = currentLength === 0
      ? trimmedTag.length
      : currentLength + 2 + trimmedTag.length;

    if (nextLength > MAX_TAGS_TOTAL_LENGTH) {
      truncated = true;
      break;
    }

    tags.push(trimmedTag);
    currentLength = nextLength;
  }

  return { tags, truncated };
};

const createDefaultLocalCategories = () => (
  Array.from({ length: MAX_IMPORT_CATEGORY_COUNT }, (_, index) => ({
    id: `local_cat${index + 1}`,
    name: '',
    order: index + 1,
    groupId: 'local',
    isCloud: false,
  }))
);

const buildExistingCategoryContext = (currentLocalCategories) => {
  const existingLocalCategories = Array.isArray(currentLocalCategories)
    ? currentLocalCategories.slice(0, MAX_IMPORT_CATEGORY_COUNT)
    : [];

  const effectiveCategories = existingLocalCategories.length > 0
    ? existingLocalCategories
    : createDefaultLocalCategories();

  const categoryIdMap = new Map();
  for (const category of effectiveCategories) {
    if (category?.id !== undefined && category?.id !== null) {
      categoryIdMap.set(String(category.id), category.id);
    }
  }

  return {
    categories: existingLocalCategories.length > 0 ? null : effectiveCategories,
    effectiveCategories,
    categoryIdMap,
    usedDefaultCategories: existingLocalCategories.length === 0,
  };
};

export const normalizeImportedData = ({ importedLinks, importedCategories, currentLocalCategories }) => {
  if (!Array.isArray(importedLinks)) {
    throw new Error('INVALID_IMPORT_FORMAT');
  }

  const warnings = {
    invalidLinks: 0,
    extraLinks: 0,
    invalidCategories: 0,
    extraCategories: 0,
    truncatedStrings: false,
    usedDefaultCategories: false,
  };

  let categoryContext = buildExistingCategoryContext(currentLocalCategories);

  if (importedCategories !== null && importedCategories !== undefined) {
    if (!Array.isArray(importedCategories)) {
      throw new Error('INVALID_IMPORT_FORMAT');
    }

    const validCategoryObjects = importedCategories.filter(isPlainObject);
    warnings.invalidCategories += importedCategories.length - validCategoryObjects.length;

    const limitedCategoryObjects = validCategoryObjects.slice(0, MAX_IMPORT_CATEGORY_COUNT);
    warnings.extraCategories += validCategoryObjects.length - limitedCategoryObjects.length;

    const categoryIdMap = new Map();
    const normalizedCategories = limitedCategoryObjects.map((category, index) => {
      const nameResult = trimString(category.name ?? '', MAX_CATEGORY_NAME_LENGTH);
      warnings.truncatedStrings ||= nameResult.truncated;

      const localId = `local_cat${index + 1}`;
      const rawIds = [category.id, category.categoryId, category.category_id]
        .filter((value) => value !== undefined && value !== null);

      rawIds.forEach((value) => categoryIdMap.set(String(value), localId));

      return {
        id: localId,
        name: nameResult.value,
        order: index + 1,
        groupId: 'local',
        isCloud: false,
      };
    });

    if (normalizedCategories.length > 0) {
      categoryContext = {
        categories: normalizedCategories,
        effectiveCategories: normalizedCategories,
        categoryIdMap,
        usedDefaultCategories: false,
      };
    } else {
      categoryContext = {
        categories: createDefaultLocalCategories(),
        effectiveCategories: createDefaultLocalCategories(),
        categoryIdMap: new Map(),
        usedDefaultCategories: true,
      };
      warnings.usedDefaultCategories = true;
    }
  } else if (categoryContext.usedDefaultCategories) {
    warnings.usedDefaultCategories = true;
  }

  const fallbackCategoryId = categoryContext.effectiveCategories[0]?.id ?? 'local_cat1';
  const validLinkObjects = importedLinks.filter(isPlainObject);
  warnings.invalidLinks += importedLinks.length - validLinkObjects.length;

  const limitedLinkObjects = validLinkObjects.slice(0, MAX_IMPORT_LINK_COUNT);
  warnings.extraLinks += validLinkObjects.length - limitedLinkObjects.length;

  const idPrefix = Date.now();
  const normalizedLinks = [];

  limitedLinkObjects.forEach((link, index) => {
    const titleResult = trimString(link.title, MAX_TITLE_LENGTH);
    const rawUrlResult = trimString(link.url, MAX_URL_LENGTH);
    const shortMemoResult = trimString(link.shortMemo ?? link.short_memo ?? '', MAX_SHORT_MEMO_LENGTH);
    const detailMemoResult = trimString(link.detailMemo ?? link.detail_memo ?? '', MAX_DETAIL_MEMO_LENGTH);
    const browserResult = trimString(link.browser ?? '', MAX_BROWSER_LENGTH);
    const tagsResult = normalizeTags(link.tags);

    warnings.truncatedStrings ||= (
      titleResult.truncated
      || rawUrlResult.truncated
      || shortMemoResult.truncated
      || detailMemoResult.truncated
      || browserResult.truncated
      || tagsResult.truncated
    );

    const normalizedUrl = normalizeHttpUrl(rawUrlResult.value);
    if (!titleResult.value || !normalizedUrl) {
      warnings.invalidLinks += 1;
      return;
    }

    const rawCategoryId = link.categoryId ?? link.category_id;
    const normalizedCategoryId = rawCategoryId !== undefined && rawCategoryId !== null
      ? categoryContext.categoryIdMap.get(String(rawCategoryId))
      : null;

    normalizedLinks.push({
      id: `local_link_${idPrefix}_${index + 1}`,
      title: titleResult.value,
      url: normalizedUrl,
      shortMemo: shortMemoResult.value,
      detailMemo: detailMemoResult.value,
      browser: browserResult.value,
      tags: tagsResult.tags,
      isFavorite: normalizeBoolean(link.isFavorite ?? link.is_favorite),
      isHighlighted: normalizeBoolean(link.isHighlighted ?? link.is_highlighted),
      order: normalizeNumber(link.order, (index + 1) * 10),
      categoryId: normalizedCategoryId || fallbackCategoryId,
      groupId: 'local',
      isCloud: false,
      createdAt: new Date().toISOString(),
    });
  });

  if (importedLinks.length > 0 && normalizedLinks.length === 0) {
    throw new Error('NO_VALID_IMPORT_LINKS');
  }

  return {
    links: normalizedLinks,
    categories: categoryContext.categories,
    warnings,
  };
};
