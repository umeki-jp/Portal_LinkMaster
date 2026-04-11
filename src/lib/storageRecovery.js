const RECOVERY_KEY_PREFIX = 'portal_recovery_backup';
const recoveryNotices = [];

const cloneValue = (value) => {
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return JSON.parse(JSON.stringify(value));
  }

  return value;
};

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const isOptionalString = (value) => value === undefined || value === null || typeof value === 'string';
const isOptionalBoolean = (value) => value === undefined || typeof value === 'boolean';
const isOptionalNumber = (value) => value === undefined || typeof value === 'number';
const isOptionalStringArray = (value) => value === undefined || (Array.isArray(value) && value.every((item) => typeof item === 'string'));

const addRecoveryNotice = (key, backupKey, reason) => {
  if (recoveryNotices.some((notice) => notice.key === key)) {
    return;
  }

  recoveryNotices.push({ key, backupKey, reason });
};

const backupCorruptedValue = (key, rawValue) => {
  const backupKey = `${RECOVERY_KEY_PREFIX}_${key}_${Date.now()}`;

  try {
    localStorage.setItem(backupKey, rawValue);
    return backupKey;
  } catch (error) {
    console.error(`Failed to back up corrupted storage for ${key}:`, error);
    return null;
  }
};

const recoverCorruptedValue = (key, rawValue, fallbackValue, reason) => {
  const backupKey = typeof rawValue === 'string' ? backupCorruptedValue(key, rawValue) : null;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove corrupted storage for ${key}:`, error);
  }

  console.warn(`Recovered corrupted storage for ${key}: ${reason}`);
  addRecoveryNotice(key, backupKey, reason);
  return cloneValue(fallbackValue);
};

export const readStoredJson = (key, fallbackValue, validate) => {
  const rawValue = localStorage.getItem(key);

  if (rawValue === null) {
    return cloneValue(fallbackValue);
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (validate && !validate(parsedValue)) {
      return recoverCorruptedValue(key, rawValue, fallbackValue, 'shape');
    }

    return parsedValue;
  } catch (error) {
    return recoverCorruptedValue(key, rawValue, fallbackValue, error instanceof SyntaxError ? 'parse' : 'unknown');
  }
};

export const readStoredString = (key, fallbackValue, validate) => {
  const rawValue = localStorage.getItem(key);

  if (rawValue === null) {
    return fallbackValue;
  }

  if (validate && !validate(rawValue)) {
    return recoverCorruptedValue(key, rawValue, fallbackValue, 'shape');
  }

  return rawValue;
};

export const consumeStorageRecoveryNotices = () => {
  const notices = [...recoveryNotices];
  recoveryNotices.length = 0;
  return notices;
};

export const isValidStoredLinks = (value) => Array.isArray(value) && value.every((item) => (
  isPlainObject(item)
  && isOptionalString(item.id)
  && isOptionalString(item.title)
  && isOptionalString(item.url)
  && isOptionalString(item.shortMemo)
  && isOptionalString(item.detailMemo)
  && isOptionalString(item.browser)
  && isOptionalStringArray(item.tags)
  && isOptionalBoolean(item.isFavorite)
  && isOptionalBoolean(item.isHighlighted)
  && isOptionalNumber(item.order)
  && isOptionalString(item.groupId)
  && isOptionalString(item.group_id)
  && isOptionalString(item.categoryId)
  && isOptionalString(item.category_id)
));

export const isValidStoredCategories = (value) => Array.isArray(value) && value.every((item) => (
  isPlainObject(item)
  && (typeof item.id === 'string' || typeof item.id === 'number')
  && isOptionalString(item.name)
  && isOptionalNumber(item.order)
  && isOptionalNumber(item.order_index)
  && isOptionalString(item.groupId)
  && isOptionalString(item.group_id)
));

export const isValidStoredGroups = (value) => Array.isArray(value) && value.every((item) => (
  isPlainObject(item)
  && typeof item.id === 'string'
  && typeof item.name === 'string'
  && isOptionalBoolean(item.isCloud)
  && isOptionalBoolean(item.isMain)
  && isOptionalNumber(item.order)
  && isOptionalNumber(item.order_index)
));
