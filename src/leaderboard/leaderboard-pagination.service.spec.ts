import { Test, type TestingModule } from "@nestjs/testing"
import { LeaderboardPaginationService } from "../leaderboard-pagination.service"
import type { LeaderboardEntry, PaginatedLeaderboardQuery } from "../../interfaces/leaderboard.interface"

describe("LeaderboardPaginationService", () => {
  let service: LeaderboardPaginationService

  const mockEntries: LeaderboardEntry[] = [
    {
      userId: "user1",
      username: "AliceWonder",
      displayName: "Alice Johnson",
      score: 2500,
      totalPuzzlesCompleted: 30,
      totalModulesCompleted: 20,
      averageScore: 95,
      completionPercentage: 90,
      lastActiveAt: new Date("2024-01-15"),
      country: "US",
      region: "North America",
      rank: 1,
    },
    {
      userId: "user2",
      username: "BobBuilder",
      displayName: "Bob Smith",
      score: 2200,
      totalPuzzlesCompleted: 25,
      totalModulesCompleted: 15,
      averageScore: 88,
      completionPercentage: 75,
      lastActiveAt: new Date("2024-01-14"),
      country: "CA",
      region: "North America",
      rank: 2,
    },
    {
      userId: "user3",
      username: "CharlieChamp",
      displayName: "Charlie Brown",
      score: 1800,
      totalPuzzlesCompleted: 20,
      totalModulesCompleted: 12,
      averageScore: 90,
      completionPercentage: 60,
      lastActiveAt: new Date("2024-01-13"),
      country: "UK",
      region: "Europe",
      rank: 3,
    },
    {
      userId: "user4",
      username: "DianaQueen",
      displayName: "Diana Prince",
      score: 1500,
      totalPuzzlesCompleted: 15,
      totalModulesCompleted: 10,
      averageScore: 85,
      completionPercentage: 50,
      lastActiveAt: new Date("2024-01-12"),
      country: "AU",
      region: "Oceania",
      rank: 4,
    },
    {
      userId: "user5",
      username: "EveExplorer",
      displayName: "Eve Wilson",
      score: 1200,
      totalPuzzlesCompleted: 12,
      totalModulesCompleted: 8,
      averageScore: 80,
      completionPercentage: 40,
      lastActiveAt: new Date("2024-01-11"),
      country: "DE",
      region: "Europe",
      rank: 5,
    },
  ]

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeaderboardPaginationService],
    }).compile()

    service = module.get<LeaderboardPaginationService>(LeaderboardPaginationService)
  })

  describe("getPaginatedLeaderboard", () => {
    it("should return paginated results with default parameters", async () => {
      const query: PaginatedLeaderboardQuery = {}
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.data).toHaveLength(5) // All entries fit in default page size
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 5,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
    })

    it("should handle pagination correctly", async () => {
      const query: PaginatedLeaderboardQuery = { page: 1, limit: 2 }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.data).toHaveLength(2)
      expect(result.meta).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      })
      expect(result.data[0].rank).toBe(1)
      expect(result.data[1].rank).toBe(2)
    })

    it("should handle second page correctly", async () => {
      const query: PaginatedLeaderboardQuery = { page: 2, limit: 2 }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.data).toHaveLength(2)
      expect(result.meta).toEqual({
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      })
      expect(result.data[0].rank).toBe(3)
      expect(result.data[1].rank).toBe(4)
    })

    it("should filter by country", async () => {
      const query: PaginatedLeaderboardQuery = { type: "country", country: "US" }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].country).toBe("US")
      expect(result.data[0].username).toBe("AliceWonder")
    })

    it("should filter by region", async () => {
      const query: PaginatedLeaderboardQuery = { type: "region", region: "Europe" }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.data).toHaveLength(2)
      expect(result.data.every((entry) => entry.region === "Europe")).toBe(true)
    })

    it("should filter by search term", async () => {
      const query: PaginatedLeaderboardQuery = { search: "alice" }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].username).toBe("AliceWonder")
    })

    it("should filter by score range", async () => {
      const query: PaginatedLeaderboardQuery = { minScore: 2000, maxScore: 2500 }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.data).toHaveLength(2)
      expect(result.data.every((entry) => entry.score >= 2000 && entry.score <= 2500)).toBe(true)
    })

    it("should sort by different criteria", async () => {
      const query: PaginatedLeaderboardQuery = { sortBy: "puzzles", sortOrder: "desc" }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.data[0].totalPuzzlesCompleted).toBe(30) // Highest puzzle count
      expect(result.data[1].totalPuzzlesCompleted).toBe(25)
    })

    it("should sort in ascending order", async () => {
      const query: PaginatedLeaderboardQuery = { sortBy: "score", sortOrder: "asc" }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.data[0].score).toBe(1200) // Lowest score first
      expect(result.data[4].score).toBe(2500) // Highest score last
    })

    it("should handle challenge type filtering", async () => {
      const query: PaginatedLeaderboardQuery = { challengeType: "puzzle" }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      // Should filter users with >= 5 puzzles completed
      expect(result.data.every((entry) => entry.totalPuzzlesCompleted >= 5)).toBe(true)
    })

    it("should handle date range filtering", async () => {
      const query: PaginatedLeaderboardQuery = {
        startDate: "2024-01-13",
        endDate: "2024-01-15",
      }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.data).toHaveLength(3) // Users active between these dates
    })

    it("should validate pagination boundaries", async () => {
      const query: PaginatedLeaderboardQuery = { page: 0, limit: -5 }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.meta.page).toBe(1) // Should default to page 1
      expect(result.meta.limit).toBe(1) // Should default to minimum limit
    })

    it("should enforce maximum limit", async () => {
      const query: PaginatedLeaderboardQuery = { limit: 200 }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.meta.limit).toBe(100) // Should cap at 100
    })

    it("should include filter options in response", async () => {
      const query: PaginatedLeaderboardQuery = {}
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.filters?.available).toBeDefined()
      expect(result.filters?.available.countries).toContain("US")
      expect(result.filters?.available.regions).toContain("Europe")
      expect(result.filters?.available.challengeTypes).toContain("puzzle")
    })

    it("should track applied filters", async () => {
      const query: PaginatedLeaderboardQuery = {
        country: "US",
        search: "alice",
        minScore: 2000,
      }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.filters?.applied).toContain("country:US")
      expect(result.filters?.applied).toContain("search:alice")
      expect(result.filters?.applied).toContain("minScore:2000")
    })
  })

  describe("getCursorPaginatedLeaderboard", () => {
    it("should return first page without cursor", async () => {
      const result = await service.getCursorPaginatedLeaderboard(mockEntries, undefined, 2)

      expect(result.data).toHaveLength(2)
      expect(result.hasNext).toBe(true)
      expect(result.hasPrev).toBe(false)
      expect(result.nextCursor).toBeDefined()
    })

    it("should handle cursor-based pagination", async () => {
      // Get first page
      const firstPage = await service.getCursorPaginatedLeaderboard(mockEntries, undefined, 2)

      // Get second page using cursor
      const secondPage = await service.getCursorPaginatedLeaderboard(mockEntries, firstPage.nextCursor, 2)

      expect(secondPage.data).toHaveLength(2)
      expect(secondPage.hasPrev).toBe(true)
      expect(secondPage.data[0].userId).not.toBe(firstPage.data[0].userId) // Different entries
    })
  })

  describe("searchUsers", () => {
    it("should find users by exact username match", async () => {
      const results = service.searchUsers(mockEntries, "AliceWonder")

      expect(results).toHaveLength(1)
      expect(results[0].username).toBe("AliceWonder")
    })

    it("should find users by partial username match", async () => {
      const results = service.searchUsers(mockEntries, "alice")

      expect(results).toHaveLength(1)
      expect(results[0].username).toBe("AliceWonder")
    })

    it("should find users by display name", async () => {
      const results = service.searchUsers(mockEntries, "johnson")

      expect(results).toHaveLength(1)
      expect(results[0].displayName).toBe("Alice Johnson")
    })

    it("should find users by user ID", async () => {
      const results = service.searchUsers(mockEntries, "user1")

      expect(results).toHaveLength(1)
      expect(results[0].userId).toBe("user1")
    })

    it("should return empty array for empty search", async () => {
      const results = service.searchUsers(mockEntries, "")

      expect(results).toHaveLength(0)
    })

    it("should limit search results", async () => {
      const results = service.searchUsers(mockEntries, "user", 2)

      expect(results).toHaveLength(2)
    })

    it("should rank exact matches higher", async () => {
      const results = service.searchUsers(mockEntries, "bob")

      expect(results[0].username).toBe("BobBuilder") // Exact match should be first
    })
  })

  describe("edge cases", () => {
    it("should handle empty entries array", async () => {
      const query: PaginatedLeaderboardQuery = {}
      const result = await service.getPaginatedLeaderboard([], query)

      expect(result.data).toHaveLength(0)
      expect(result.meta.total).toBe(0)
      expect(result.meta.totalPages).toBe(0)
    })

    it("should handle page beyond available data", async () => {
      const query: PaginatedLeaderboardQuery = { page: 10, limit: 20 }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.data).toHaveLength(0)
      expect(result.meta.hasNext).toBe(false)
      expect(result.meta.hasPrev).toBe(true)
    })

    it("should handle filters that return no results", async () => {
      const query: PaginatedLeaderboardQuery = { search: "nonexistent" }
      const result = await service.getPaginatedLeaderboard(mockEntries, query)

      expect(result.data).toHaveLength(0)
      expect(result.meta.total).toBe(0)
    })
  })
})
