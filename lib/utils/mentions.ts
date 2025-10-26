// Utility functions for @username mentions in comments

export interface Mention {
  username: string
  fullMatch: string
  startIndex: number
  endIndex: number
}

/**
 * Extract mentions from text (format: @username or @John Doe)
 * Returns array of mention objects
 */
export function extractMentions(text: string): Mention[] {
  const mentionRegex = /@(\w+(?:\s+\w+)*)/g
  const mentions: Mention[] = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      username: match[1].trim(),
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return mentions
}

/**
 * Highlight mentions in text for display
 */
export function highlightMentions(text: string): string {
  const mentionRegex = /@(\w+(?:\s+\w+)*)/g
  return text.replace(mentionRegex, '<span class="mention bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1 rounded">$&</span>')
}

/**
 * Replace mentions with plain text (for notifications)
 */
export function removeMentionFormat(text: string): string {
  const mentionRegex = /@(\w+)/g
  return text.replace(mentionRegex, '$1')
}

