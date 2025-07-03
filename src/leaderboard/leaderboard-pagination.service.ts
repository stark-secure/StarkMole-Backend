import { Injectable, Logger } from "@nestjs/common"
import type {
  LeaderboardEntry,
  PaginatedLeaderboardQuery,
  PaginatedLeaderboardResponse,
  FilterOptions,
  LeaderboardFilters,
} from "../interfaces/leaderboard.interface"

@Injectable()
export class LeaderboardPaginationService {
  private readonly logger = new Logger(LeaderboardPaginationService.name)

  // Enhanced leaderboard with pagination and filtering
  async getPaginatedLeaderboard(
    entries: LeaderboardEntry[],
    query: PaginatedLeaderboardQuery,
  ): Promise<PaginatedLeaderboardResponse> {
    const {
      page = 1,
      limit = 20,
      type = "global",
      country,
      region,
      timeframe = "all_time",
      challengeType,
      startDate,
      endDate,
      search,
      minScore,
      maxScore,
      sortBy = "score",
      sortOrder = "desc",
    } = query

    // Validate pagination parameters
    const validatedPage = Math.max(1, page)
    const validatedLimit = Math.min(Math.max(1, limit), 100) // Max 100 items per page

    // Apply filters
    let filteredEntries = this.applyFilters(entries, {
      type,
      country,
      region,
      challengeType,
      dateRange: startDate && endDate ? { start: new Date(startDate), end: new Date(endDate) } : undefined,
      search,
      scoreRange: minScore !== undefined || maxScore !== undefined ? { min: minScore, max: maxScore } : undefined,
    })

    // Apply sorting
    filteredEntries = this.applySorting(filteredEntries, sortBy, sortOrder)

    // Calculate pagination
    const total = filteredEntries.length
    const totalPages = Math.ceil(total / validatedLimit)
    const offset = (validatedPage - 1) * validatedLimit
    const paginatedEntries = filteredEntries.slice(offset, offset + validatedLimit)

    // Update ranks for paginated results
    paginatedEntries.forEach((entry, index) => {
      entry.rank = offset + index + 1
    })

    // Get filter options
    const filterOptions = this.getFilterOptions(entries)

    // Get applied filters
    const appliedFilters = this.getAppliedFilters(query)

    return {
      data: paginatedEntries,
      meta: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages,
        hasNext: validatedPage < totalPages,
        hasPrev: validatedPage > 1,
      },
      filters: {
        applied: appliedFilters,
        available: filterOptions,
      },
      lastUpdated: new Date(),
    }
  }

  private applyFilters(entries: LeaderboardEntry[], filters: any): LeaderboardEntry[] {
    let filtered = [...entries]

    // Geographic filters
    if (filters.type === "country" && filters.country) {
      filtered = filtered.filter((entry) => entry.country === filters.country)
    }

    if (filters.type === "region" && filters.region) {
      filtered = filtered.filter((entry) => entry.region === filters.region)
    }

    // Challenge type filter
    if (filters.challengeType) {
      // In a real implementation, this would filter based on user's challenge participation
      // For demo, we'll simulate by filtering based on score ranges
      filtered = this.filterByChallengeType(filtered, filters.challengeType)
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter((entry) => {
        const entryDate = entry.lastActiveAt
        return entryDate >= filters.dateRange.start && entryDate <= filters.dateRange.end
      })
    }

    // Search filter (username or userId)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(
        (entry) =>
          entry.username.toLowerCase().includes(searchTerm) ||
          entry.displayName?.toLowerCase().includes(searchTerm) ||
          entry.userId.toLowerCase().includes(searchTerm),
      )
    }

    // Score range filter
    if (filters.scoreRange) {
      filtered = filtered.filter((entry) => {
        if (filters.scoreRange.min !== undefined && entry.score < filters.scoreRange.min) {
          return false
        }
        if (filters.scoreRange.max !== undefined && entry.score > filters.scoreRange.max) {
          return false
        }
        return true
      })
    }

    return filtered
  }

  private filterByChallengeType(entries: LeaderboardEntry[], challengeType: string): LeaderboardEntry[] {
    // Simulate challenge type filtering based on user activity patterns
    switch (challengeType) {
      case "daily":
        // Users with recent activity (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return entries.filter((entry) => entry.lastActiveAt >= oneDayAgo)

      case "weekly":
        // Users with activity in the last week
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return entries.filter((entry) => entry.lastActiveAt >= oneWeekAgo)

      case "monthly":
        // Users with activity in the last month
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return entries.filter((entry) => entry.lastActiveAt >= oneMonthAgo)

      case "puzzle":
        // Users with high puzzle completion
        return entries.filter((entry) => entry.totalPuzzlesCompleted >= 5)

      case "module":
        // Users with high module completion
        return entries.filter((entry) => entry.totalModulesCompleted >= 3)

      case "special_event":
        // Users with high completion percentage
        return entries.filter((entry) => entry.completionPercentage >= 80)

      default:
        return entries
    }
  }

  private applySorting(entries: LeaderboardEntry[], sortBy: string, sortOrder: string): LeaderboardEntry[] {
    const sorted = [...entries]

    sorted.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "score":
          comparison = b.score - a.score
          break
        case "puzzles":
          comparison = b.totalPuzzlesCompleted - a.totalPuzzlesCompleted
          break
        case "modules":
          comparison = b.totalModulesCompleted - a.totalModulesCompleted
          break
        case "completion":
          comparison = b.completionPercentage - a.completionPercentage
          break
        case "recent":
          comparison = b.lastActiveAt.getTime() - a.lastActiveAt.getTime()
          break
        default:
          comparison = b.score - a.score
      }

      return sortOrder === "asc" ? -comparison : comparison
    })

    return sorted
  }

  private getFilterOptions(entries: LeaderboardEntry[]): FilterOptions {
    const countries = [...new Set(entries.map((e) => e.country).filter(Boolean))]
    const regions = [...new Set(entries.map((e) => e.region).filter(Boolean))]
    const scores = entries.map((e) => e.score)

    return {
      challengeTypes: ["daily", "weekly", "monthly", "puzzle", "module", "special_event"],
      countries: countries.sort(),
      regions: regions.sort(),
      timeframes: ["daily", "weekly", "monthly", "all_time"],
      scoreRanges: {
        min: Math.min(...scores),
        max: Math.max(...scores),
      },
    }
  }

  private getAppliedFilters(query: PaginatedLeaderboardQuery): string[] {
    const applied: string[] = []

    if (query.type && query.type !== "global") applied.push(`type:${query.type}`)
    if (query.country) applied.push(`country:${query.country}`)
    if (query.region) applied.push(`region:${query.region}`)
    if (query.challengeType) applied.push(`challengeType:${query.challengeType}`)
    if (query.timeframe && query.timeframe !== "all_time") applied.push(`timeframe:${query.timeframe}`)
    if (query.search) applied.push(`search:${query.search}`)
    if (query.minScore !== undefined) applied.push(`minScore:${query.minScore}`)
    if (query.maxScore !== undefined) applied.push(`maxScore:${query.maxScore}`)
    if (query.sortBy && query.sortBy !== "score") applied.push(`sortBy:${query.sortBy}`)
    if (query.sortOrder && query.sortOrder !== "desc") applied.push(`sortOrder:${query.sortOrder}`)
    if (query.startDate) applied.push(`startDate:${query.startDate}`)
    if (query.endDate) applied.push(`endDate:${query.endDate}`)

    return applied
  }

  // Cursor-based pagination for better performance with large datasets
  async getCursorPaginatedLeaderboard(
    entries: LeaderboardEntry[],
    cursor?: string,
    limit = 20,
    filters?: LeaderboardFilters,
  ): Promise<{
    data: LeaderboardEntry[]
    nextCursor?: string
    prevCursor?: string
    hasNext: boolean
    hasPrev: boolean
  }> {
    // Apply filters
    let filteredEntries = entries
    if (filters) {
      filteredEntries = this.applyFilters(entries, filters)
    }

    // Sort by score (primary) and userId (secondary for consistency)
    filteredEntries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.userId.localeCompare(b.userId)
    })

    let startIndex = 0
    if (cursor) {
      // Find the position of the cursor
      const cursorIndex = filteredEntries.findIndex((entry) => this.encodeCursor(entry) === cursor)
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1
      }
    }

    const endIndex = Math.min(startIndex + limit, filteredEntries.length)
    const paginatedEntries = filteredEntries.slice(startIndex, endIndex)

    // Generate cursors
    const nextCursor =
      endIndex < filteredEntries.length ? this.encodeCursor(paginatedEntries[paginatedEntries.length - 1]) : undefined
    const prevCursor = startIndex > 0 ? this.encodeCursor(filteredEntries[startIndex - 1]) : undefined

    return {
      data: paginatedEntries,
      nextCursor,
      prevCursor,
      hasNext: endIndex < filteredEntries.length,
      hasPrev: startIndex > 0,
    }
  }

  private encodeCursor(entry: LeaderboardEntry): string {
    // Create a cursor based on score and userId for consistent ordering
    const cursorData = {
      score: entry.score,
      userId: entry.userId,
    }
    return Buffer.from(JSON.stringify(cursorData)).toString("base64")
  }

  private decodeCursor(cursor: string): { score: number; userId: string } {
    try {
      return JSON.parse(Buffer.from(cursor, "base64").toString())
    } catch {
      throw new Error("Invalid cursor format")
    }
  }

  // Search functionality with fuzzy matching
  searchUsers(entries: LeaderboardEntry[], searchTerm: string, limit = 10): LeaderboardEntry[] {
    if (!searchTerm.trim()) return []

    const term = searchTerm.toLowerCase().trim()
    const results: Array<{ entry: LeaderboardEntry; score: number }> = []

    entries.forEach((entry) => {
      let matchScore = 0

      // Exact username match (highest priority)
      if (entry.username.toLowerCase() === term) {
        matchScore += 100
      }
      // Username starts with search term
      else if (entry.username.toLowerCase().startsWith(term)) {
        matchScore += 80
      }
      // Username contains search term
      else if (entry.username.toLowerCase().includes(term)) {
        matchScore += 60
      }

      // Display name matching
      if (entry.displayName) {
        if (entry.displayName.toLowerCase() === term) {
          matchScore += 90
        } else if (entry.displayName.toLowerCase().startsWith(term)) {
          matchScore += 70
        } else if (entry.displayName.toLowerCase().includes(term)) {
          matchScore += 50
        }
      }

      // User ID matching
      if (entry.userId.toLowerCase().includes(term)) {
        matchScore += 40
      }

      if (matchScore > 0) {
        results.push({ entry, score: matchScore })
      }
    })

    // Sort by match score (descending) and then by leaderboard score
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.entry.score - a.entry.score
    })

    return results.slice(0, limit).map((result) => result.entry)
  }
}
