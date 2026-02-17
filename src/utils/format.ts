const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
};

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

/** 「2026年2月17日(火)」形式 */
export const formatDate = (isoString: string): string =>
  new Date(isoString).toLocaleDateString("ja-JP", DATE_OPTIONS);

/** 「10:00」形式 */
export const formatTime = (isoString: string): string =>
  new Date(isoString).toLocaleTimeString("ja-JP", TIME_OPTIONS);

/** 「2026/2/17 10:00:00」形式 */
export const formatDateTime = (isoString: string): string =>
  new Date(isoString).toLocaleString("ja-JP");
