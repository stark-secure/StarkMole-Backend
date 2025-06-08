import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import { type Challenge, ChallengeType, DifficultyLevel } from "../entities/challenge.entity"
import type { ScheduledChallenge } from "../entities/scheduled-challenge.entity"
import type { DynamicDifficultyService } from "./dynamic-difficulty.service"
import type { CreateChallengeDto } from "../dto/create-challenge.dto"

interface ChallengeTemplate {
  title: string
  description: string
  type: ChallengeType
  difficulty: DifficultyLevel
  content: any
  solution: any
  basePoints: number
  timeLimit: number
  tags: string[]
}

@Injectable()
export class ChallengeGenerationService {
  private readonly logger = new Logger(ChallengeGenerationService.name)

  constructor(
    private readonly challengeRepository: Repository<Challenge>,
    private readonly scheduledChallengeRepository: Repository<ScheduledChallenge>,
    private readonly dynamicDifficultyService: DynamicDifficultyService,
  ) {}

  async generateChallengeForUser(userId: string, challengeType: ChallengeType): Promise<Challenge> {
    const userDifficulty = await this.dynamicDifficultyService.getUserDifficulty(userId, challengeType)

    // Try to find existing challenges that match the user's difficulty
    const existingChallenges = await this.challengeRepository.find({
      where: {
        type: challengeType,
        difficulty: userDifficulty,
        isActive: true,
      },
    })

    if (existingChallenges.length > 0) {
      // Return a random existing challenge
      const randomIndex = Math.floor(Math.random() * existingChallenges.length)
      return existingChallenges[randomIndex]
    }

    // Generate a new challenge if none exist
    return this.createDynamicChallenge(challengeType, userDifficulty)
  }

  async generateGlobalChallenge(challengeType: ChallengeType, difficulty: DifficultyLevel): Promise<Challenge> {
    return this.createDynamicChallenge(challengeType, difficulty)
  }

  private async createDynamicChallenge(type: ChallengeType, difficulty: DifficultyLevel): Promise<Challenge> {
    const template = this.getChallengeTemplate(type, difficulty)

    const challenge = this.challengeRepository.create({
      ...template,
      createdBy: null, // System generated
    })

    const savedChallenge = await this.challengeRepository.save(challenge)
    this.logger.log(`Generated new ${type} challenge with difficulty ${difficulty}: ${savedChallenge.id}`)

    return savedChallenge
  }

  private getChallengeTemplate(type: ChallengeType, difficulty: DifficultyLevel): ChallengeTemplate {
    const templates = this.getChallengeTemplates()
    const typeTemplates = templates[type] || []
    const difficultyTemplates = typeTemplates.filter((t) => t.difficulty === difficulty)

    if (difficultyTemplates.length === 0) {
      // Fallback to a basic template
      return this.getBasicTemplate(type, difficulty)
    }

    const randomIndex = Math.floor(Math.random() * difficultyTemplates.length)
    return difficultyTemplates[randomIndex]
  }

  private getChallengeTemplates(): Record<ChallengeType, ChallengeTemplate[]> {
    return {
      [ChallengeType.CODING]: [
        {
          title: "Two Sum Problem",
          description:
            "Given an array of integers and a target sum, return indices of two numbers that add up to the target.",
          type: ChallengeType.CODING,
          difficulty: DifficultyLevel.EASY,
          content: {
            language: "javascript",
            starterCode: "function twoSum(nums, target) {\n  // Your code here\n}",
            testCases: [
              { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
              { input: [[3, 2, 4], 6], expected: [1, 2] },
            ],
          },
          solution: {
            code: "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}",
          },
          basePoints: 100,
          timeLimit: 1800,
          tags: ["arrays", "hash-table"],
        },
        {
          title: "Binary Tree Traversal",
          description: "Implement inorder traversal of a binary tree.",
          type: ChallengeType.CODING,
          difficulty: DifficultyLevel.MEDIUM,
          content: {
            language: "javascript",
            starterCode: "function inorderTraversal(root) {\n  // Your code here\n}",
            testCases: [
              {
                input: [
                  { val: 1, left: null, right: { val: 2, left: { val: 3, left: null, right: null }, right: null } },
                ],
                expected: [1, 3, 2],
              },
            ],
          },
          solution: {
            code: "function inorderTraversal(root) {\n  const result = [];\n  function traverse(node) {\n    if (node) {\n      traverse(node.left);\n      result.push(node.val);\n      traverse(node.right);\n    }\n  }\n  traverse(root);\n  return result;\n}",
          },
          basePoints: 200,
          timeLimit: 2400,
          tags: ["binary-tree", "recursion"],
        },
      ],
      [ChallengeType.QUIZ]: [
        {
          title: "JavaScript Fundamentals Quiz",
          description: "Test your knowledge of JavaScript basics.",
          type: ChallengeType.QUIZ,
          difficulty: DifficultyLevel.BEGINNER,
          content: {
            questions: [
              {
                question: "What is the correct way to declare a variable in JavaScript?",
                options: ["var x = 5;", "variable x = 5;", "v x = 5;", "declare x = 5;"],
                correctAnswer: 0,
              },
              {
                question: "Which method is used to add an element to the end of an array?",
                options: ["push()", "add()", "append()", "insert()"],
                correctAnswer: 0,
              },
            ],
          },
          solution: {
            answers: [0, 0],
          },
          basePoints: 50,
          timeLimit: 600,
          tags: ["javascript", "fundamentals"],
        },
      ],
      [ChallengeType.PROBLEM_SOLVING]: [
        {
          title: "Logic Puzzle: River Crossing",
          description:
            "A farmer needs to cross a river with a fox, chicken, and corn. The boat can only carry the farmer and one item. How can all cross safely?",
          type: ChallengeType.PROBLEM_SOLVING,
          difficulty: DifficultyLevel.MEDIUM,
          content: {
            scenario: "River crossing puzzle",
            constraints: [
              "Boat holds farmer + 1 item only",
              "Fox cannot be alone with chicken",
              "Chicken cannot be alone with corn",
            ],
            question: "Describe the sequence of crossings.",
          },
          solution: {
            steps: [
              "Farmer takes chicken across",
              "Farmer returns alone",
              "Farmer takes fox across",
              "Farmer brings chicken back",
              "Farmer takes corn across",
              "Farmer returns alone",
              "Farmer takes chicken across",
            ],
          },
          basePoints: 150,
          timeLimit: 1200,
          tags: ["logic", "puzzle"],
        },
      ],
      [ChallengeType.ALGORITHM]: [
        {
          title: "Sorting Algorithm Analysis",
          description: "Analyze the time complexity of different sorting algorithms.",
          type: ChallengeType.ALGORITHM,
          difficulty: DifficultyLevel.HARD,
          content: {
            question: "What is the average time complexity of QuickSort?",
            options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
            followUp: "Explain why QuickSort can degrade to O(n²) in the worst case.",
          },
          solution: {
            answer: 1,
            explanation:
              "QuickSort has O(n log n) average case complexity but O(n²) worst case when the pivot is always the smallest or largest element.",
          },
          basePoints: 300,
          timeLimit: 1800,
          tags: ["algorithms", "complexity", "sorting"],
        },
      ],
    }
  }

  private getBasicTemplate(type: ChallengeType, difficulty: DifficultyLevel): ChallengeTemplate {
    return {
      title: `${type} Challenge - Level ${difficulty}`,
      description: `A ${difficulty}-level ${type} challenge.`,
      type,
      difficulty,
      content: { placeholder: true },
      solution: { placeholder: true },
      basePoints: difficulty * 50,
      timeLimit: 1800,
      tags: [type.toLowerCase()],
    }
  }

  async createChallenge(createChallengeDto: CreateChallengeDto): Promise<Challenge> {
    const challenge = this.challengeRepository.create(createChallengeDto)
    return this.challengeRepository.save(challenge)
  }

  async findChallengesByDifficulty(difficulty: DifficultyLevel, type?: ChallengeType): Promise<Challenge[]> {
    const where: any = { difficulty, isActive: true }
    if (type) {
      where.type = type
    }

    return this.challengeRepository.find({ where })
  }
}
