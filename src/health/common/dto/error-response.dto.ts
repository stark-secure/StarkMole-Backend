import { ApiProperty } from "@nestjs/swagger"

export class ErrorResponseDto {
  @ApiProperty({
    description: "HTTP status code",
    example: 400,
  })
  statusCode: number

  @ApiProperty({
    description: "Error message or array of validation errors",
    oneOf: [
      { type: "string", example: "Bad Request" },
      { type: "array", items: { type: "string" }, example: ["email must be an email"] },
    ],
  })
  message: string | string[]

  @ApiProperty({
    description: "Error type",
    example: "Bad Request",
  })
  error: string

  @ApiProperty({
    description: "Request timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  timestamp: string

  @ApiProperty({
    description: "Request path",
    example: "/api/users",
  })
  path: string
}
