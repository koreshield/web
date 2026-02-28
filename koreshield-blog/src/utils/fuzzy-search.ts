/**
 * Fuzzy search utilities for enhanced search functionality
 */

export interface FuzzySearchResult {
    item: any;
    score: number;
    matches: number[];
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,     // deletion
                matrix[j - 1][i] + 1,     // insertion
                matrix[j - 1][i - 1] + indicator, // substitution
            );
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Fuzzy search implementation with scoring
 */
export function fuzzySearch<T>(
    query: string,
    items: T[],
    getSearchText: (item: T) => string,
    options: {
        threshold?: number;
        maxResults?: number;
        caseSensitive?: boolean;
    } = {}
): FuzzySearchResult[] {
    const { threshold = 0.6, maxResults = 10, caseSensitive = false } = options;

    if (!query.trim()) return [];

    const queryLower = caseSensitive ? query : query.toLowerCase();

    const results: FuzzySearchResult[] = items
        .map((item) => {
            const searchText = getSearchText(item);
            const textLower = caseSensitive ? searchText : searchText.toLowerCase();

            // Exact match gets highest score
            if (textLower.includes(queryLower)) {
                const exactMatch = textLower === queryLower;
                return {
                    item,
                    score: exactMatch ? 1 : 0.9,
                    matches: [textLower.indexOf(queryLower)]
                };
            }

            // Fuzzy matching with Levenshtein distance
            const distance = levenshteinDistance(queryLower, textLower);
            const maxLength = Math.max(queryLower.length, textLower.length);
            const similarity = 1 - (distance / maxLength);

            if (similarity >= threshold) {
                return {
                    item,
                    score: similarity,
                    matches: [] // Could implement match positions later
                };
            }

            return null;
        })
        .filter((result): result is FuzzySearchResult => result !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

    return results;
}

/**
 * Simple fuzzy match for strings (returns boolean)
 */
export function fuzzyMatch(query: string, text: string, threshold: number = 0.6): boolean {
    if (!query.trim()) return true;

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    // Exact substring match
    if (textLower.includes(queryLower)) return true;

    // Fuzzy matching
    const distance = levenshteinDistance(queryLower, textLower);
    const maxLength = Math.max(queryLower.length, textLower.length);
    const similarity = 1 - (distance / maxLength);

    return similarity >= threshold;
}